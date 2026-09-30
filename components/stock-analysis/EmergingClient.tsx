"use client";
import {useRouter,useSearchParams} from "next/navigation";
import {normalizeStockInput} from "@/lib/stock-analysis";
import {ResultStatus,useStockReport} from "./AnalysisClient";
import StockSearch from "./StockSearch";
import EvidenceView from "./EvidenceView";
import {StockLink} from "./StockUI";
export default function EmergingClient() {
  const params=useSearchParams(),router=useRouter(),symbol=normalizeStockInput(params.get("symbol")??"");
  const {result,retry}=useStockReport(symbol.length<=100?symbol:"");
  const emerging=result?.status==="ready"?result.report.emerging:null;
  return <section className="mt-6">
    <StockSearch destination="/stock-analysis/emerging-growth/" key={symbol} initialValue={symbol}/>
    {symbol && <div className="card mt-6 p-5 sm:p-8"><h2 className="text-xl font-bold">銘柄別の変化観測：{result?.status==="ready"?result.report.companyName:symbol}</h2>
      <ResultStatus result={result} retry={retry} onSelect={selected=>router.push("/stock-analysis/emerging-growth/?"+new URLSearchParams({symbol:selected}))}/>
      {emerging && <>
        <p className="mt-4 leading-7">{emerging.observation}</p>
        <dl className="mt-4 space-y-4">{emerging.evidence.map((item,index)=><EvidenceView item={item} key={index}/>)}</dl>
        <p className="mt-4 text-sm leading-7">不足する証拠：{emerging.missing.join(" / ")}。分類・認知段階は未確認です。</p>
        <p className="mt-4 text-sm leading-7">次の確認：{emerging.nextConfirmation}</p>
        <p className="mt-4 text-sm leading-7">リスクと反証は完全分析で確認してください。成長率の変化だけで研究候補を推薦しません。</p>
        <div className="mt-4"><StockLink href={"/stock-analysis/analyze/?"+new URLSearchParams({symbol:result!.status==="ready"?result!.report.symbol:symbol})}>完全分析・Counter-thesisを見る</StockLink></div>
      </>}
    </div>}
  </section>;
}
