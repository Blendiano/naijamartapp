import {
  CircleQuestionMark,
  CreditCard,
  PackageSearch,
  ShoppingBag,
  Undo2,
  XCircle,
  type LucideIcon,
} from "lucide-react";

export interface HelpTopic {
  id: string;
  label: string;
  icon: LucideIcon;
  summary: string;
}

export const HELP_TOPICS: HelpTopic[] = [
  {
    id: "help-center",
    label: "Help center",
    icon: CircleQuestionMark,
    summary:
      "Everything you need to know about shopping, paying, and following your order on NaijaMart.",
  },
  {
    id: "place-an-order",
    label: "Place an order",
    icon: ShoppingBag,
    summary:
      "Find a piece, choose your size, add it to your cart, then check out and pay.",
  },
  {
    id: "payment-options",
    label: "Payment options",
    icon: CreditCard,
    summary:
      "Naira payments are processed by Paystack. The available methods are shown for you at checkout.",
  },
  {
    id: "track-an-order",
    label: "Track an order",
    icon: PackageSearch,
    summary:
      "Sign in and open My Orders to see your order status and delivery updates.",
  },
  {
    id: "cancel-an-order",
    label: "Cancel an order",
    icon: XCircle,
    summary:
      "Send us your order number and we will confirm what is possible for your order. Our team handles every cancellation request personally.",
  },
  {
    id: "refund-and-return",
    label: "Refund & return",
    icon: Undo2,
    summary:
      "Refund and return terms have not been published yet. Contact us with your order number and the reason, and we will advise on the options available for your order.",
  },
];
