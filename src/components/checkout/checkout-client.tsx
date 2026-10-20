"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { formatNaira } from "@/lib/utils/money";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { ShieldCheck, Truck, CreditCard } from "lucide-react";
import { toast } from "sonner";
import type { CartItemWithDetails } from "@/services/cart";

interface DeliveryOption {
  id: string;
  name: string;
  description: string | null;
  fee: number; // kobo
  estimatedDays: string | null;
}

interface CheckoutClientProps {
  cart: {
    cartId: string;
    items: CartItemWithDetails[];
    itemCount: number;
    subtotal: number;
  };
  deliveryOptions: DeliveryOption[];
  userSession?: {
    name?: string | null;
    email?: string | null;
  } | null;
}

const checkoutSchema = z.object({
  customerName: z.string().min(2, "Please enter your full name"),
  customerEmail: z.email("Please enter a valid email address"),
  customerPhone: z.string().min(10, "Please enter a valid phone number"),
  line1: z.string().min(3, "Please enter your street address"),
  line2: z.string().optional(),
  city: z.string().min(2, "Please enter your city"),
  state: z.string().min(2, "Please select a state"),
  deliveryOptionId: z.uuid("Please select a delivery method"),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

const NIGERIAN_STATES = [
  "Lagos",
  "Abuja (FCT)",
  "Rivers",
  "Oyo",
  "Kano",
  "Enugu",
  "Delta",
  "Edo",
  "Ogun",
  "Kaduna",
  "Other State",
];

const inputStyles =
  "h-11 px-3.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export function CheckoutClient({
  cart,
  deliveryOptions,
  userSession,
}: CheckoutClientProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: userSession?.name ?? "",
      customerEmail: userSession?.email ?? "",
      customerPhone: "",
      line1: "",
      line2: "",
      city: "",
      state: "Lagos",
      deliveryOptionId: deliveryOptions[0]?.id ?? "",
    },
  });

  const selectedDeliveryId = useWatch({ control, name: "deliveryOptionId" });
  const selectedDelivery = deliveryOptions.find(
    (d) => d.id === selectedDeliveryId
  );
  const deliveryFee = selectedDelivery ? selectedDelivery.fee : 0;
  const grandTotal = cart.subtotal + deliveryFee;

  async function handlePaystackCheckout(values: CheckoutFormValues) {
    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: values.customerName,
          customerEmail: values.customerEmail,
          customerPhone: values.customerPhone,
          line1: values.line1,
          line2: values.line2 || undefined,
          city: values.city,
          state: values.state,
          deliveryOptionId: values.deliveryOptionId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message ?? "Failed to initialize payment");
      }

      // Redirect to Paystack checkout page
      window.location.assign(data.data.authorizationUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payment error";
      toast.error(msg);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(handlePaystackCheckout)}
      className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start"
      noValidate
    >
      {/* Customer Info & Shipping Form */}
      <div className="lg:col-span-7 flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Checkout
          </h1>
          <p className="text-sm mt-1 text-muted-foreground">
            Enter your details below to complete your order securely via
            Paystack.
          </p>
        </div>

        {/* Contact Information */}
        <div className="p-6 rounded-2xl border border-border bg-card flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
            1. Contact Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="customerName" className="font-medium text-xs text-foreground">
                Full Name *
              </label>
              <input
                id="customerName"
                type="text"
                placeholder="e.g. Amina Bello"
                className={inputStyles}
                {...register("customerName")}
              />
              <FieldError message={errors.customerName?.message} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="customerEmail" className="font-medium text-xs text-foreground">
                Email Address *
              </label>
              <input
                id="customerEmail"
                type="email"
                placeholder="amina@example.com"
                className={inputStyles}
                {...register("customerEmail")}
              />
              <FieldError message={errors.customerEmail?.message} />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label htmlFor="customerPhone" className="font-medium text-xs text-foreground">
                Phone Number *
              </label>
              <input
                id="customerPhone"
                type="tel"
                placeholder="08012345678"
                className={inputStyles}
                {...register("customerPhone")}
              />
              <FieldError message={errors.customerPhone?.message} />
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="p-6 rounded-2xl border border-border bg-card flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
            2. Delivery Address
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label htmlFor="line1" className="font-medium text-xs text-foreground">
                Street Address *
              </label>
              <input
                id="line1"
                type="text"
                placeholder="House number, street name, estate"
                className={inputStyles}
                {...register("line1")}
              />
              <FieldError message={errors.line1?.message} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="city" className="font-medium text-xs text-foreground">
                City / Landmark *
              </label>
              <input
                id="city"
                type="text"
                placeholder="e.g. Ikeja"
                className={inputStyles}
                {...register("city")}
              />
              <FieldError message={errors.city?.message} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="state" className="font-medium text-xs text-foreground">
                State *
              </label>
              <select id="state" className={inputStyles} {...register("state")}>
                {NIGERIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              <FieldError message={errors.state?.message} />
            </div>
          </div>
        </div>

        {/* Delivery Options */}
        <div className="p-6 rounded-2xl border border-border bg-card flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" />
            3. Delivery Method
          </h2>

          <div className="flex flex-col gap-3">
            {deliveryOptions.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No delivery options are available right now. Please try again
                shortly.
              </p>
            )}
            {deliveryOptions.map((opt) => (
              <label
                key={opt.id}
                className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedDeliveryId === opt.id
                    ? "border-primary bg-muted"
                    : "border-border bg-transparent hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    value={opt.id}
                    className="h-4 w-4 accent-primary"
                    {...register("deliveryOptionId")}
                  />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {opt.name}
                    </p>
                    {opt.estimatedDays && (
                      <p className="text-xs text-muted-foreground">
                        Est. Delivery: {opt.estimatedDays}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-sm font-bold text-primary">
                  {formatNaira(opt.fee)}
                </span>
              </label>
            ))}
            <FieldError message={errors.deliveryOptionId?.message} />
          </div>
        </div>
      </div>

      {/* Order Summary & Paystack Pay Button */}
      <div className="lg:col-span-5 sticky top-24">
        <div className="p-6 rounded-2xl border border-border bg-card flex flex-col gap-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Order Summary ({cart.items.length} items)
          </h2>

          {/* Item Mini List */}
          <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1">
            {cart.items.map((item) => (
              <div key={item.id} className="flex gap-3 items-center text-xs">
                <div className="relative h-12 w-10 flex-shrink-0 rounded overflow-hidden border border-border bg-muted">
                  {item.imageUrl && (
                    <Image
                      src={item.imageUrl}
                      alt={item.productName}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {item.productName}
                  </p>
                  <p className="text-muted-foreground">
                    Qty: {item.quantity} {item.size ? `(${item.size})` : ""}
                  </p>
                </div>
                <span className="font-bold text-foreground">
                  {formatNaira(item.subtotal)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4 flex flex-col gap-2.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-medium text-foreground">
                {formatNaira(cart.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Delivery Fee</span>
              <span className="font-medium text-foreground">
                {formatNaira(deliveryFee)}
              </span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between text-base font-extrabold">
              <span className="text-foreground">Total</span>
              <span className="text-primary">{formatNaira(grandTotal)}</span>
            </div>
          </div>

          <Button
            type="submit"
            loading={isSubmitting}
            disabled={deliveryOptions.length === 0}
            className="w-full gap-2"
          >
            <CreditCard className="h-4 w-4" />
            {isSubmitting
              ? "Redirecting to Paystack..."
              : `Pay ${formatNaira(grandTotal)}`}
          </Button>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground text-center">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>Encrypted payment powered by Paystack</span>
          </div>
        </div>
      </div>
    </form>
  );
}