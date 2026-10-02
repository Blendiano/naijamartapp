import { db } from "@/db";
import { orders, orderItems, payments } from "@/db/schema";
import { getCartWithItems } from "@/services/cart";
import { getDeliveryOptionById } from "@/services/delivery";
import { generateOrderNumber, generatePaymentReference } from "@/lib/utils/order-number";
import { calculateSubtotal, calculateTotal } from "@/lib/utils/money";

export interface CheckoutCustomerData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country?: string;
  deliveryOptionId: string;
  notes?: string;
}

/**
 * Server-side checkout preparation:
 * 1. Validates cart items exist and are in stock
 * 2. Calculates subtotal and delivery fee server-side
 * 3. Creates an order record with status = "pending"
 * 4. Creates order_items with historical product/variant snapshots
 * 5. Creates a pending payment record with reference
 * Returns order details and payment reference for Paystack initialization.
 */
export async function prepareCheckoutOrder(
  cartId: string,
  userId: string | undefined,
  customerData: CheckoutCustomerData
) {
  const cart = await getCartWithItems(cartId);

  if (cart.items.length === 0) {
    throw new Error("Your cart is empty");
  }

  // Verify stock for all items
  for (const item of cart.items) {
    if (item.quantity > item.availableStock) {
      throw new Error(
        `Insufficient stock for "${item.productName}". Available: ${item.availableStock}`
      );
    }
  }

  // Get delivery option and fee
  const deliveryOpt = await getDeliveryOptionById(customerData.deliveryOptionId);
  if (!deliveryOpt) {
    throw new Error("Invalid delivery option selected");
  }

  // Authoritative server-side financial calculations
  const subtotal = calculateSubtotal(cart.items);
  const deliveryFee = deliveryOpt.fee;
  const total = calculateTotal(subtotal, deliveryFee);

  const orderNumber = generateOrderNumber();
  const paymentReference = generatePaymentReference();

  const deliveryAddress = {
    line1: customerData.line1,
    line2: customerData.line2 ?? null,
    city: customerData.city,
    state: customerData.state,
    country: customerData.country ?? "Nigeria",
  };

  // Perform atomic multi-record write inside a transaction
  return db.transaction(async (tx) => {
    // 1. Create Order
    const [order] = await tx
      .insert(orders)
      .values({
        orderNumber,
        userId: userId ?? null,
        customerName: customerData.customerName,
        customerEmail: customerData.customerEmail,
        customerPhone: customerData.customerPhone,
        deliveryAddress,
        deliveryOptionName: deliveryOpt.name,
        deliveryFee,
        subtotal,
        total,
        currency: "NGN",
        status: "pending",
        notes: customerData.notes ?? null,
      })
      .returning();

    // 2. Create Order Items (historical snapshots)
    const orderItemsToInsert = cart.items.map((item) => ({
      orderId: order.id,
      productName: item.productName,
      productSku: item.sku,
      variantInfo: {
        size: item.size,
        color: item.color,
        sku: item.sku,
      },
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
      productId: null, // set null so order survives product changes
      variantId: item.variantId,
    }));

    await tx.insert(orderItems).values(orderItemsToInsert);

    // 3. Create Pending Payment Record
    const [payment] = await tx
      .insert(payments)
      .values({
        orderId: order.id,
        reference: paymentReference,
        amount: total,
        currency: "NGN",
        status: "pending",
      })
      .returning();

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentReference: payment.reference,
      total,
      customerEmail: order.customerEmail,
    };
  });
}
