export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={`mb-10 ${align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}`}>
      {eyebrow && <p className={`eyebrow ${align === "center" ? "justify-center" : ""}`}>{eyebrow}</p>}
      <h2 className="text-2xl font-bold text-text-primary sm:text-3xl">{title}</h2>
      {description && <p className="mt-3 text-[15px] leading-relaxed text-text-secondary">{description}</p>}
    </div>
  );
}
