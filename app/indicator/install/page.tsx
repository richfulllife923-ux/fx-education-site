import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import SectionHeading from "@/components/SectionHeading";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "MT5へのインストール方法",
  description: "TUTTO IndicatorをMQL5 Marketから購入後、MetaTrader 5へインストールする手順です。",
  path: "/indicator/install",
});

const INSTALL_STEPS = [
  {
    title: "MQL5アカウントでログイン",
    body: "MetaTrader 5を起動し、MQL5.comで購入に使用したアカウントでMQL5.communityへログインしてください。ログインが完了すると、購入済みの商品を確認できるようになります。",
  },
  {
    title: "購入済み商品を開く",
    body: "MT5の「表示 → ナビゲータ」を開き、ナビゲータ内の「Market → My Purchases / 購入済み」から購入したTUTTO Indicatorを確認します。",
  },
  {
    title: "TUTTO Indicatorをインストール",
    body: "TUTTO Indicatorの横に表示される「Install / インストール」をクリックします。完了すると、TUTTO IndicatorがMT5へ追加されます。",
  },
  {
    title: "Indicatorをチャートへ表示",
    body: "ナビゲータから「Indicators → Market → TUTTO Indicator」を探し、使用したいチャートへドラッグ＆ドロップします。右クリックから「チャートに適用」を選ぶこともできます。",
  },
  {
    title: "パラメーターを確認",
    body: "設定画面が表示されたら必要なパラメーターを確認し、「OK」を押します。チャート上にTUTTO Indicatorが表示されればインストール完了です。",
  },
];

const TROUBLESHOOTING = [
  "購入時と同じMQL5アカウントでログインしているか",
  "MT5がインターネットへ接続されているか",
  "Marketの購入済み商品にTUTTOが表示されているか",
  "MT5を最新状態にしているか",
];

export default function IndicatorInstallPage() {
  return (
    <div className="pb-24">
      <Breadcrumb items={[{ name: "Indicator", path: "/indicator" }, { name: "MT5へのインストール方法", path: "/indicator/install" }]} />
      <section className="container-page pt-6">
        <Link href="/indicator" className="btn-ghost mb-8">
          ← TUTTO Indicatorに戻る
        </Link>
        <SectionHeading
          eyebrow="TUTTO Indicator Installation Guide"
          title="MT5へのインストール方法"
          description="TUTTO Indicatorは、MQL5 Marketから購入後、MetaTrader 5へインストールできます。"
        />
        <ol className="grid grid-cols-1 gap-4">
          {INSTALL_STEPS.map((step, index) => (
            <li key={step.title} className="card grid gap-4 p-5 sm:grid-cols-[96px_1fr] sm:p-6">
              <p className="font-display text-sm font-black text-primary">STEP {index + 1}</p>
              <div>
                <h3 className="font-display text-base font-bold text-text-primary">{step.title}</h3>
                <p className="mt-2 text-sm leading-7 text-text-secondary">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="container-page mt-12 grid gap-5 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-xl font-bold text-text-primary">別のPCで使用する場合</h2>
          <p className="mt-3 text-sm leading-7 text-text-secondary">
            MQL5 Marketの商品は、MQL5アカウントとPCのActivationによって管理されています。別のPCへインストールする場合も、同じMQL5アカウントでMT5へログインし、購入済み商品から再度インストールしてください。
          </p>
          <p className="mt-3 text-sm leading-7 text-text-secondary">
            利用可能なActivation数はMQL5の商品ページで確認できます。
          </p>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-bold text-text-primary">インストールできない場合</h2>
          <ul className="mt-4 space-y-2 text-sm leading-7 text-text-secondary">
            {TROUBLESHOOTING.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-7 text-text-secondary">
            TUTTOのファイルを手動でコピーするのではなく、MQL5 Marketから正式にインストールしてください。
          </p>
        </div>
      </section>
    </div>
  );
}
