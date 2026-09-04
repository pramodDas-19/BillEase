import { TaxBreakdown } from "@/types";

export interface LineItemCalculable {
  id?: string;
  description?: string;
  amount: number;
  quantity?: number;
  rate?: number;
  taxRate?: number;
}


export interface CalculationInput {
  items: LineItemCalculable[];
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  isTaxEnabled?: boolean;
  defaultTaxRate?: number;
  gstType?: "intra_state" | "inter_state";
  isRoundOffEnabled?: boolean;
}

export interface CalculationResult {
  subtotal: number;
  discountAmount: number;
  netAfterDiscount: number;
  taxableAmount: number;
  isTaxEnabled: boolean;
  gstType: "intra_state" | "inter_state";
  taxBreakdown: TaxBreakdown[];
  totalTax: number;
  isRoundOffEnabled?: boolean;
  roundOffAmount?: number;
  totalAmount: number;
}


/**
 * Pure calculation engine for Quotations and Invoices.
 * Handles:
 * - Line item totals
 * - Discounts (Percentage or Fixed amount)
 * - Optional Indian Tax/GST calculations (CGST+SGST for Intra-State or IGST for Inter-State)
 * - Accurate decimal rounding
 */
export function calculateDocumentTotals(input: CalculationInput): CalculationResult {
  const {
    items = [],
    discountType,
    discountValue = 0,
    isTaxEnabled = false,
    defaultTaxRate = 18,
    gstType = "intra_state",
    isRoundOffEnabled = false,
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

  // 3. Tax / GST Calculation (Optional & Multi-Rate Item-Wise Support)
  let totalTax = 0;
  const taxBreakdown: TaxBreakdown[] = [];

  if (isTaxEnabled) {
    const hasItemTaxRates = items.some((it) => it.taxRate !== undefined && it.taxRate !== null);

    if (hasItemTaxRates) {
      // Multi-rate GST: Calculate tax per line item
      const discountRatio = subtotal > 0 ? netAfterDiscount / subtotal : 1;
      const slabMap = new Map<number, number>();

      for (const it of items) {
        const rate = it.taxRate !== undefined && it.taxRate !== null ? Number(it.taxRate) : (defaultTaxRate || 0);
        if (rate > 0) {
          const itemTaxable = (Number(it.amount) || 0) * discountRatio;
          const itemTax = (itemTaxable * rate) / 100;
          slabMap.set(rate, (slabMap.get(rate) || 0) + itemTax);
        }
      }

      // Sort slabs ascending (5%, 12%, 18%, 28%)
      const sortedSlabs = Array.from(slabMap.keys()).sort((a, b) => a - b);

      for (const rate of sortedSlabs) {
        const rawSlabTax = slabMap.get(rate) || 0;
        const slabTax = Math.round(rawSlabTax * 100) / 100;
        if (slabTax <= 0) continue;

        totalTax += slabTax;

        if (gstType === "inter_state") {
          taxBreakdown.push({
            name: `IGST (${rate}%)`,
            rate,
            amount: slabTax,
          });
        } else {
          const halfRate = Math.round((rate / 2) * 100) / 100;
          const cgstAmount = Math.round((slabTax / 2) * 100) / 100;
          const sgstAmount = Math.round((slabTax - cgstAmount) * 100) / 100;

          taxBreakdown.push({
            name: `CGST (${halfRate}%)`,
            rate: halfRate,
            amount: cgstAmount,
          });
          taxBreakdown.push({
            name: `SGST (${halfRate}%)`,
            rate: halfRate,
            amount: sgstAmount,
          });
        }
      }

      totalTax = Math.round(totalTax * 100) / 100;
    } else {
      // Single-rate GST: Standard fallback for uniform documents
      const taxRate = defaultTaxRate || 0;
      if (taxRate > 0) {
        totalTax = (netAfterDiscount * taxRate) / 100;
        totalTax = Math.round(totalTax * 100) / 100;

        if (gstType === "inter_state") {
          taxBreakdown.push({
            name: `IGST (${taxRate}%)`,
            rate: taxRate,
            amount: totalTax,
          });
        } else {
          const halfRate = Math.round((taxRate / 2) * 100) / 100;
          const cgstAmount = Math.round((totalTax / 2) * 100) / 100;
          const sgstAmount = Math.round((totalTax - cgstAmount) * 100) / 100;

          taxBreakdown.push({
            name: `CGST (${halfRate}%)`,
            rate: halfRate,
            amount: cgstAmount,
          });
          taxBreakdown.push({
            name: `SGST (${halfRate}%)`,
            rate: halfRate,
            amount: sgstAmount,
          });
        }
      }
    }
  }

  // 4. Grand Total & Optional Round-off
  const rawTotal = netAfterDiscount + totalTax;
  let totalAmount = Math.round(rawTotal * 100) / 100;
  let roundOffAmount = 0;

  if (isRoundOffEnabled) {
    const rounded = Math.round(rawTotal);
    roundOffAmount = Math.round((rounded - rawTotal) * 100) / 100;
    totalAmount = rounded;
  }

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount,
    netAfterDiscount,
    taxableAmount: netAfterDiscount,
    isTaxEnabled,
    gstType,
    taxBreakdown,
    totalTax,
    isRoundOffEnabled,
    roundOffAmount,
    totalAmount,
  };
}


