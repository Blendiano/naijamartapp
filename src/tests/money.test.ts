import { describe, it, expect } from "vitest";
import {
  nairaToKobo,
  koboToNaira,
  formatNaira,
  calculateSubtotal,
  calculateTotal,
} from "../lib/utils/money";

describe("Financial Rules & Money Utilities", () => {
  it("should convert Naira floats to integer minor unit (kobo)", () => {
    expect(nairaToKobo(25000)).toBe(2500000);
    expect(nairaToKobo(1500.50)).toBe(150050);
    expect(nairaToKobo(0)).toBe(0);
  });

  it("should convert integer kobo to Naira float", () => {
    expect(koboToNaira(2500000)).toBe(25000);
    expect(koboToNaira(150050)).toBe(1500.50);
  });

  it("should format Naira amounts correctly", () => {
    expect(formatNaira(2500000)).toContain("25,000");
    expect(formatNaira(150050)).toContain("1,500.5");
  });

  it("should calculate cart item subtotal accurately in kobo without floating-point drift", () => {
    const items = [
      { unitPrice: 2500000, quantity: 2 }, // 50,000 NGN
      { unitPrice: 1200000, quantity: 1 }, // 12,000 NGN
    ];
    expect(calculateSubtotal(items)).toBe(6200000); // 62,000 NGN in kobo
  });

  it("should calculate total with delivery fee correctly", () => {
    const subtotal = 6200000;
    const deliveryFee = 250000; // 2,500 NGN
    expect(calculateTotal(subtotal, deliveryFee)).toBe(6450000); // 64,500 NGN
  });
});
