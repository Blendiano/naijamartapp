import type { Metadata } from "next";
import { Sparkles, Truck, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Discover the story behind NaijaMart, a Nigerian fashion destination for men and women.",
};

const values = [
  {
    icon: Sparkles,
    title: "Curated Fashion",
    description: "Styles celebrating Nigerian creativity and culture.",
  },
  {
    icon: Truck,
    title: "Trusted Delivery",
    description: "Carefully packed orders delivered across Nigeria.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    description: "Pay securely through Paystack.",
  },
];

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-10">
      <div className="text-center flex flex-col gap-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Crafted for the Modern Nigerian
        </h1>
        <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto text-pretty">
          NaijaMart brings modern Nigerian fashion for men and women together in
          one place. Discover styles that celebrate quality, culture, and
          everyday confidence.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
        {values.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-6 sm:p-7"
          >
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
}