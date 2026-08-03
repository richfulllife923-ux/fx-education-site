import Breadcrumb from "@/components/Breadcrumb";
import SectionHeading from "@/components/SectionHeading";
import { buildMetadata } from "@/lib/seo";
import ContactForm from "./ContactForm";

export const metadata = buildMetadata({
  title: "Contact",
  description: "TUTTOへのお問い合わせページです。",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="pb-24">
      <Breadcrumb items={[{ name: "Contact", path: "/contact" }]} />
      <section className="container-page grid gap-10 pt-6 lg:grid-cols-[0.85fr_1.15fr]">
        <SectionHeading eyebrow="Contact" title="お問い合わせ" description="TUTTOに関する質問、記事へのご意見、開発状況についてはこちらからお送りください。" />
        <ContactForm />
      </section>
    </div>
  );
}
