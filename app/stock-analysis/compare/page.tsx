import {buildMetadata} from "@/lib/seo";
import StockAnalysisRedirect from "@/components/stock-analysis/StockAnalysisRedirect";
export const metadata={...buildMetadata({title:"市場分析トップへ移動",description:"TUTTO市場分析トップへ移動します。",path:"/stock-analysis/"}),robots:{index:false,follow:true}};
export default function ComparePage(){return <StockAnalysisRedirect/>;}
