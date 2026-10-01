import type {StockReport} from "./stock-analysis";
import {evaluateSummaryScore,type ScoringCriterion,type ScoringState,type SummaryDimensionId} from "./summary-score";
/** Consumer-only shape of optional formal output. No dependency on an unreleased evaluator. */
type FactMetadata={companyId:string;securityCode:string;documentId:string;sourceHeading:string;sourceLocation:string;
  fiscalPeriod:string;filingDate:string;retrievedAt:string;ruleVersion:string;parserVersion:string;confidence:string;url:string};
type EvidenceDecision={status:ScoringState;reason:string;evidenceRefs:string[];
  predicateTrace:{predicate:string;outcome:string}[]};
type SummaryEvidenceInput={ruleVersion:string;fiscalDate:string|null;business:EvidenceDecision;
  cashFlowSustainability:EvidenceDecision;majorRisk:EvidenceDecision;provenance:Record<string,FactMetadata>};
/** Reads formal outputs only. No financial threshold, prose inference, provider access or API mutation. */
export function summaryScoreForReport(report:StockReport) {
  const fiscalDate=report.metadata?.fiscalDate,result=(report as StockReport & {researchEvidence?:SummaryEvidenceInput}).researchEvidence;
  const current=!!fiscalDate&&result?.fiscalDate===fiscalDate;
  const code=report.symbol.split(".")[0];
  const metadata=(ref:string):FactMetadata|undefined=>{
    const m=result?.provenance[ref];
    if(!m||m.securityCode!==code||m.ruleVersion!==result?.ruleVersion||m.confidence!=="CONFIRMED"||
      !m.companyId||!m.documentId||!m.sourceHeading||!m.sourceLocation||!m.parserVersion||!m.fiscalPeriod||
      !m.filingDate||!Number.isFinite(Date.parse(m.retrievedAt)))return;
    try{const u=new URL(m.url);if(u.protocol!=="https:"||u.hostname!=="disclosure2.edinet-fsa.go.jp"||u.pathname!=="/WZEK0040.aspx")return;}catch{return;}
    return m;
  };
  // Same Fact under aliased IDs shares one identity; a shared document alone is not duplication.
  const boundRefs=(refs:string[])=>{
    const all=refs.map(metadata);if(!refs.length||all.some(m=>!m))return [];
    return [...new Set(all.map(m=>JSON.stringify([m!.companyId,m!.documentId,m!.sourceLocation,m!.fiscalPeriod])))];
  };
  const unknown=(id:SummaryDimensionId,reason:string):ScoringCriterion=>({id,state:"UNVERIFIED",weight:1,reason,evidenceRefs:[]});
  const decision=(id:SummaryDimensionId,d:EvidenceDecision|undefined,rule:string):ScoringCriterion=>{
    if(!current||!d||d.status==="UNVERIFIED")return unknown(id,d?.reason??"正式な判定結果が未取得です。");
    const refs=boundRefs(d.evidenceRefs),outcome=d.status==="NOT_MET"?"FAIL":"PASS";
    if(!refs.length||!d.predicateTrace.some(p=>p.predicate.startsWith(rule+"/")&&p.outcome===outcome))
      return unknown(id,"正式な判定と一次資料の対応を確認できません。");
    return {id:rule,state:d.status,weight:1,reason:d.reason,evidenceRefs:refs};
  };
  const condition=(id:SummaryDimensionId,ruleId:string,prefix:string):ScoringCriterion=>{
    const status=report.researchStatus;
    const trace=status&&status.sourceFiscalYear===fiscalDate?status.ruleTrace.filter(t=>t.ruleId===ruleId&&t.reason.startsWith(prefix)&&
      ["MET","NOT_MET","UNVERIFIED"].includes(t.inputState)):[];
    if(!current||trace?.length!==1)return unknown(id,"正式な品質・条件成立の判定が未確認です。");
    const t=trace[0],refs=boundRefs(t.evidenceRefs);
    if(t.inputState==="UNVERIFIED"||!refs.length||t.inputState==="MET"&&t.result!=="PASS")return unknown(id,t.reason);
    return {id:ruleId+"/"+id,state:t.inputState as ScoringState,weight:1,reason:t.reason,evidenceRefs:refs};
  };
  // One existing formal assessment per dimension: weight1 is an identity conversion, not a new internal allocation.
  return evaluateSummaryScore({business:[decision("business",result?.business,"R11")],
    profitability:[unknown("profitability","既存出力には収益性の正式な合否判定がありません。")],
    cashFlow:[decision("cashFlow",result?.cashFlowSustainability,"R12")],
    growth:[condition("growth","R8","成長変化")],financialHealth:[condition("financialHealth","R1/R2","財務健全性")],
    risk:[decision("risk",result?.majorRisk,"R13")],
    valuation:[report.metadata?.valuationStatus==="LIMITED"?unknown("valuation","市場価格ベースの評価が未取得です。"):condition("valuation","R4","現在価格との比較の研究条件")],
  });
}
