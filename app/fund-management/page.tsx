import { redirect } from "next/navigation";

// 資金管理の内容は基礎知識ページ（第14章「リスクと始める前の実務知識」）に統合しました。
export default function FundManagementPage() {
  redirect("/fx-basics#chapter-14");
}
