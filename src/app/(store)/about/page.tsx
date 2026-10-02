import type { Metadata } from "next";
import { Sparkles, Truck, ShieldCheck, HeartHandshake } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Discover the story behind NaijaMart, a Nigerian fashion destination for men and women.",
};

const values = [
  {
    icon: Sparkles,
    title: "Curated Fashion",
    description:
      "We thoughtfully select pieces that celebrate Nigerian style, craft, and culture.",
  },
  {
    icon: Truck,
    title: "Trusted Delivery",
    description:
      "Every order is packed with care and delivered to your door, anywhere in Nigeria.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    description:
      "Payments are processed securely through Paystack, Nigeria's trusted payment gateway.",
  },
  {
    icon: HeartHandshake,
    title: "Customer First",
    description:
      "From browsing to delivery, we are here to make your shopping experience effortless.",
  },
];

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-12">
      <div className="text-center flex flex-col gap-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Crafted for the Modern Nigerian
        </h1>
        <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          NaijaMart is a Nigerian fashion destination bringing elegant,
          modern clothing for men and women together in one place. We believe
          shopping should be calm, simple, and trustworthy — so you can focus
          on what matters: feeling great in what you wear.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {values.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="p-6 rounded-2xl border border-border bg-card flex flex-col gap-3"
          >
            <div className="p-3 rounded-xl bg-primary/10 w-fit">
              <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <h2 className="font-semibold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        ))}
      </div>

      <div className="p-6 rounded-2xl border border-border bg-card flex flex-col gap-2">
        <h2 className="font-semibold text-foreground">Our Promise</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Every order stores a secure payment, a clear delivery estimate, and
          detailed order tracking. If anything goes wrong, our team will make
          it right — because your trust matters more than a single sale.
        </p>
      </div>
    </div>
  );
}