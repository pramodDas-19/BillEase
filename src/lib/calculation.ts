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
    const taxRate = defaultTaxRate || 0;
    if (taxRate > 0) {
      totalTax = (netAfterDiscount * taxRate) / 100;
      totalTax = Math.round(totalTax * 100) / 100;

      if (gstType === "inter_state") {
        // Outside State: Single IGST line
        taxBreakdown.push({
          name: `IGST (${taxRate}%)`,
          rate: taxRate,
          amount: totalTax,
        });
      } else {
        // Within State (Intra-State): Split equally into CGST + SGST
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

  // 4. Grand Total
  const totalAmount = Math.round((netAfterDiscount + totalTax) * 100) / 100;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount,
    netAfterDiscount,
    taxableAmount: netAfterDiscount,
    isTaxEnabled,
    gstType,
    taxBreakdown,
    totalTax,
    totalAmount,
  };
}


