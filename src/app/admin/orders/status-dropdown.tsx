"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ORDER_STATUSES,
  orderStatusIsSuccess,
  orderStatusLabel,
} from "@/lib/order-status";

interface AdminOrderStatusDropdownProps {
  orderId: string;
  currentStatus: string;
}

export function AdminOrderStatusDropdown({
  orderId,
  currentStatus,
}: AdminOrderStatusDropdownProps) {
  const [status, setStatus] = useState(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    setStatus(newStatus);
    setIsUpdating(true);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      toast.success(`Order status updated to ${newStatus}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error updating status");
      setStatus(currentStatus); // revert
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <select
      value={status}
      disabled={isUpdating}
      onChange={handleChange}
      className={`h-8 px-2.5 rounded-lg border border-input text-xs font-semibold uppercase bg-background transition-all focus:outline-none focus:ring-1 focus:ring-ring ${
        orderStatusIsSuccess(status) ? "text-success" : "text-foreground"
      }`}
    >
      {ORDER_STATUSES.map((st) => (
        <option key={st} value={st}>
          {orderStatusLabel(st)}
        </option>
      ))}
    </select>
  );
}
