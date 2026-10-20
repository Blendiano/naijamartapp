import Link from "next/link";
import { MessageCircle, MessagesSquare } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import type { Metadata } from "next";
import { HELP_TOPICS } from "@/lib/help-topics";

export const metadata: Metadata = {
  title: "Help Center",
  description:
    "Guides for placing an order, paying, tracking your order, cancellations, and refunds on NaijaMart.",
};

const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");
const liveChatUrl = process.env.NEXT_PUBLIC_LIVE_CHAT_URL;

export default function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-10">
      <div className="pb-6 border-b border-border">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Help Center</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Answers for shopping, paying, and following your order.
        </p>
      </div>

      <nav aria-label="Help topics" className="flex flex-wrap gap-2">
        {HELP_TOPICS.map((topic) => (
          <a
            key={topic.id}
            href={`#${topic.id}`}
            className="rounded-full border border-border bg-surface-dim px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            {topic.label}
          </a>
        ))}
      </nav>

      <div className="flex flex-col gap-8">
        {HELP_TOPICS.map((topic) => {
          const Icon = topic.icon;

          return (
            <section key={topic.id} id={topic.id} className="scroll-mt-24">
              <h2 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight text-foreground">
                <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                {topic.label}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {topic.summary}
              </p>
              {topic.id === "place-an-order" && (
                <ol className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
                  <li>1. Browse the catalogue and open the piece you want.</li>
                  <li>2. Choose your size, then add it to your cart.</li>
                  <li>
                    3. Continue to checkout, enter your details and choose a delivery
                    option.
                  </li>
                  <li>4. Pay securely, and your order is confirmed straight away.</li>
                </ol>
              )}
              {topic.id === "track-an-order" && (
                <p className="mt-4 text-sm">
                  <Link
                    href="/orders"
                    className="font-semibold text-primary hover:underline"
                  >
                    Go to My Orders
                  </Link>
                </p>
              )}
              {(topic.id === "cancel-an-order" || topic.id === "refund-and-return") && (
                <p className="mt-4 text-sm">
                  <Link
                    href="/contact"
                    className="font-semibold text-primary hover:underline"
                  >
                    Send us a message
                  </Link>{" "}
                  <span className="text-muted-foreground">
                    with your order number and our team will get back to you.
                  </span>
                </p>
              )}
            </section>
          );
        })}
      </div>

      {(liveChatUrl || whatsappNumber) && (
        <section className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Still need a hand?</h2>
            <p className="text-sm mt-1 text-muted-foreground">
              Reach our team directly and we will help you with your order.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {liveChatUrl && (
              <a
                href={liveChatUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ className: "gap-2" }))}
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Start live chat
              </a>
            )}

            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "outline", className: "gap-2" }))}
              >
                <MessagesSquare className="h-4 w-4" aria-hidden="true" />
                Chat on WhatsApp
              </a>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
