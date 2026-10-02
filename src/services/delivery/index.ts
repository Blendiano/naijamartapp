import { db } from "@/db";
import { deliveryOptions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getActiveDeliveryOptions() {
  return db
    .select()
    .from(deliveryOptions)
    .where(eq(deliveryOptions.isActive, true))
    .orderBy(deliveryOptions.fee);
}

export async function getDeliveryOptionById(id: string) {
  const [option] = await db
    .select()
    .from(deliveryOptions)
    .where(eq(deliveryOptions.id, id))
    .limit(1);

  return option ?? null;
}
