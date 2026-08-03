import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { breadcrumbJsonLd } from "@/lib/seo";

export interface Crumb {
  name: string;
  path: string;
}

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  const full = [{ name: "Home", path: "/" }, ...items];

  return (
    <nav aria-label="パンくずリスト" className="container-page py-4 text-xs text-text-secondary">
      <ol className="flex flex-wrap items-center gap-1.5">
        {full.map((item, i) => (
          <li key={item.path} className="flex items-center gap-1.5">
            {i === 0 ? (
              <Link href={item.path} className="flex items-center gap-1 hover:text-text-primary">
                <Home size={12} strokeWidth={1.8} /> {item.name}
              </Link>
            ) : i === full.length - 1 ? (
              <span className="font-medium text-text-primary" aria-current="page">
                {item.name}
              </span>
            ) : (
              <Link href={item.path} className="hover:text-text-primary">
                {item.name}
              </Link>
            )}
            {i < full.length - 1 && <ChevronRight size={12} strokeWidth={1.8} />}
          </li>
        ))}
      </ol>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(full)) }} />
    </nav>
  );
}
