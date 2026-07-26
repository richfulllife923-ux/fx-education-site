import { buildMetadata } from "@/lib/seo";
import Breadcrumb from "@/components/Breadcrumb";
import SectionHeading from "@/components/SectionHeading";
import ContactForm from "./ContactForm";
import { Twitter, Youtube } from "lucide-react";

export const metadata = buildMetadata({
  title: "お問い合わせ",
  description: "FX生存戦略ラボへのお問い合わせはこちらのフォームから。ご質問・ご要望・記事のリクエストなどお気軽にご連絡ください。",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="pb-24">
      <Breadcrumb items={[{ name: "お問い合わせ", path: "/contact" }]} />

      <section className="container-page pt-6">
        <SectionHeading eyebrow="Contact" title="お問い合わせ" description="ご質問・ご要望・記事のリクエストなど、お気軽にご連絡ください。" />
      </section>

      <section className="container-page grid grid-cols-1 gap-12 lg:grid-cols-[1fr_280px]">
        <ContactForm />

        <aside className="space-y-6">
          <div className="card p-5">
            <h3 className="mb-3 font-display text-sm font-bold text-navy-900">SNS</h3>
            <div className="flex gap-3">
              <a href="#" aria-label="X (Twitter)" className="rounded-full border border-line p-2.5 hover:border-navy-500">
                <Twitter size={16} />
              </a>
              <a href="#" aria-label="YouTube" className="rounded-full border border-line p-2.5 hover:border-navy-500">
                <Youtube size={16} />
              </a>
            </div>
          </div>
          <div className="card p-5 text-xs leading-relaxed text-muted">
            いただいた内容には順次対応いたしますが、内容によってはお返事にお時間をいただく場合や、
            お答えできない場合がございます。あらかじめご了承ください。
          </div>
        </aside>
      </section>
    </div>
  );
}
