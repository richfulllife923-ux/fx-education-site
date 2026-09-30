import { StockLink } from "./StockUI";
export default function USMaintenanceNotice({message}:{message:string}) {
  return <div className="mt-3" role="status">
    <p className="text-sm leading-7 text-text-secondary">{message}</p>
    <div className="mt-4"><StockLink href="/stock-analysis/#stock-input">別の銘柄を分析する</StockLink></div>
  </div>;
}
