import type { Metadata } from "next";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { ContactForm } from "@/components/shared/contact-form";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the NaijaMart team.",
};

const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

const channels = [
  {
    icon: Mail,
    title: "Email",
    detail: "samueladetiba321@gmail.com",
    href: "mailto:samueladetiba321@gmail.com",
  },
  {
    icon: Phone,
    title: "Phone / WhatsApp",
    detail: whatsappNumber ?? "+234 800 000 0000",
    href: whatsappNumber
      ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}`
      : null,
  },
  {
    icon: MapPin,
    title: "Location",
    detail: "Lagos, Nigeria",
    href: null,
  },
  {
    icon: Clock,
    title: "Support Hours",
    detail: "Monday – Saturday, 9:00 AM – 6:00 PM (WAT)",
    href: null,
  },
];

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-10">
      {/* Heading */}
      <div className="text-center flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          We&apos;re Here to Help
        </h1>
        <p className="text-muted-foreground leading-relaxed max-w-xl mx-auto">
          Questions about an order, a product, or delivery? We&apos;re here to
          help. Send us a message and our team will get back to you.
        </p>
      </div>

      {/* Contact channel cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {channels.map(({ icon: Icon, title, detail, href }) => (
          <div
            key={title}
            className="p-6 rounded-2xl border border-border bg-card flex flex-col gap-3"
          >
            <div className="p-3 rounded-xl bg-primary/10 w-fit">
              <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <h2 className="font-semibold text-foreground">{title}</h2>
            {href ? (
              <a
                href={href}
                className="text-sm text-primary font-medium hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {detail}
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">{detail}</p>
            )}
          </div>
        ))}
      </div>

      {/* Contact form */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-foreground">
            Send Us a Message
          </h2>
          <p className="text-sm text-muted-foreground">
            Include your order number if your question is about a specific
            order.
          </p>
        </div>
        <ContactForm />
      </div>
    </div>
  );
}