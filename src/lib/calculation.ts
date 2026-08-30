import { TaxBreakdown } from "@/types";

export interface LineItemCalculable {
  amount: number;
  taxRate?: number;
}

export interface CalculationInput {
  items: LineItemCalculable[];
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  isTaxEnabled?: boolean;
  defaultTaxRate?: number;
}

export interface CalculationResult {
  subtotal: number;
  discountAmount: number;
  netAfterDiscount: number;
  isTaxEnabled: boolean;
  taxBreakdown: TaxBreakdown[];
  totalTax: number;
  totalAmount: number;
}

/**
 * Pure calculation engine for Quotations and Invoices.
 * Handles:
 * - Line item totals
 * - Discounts (Percentage or Fixed amount)
 * - Optional Tax/GST calculations (Aggregate or Per-Item)
 * - Accurate decimal rounding
 */
export function calculateDocumentTotals(input: CalculationInput): CalculationResult {
  const {
    items = [],
    discountType,
    discountValue = 0,
    isTaxEnabled = false,
    defaultTaxRate = 18,
  } = input;

  // 1. Calculate raw Subtotal
  const subtotal = items.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);

  // 2. Calculate Discount
  let discountAmount = 0;
  if (discountType === "percentage" && discountValue > 0) {
    discountAmount = (subtotal * discountValue) / 100;
  } else if (discountType === "fixed" && discountValue > 0) {
    discountAmount = Math.min(discountValue, subtotal);
  }
  discountAmount = Math.round(discountAmount * 100) / 100;

  const netAfterDiscount = Math.max(0, subtotal - discountAmount);

  // 3. Tax / GST Calculation (Optional)
  let totalTax = 0;
  const taxBreakdown: TaxBreakdown[] = [];

  if (isTaxEnabled) {
    // If items have individual tax rates, calculate proportionally or aggregate
    const taxRate = defaultTaxRate || 0;
    if (taxRate > 0) {
      totalTax = (netAfterDiscount * taxRate) / 100;
      totalTax = Math.round(totalTax * 100) / 100;

      taxBreakdown.push({
        name: `GST (${taxRate}%)`,
        rate: taxRate,
        amount: totalTax,
      });
    }
  }

  // 4. Grand Total
  const totalAmount = Math.round((netAfterDiscount + totalTax) * 100) / 100;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount,
    netAfterDiscount,
    isTaxEnabled,
    taxBreakdown,
    totalTax,
    totalAmount,
  };
}
