import {researchWithEvidence} from "./research-evidence/adapter";
import type {EvidenceBundle} from "./research-evidence/model";
import type {CompanyData} from "./model";
import { researchStatusForCompany, researchStatusForFailure } from "./research-status";
import type { AnalysisResult, ComparisonResult, ReportIssue, WatchlistEntry, WatchlistResult } from "../../lib/stock-analysis";
import { usPrimaryUnavailableCode } from "../../lib/stock-analysis-status";
import { buildReport, comparisonWarnings } from "./engine";
import { normalizeInput, resolveSymbol } from "./resolver";
import { StockError, type StockProvider } from "./model";
export function failure(error:unknown):Exclude<AnalysisResult,{status:"ready"}> {
  const safe=error instanceof StockError?error:new StockError("DATA_PROVIDER_ERROR","分析サービスでエラーが発生しました。時間をおいて再試行してください。");
  return {status:safe.code==="SYMBOL_NOT_FOUND"?"not-found":[usPrimaryUnavailableCode,"CONFIGURATION_REQUIRED"].includes(safe.code)?"unavailable":"error",
    message:safe.message,code:safe.code,researchStatus:researchStatusForFailure(),candidates:safe.candidates,
    retryable:["RATE_LIMITED","DATA_PROVIDER_ERROR"].includes(safe.code)};
}
export class AnalysisService {
  constructor(private provider:StockProvider,private evidence?:(company:CompanyData)=>EvidenceBundle) {}
  async analyze(input:string,growthMode:"STANDARD"|"EMERGING"="STANDARD"):Promise<AnalysisResult> {
    try {
      const candidate=await resolveSymbol(input,this.provider);
      const company=await this.provider.company(candidate);
      const evidenceResult=this.evidence&&company.provider==="EDINET"?researchWithEvidence(company,this.evidence(company),growthMode):{researchStatus:researchStatusForCompany(company,growthMode)};
      return {status:"ready",report:{...buildReport(company),...evidenceResult}};
    } catch (error) { return failure(error); }
  }
  async compare(a:string,b:string):Promise<ComparisonResult> {
    if (normalizeInput(a)===normalizeInput(b)) throw new StockError("INVALID_INPUT","異なる2銘柄を入力してください。");
    const [first,second]=await Promise.all([this.analyze(a),this.analyze(b)]);
    const warnings=first.status==="ready" && second.status==="ready"?comparisonWarnings(first.report,second.report):([first,second].some(result=>result.status!=="ready" && result.code===usPrimaryUnavailableCode)?["米国株側は一次資料接続の確認中のため比較を保留しています。日本株の個別分析は利用できます。"]:["比較する企業データが揃っていません。候補選択・個別分析で取得状況を確認してください。"]);
    return {status:"ready",a:first,b:second,warnings};
  }
  async watchlist(symbols:string[]):Promise<WatchlistResult> {
    const entries:WatchlistEntry[]=[],issues:ReportIssue[]=[];
    const inputs=[...new Set(symbols)].slice(0,4);
    for(let offset=0;offset<inputs.length;offset+=2){
      const batch=inputs.slice(offset,offset+2);
      const results=await Promise.all(batch.map(symbol=>this.analyze(symbol)));
      results.forEach((result,index)=>{
        const symbol=batch[index];
        if(result.status!=="ready"){issues.push({code:result.code??"DATA_PROVIDER_ERROR",message:symbol+"："+result.message,symbol,researchStatus:result.researchStatus});return;}
        const report=result.report,evidence=(report.sections.growth??[]).filter(item=>item.kind==="CALCULATION");
        entries.push({companyName:report.companyName,symbol:report.symbol,
          researchStatus:report.researchStatus,
          categories:[/\.(TSE|JP)$/.test(report.symbol)?"Japan":"US"],
          researchReason:"管理者が指定した研究対象です。売上・利益・CFの変化と持続性を検証します。自動推薦・優劣判定ではありません。",
          evidence,sourceUrl:(report.sections.notes??[]).find(item=>item.sourceTitle==="企業公式サイト")?.sourceUrl??(report.sections.performance??[]).find(item=>item.kind==="FACT")?.sourceUrl??"https://www.sec.gov/edgar/search/",
          asOf:report.metadata?.providerUpdatedAt??"提供元更新日未取得",
          risk:(report.sections.risk??[]).map(item=>item.label+": "+item.value).join(" / "),
          nextConfirmation:(report.sections.earnings??[])[0]?.value??"企業IRで次回決算を確認",
        });
      });
    }
    return {status:"ready",entries,issues};
  }
}
