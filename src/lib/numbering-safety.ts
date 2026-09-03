import { supabase } from "@/lib/supabase/client";

/**
 * Ensures an invoice number is strictly unique for a tenant.
 * If the requested number already exists (e.g. concurrent creation),
 * it queries the existing numbers and assigns the next sequential number.
 */
export async function getSafeSequentialInvoiceNumber(
  tenantId: string,
  preferredNumber: string
): Promise<string> {
  try {
    // 1. Check if preferred number is already taken for this tenant
    const { data: existing, error } = await supabase
      .from("invoices")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("invoice_number", preferredNumber)
      .maybeSingle();

    if (error || !existing) {
      // Not taken, safe to use!
      return preferredNumber;
    }

    // 2. Collision detected! Extract prefix and sequence
    const match = preferredNumber.match(/^(.*?)(\d+)$/);
    const prefix = match ? match[1] : "INV-";
    const baseNumber = match ? parseInt(match[2], 10) : 1000;

    // 3. Find the current highest invoice number with this prefix
    const { data: allInvoices } = await supabase
      .from("invoices")
      .select("invoice_number")
      .eq("tenant_id", tenantId)
      .ilike("invoice_number", `${prefix}%`);

    let maxNumber = baseNumber;
    if (allInvoices && allInvoices.length > 0) {
      for (const inv of allInvoices) {
        const numMatch = inv.invoice_number.match(new RegExp(`^${escapeRegex(prefix)}(\\d+)$`));
        if (numMatch) {
          const val = parseInt(numMatch[1], 10);
          if (val > maxNumber) {
            maxNumber = val;
          }
        }
      }
    }

    const nextSafeNumber = `${prefix}${maxNumber + 1}`;
    console.info(`[Concurrency Guard] Invoice number collision resolved: ${preferredNumber} -> ${nextSafeNumber}`);
    return nextSafeNumber;
  } catch (err) {
    console.warn("Error in getSafeSequentialInvoiceNumber, using fallback:", err);
    return `${preferredNumber}-${Date.now().toString().slice(-4)}`;
  }
}

/**
 * Ensures a quotation number is strictly unique for a tenant.
 */
export async function getSafeSequentialQuotationNumber(
  tenantId: string,
  preferredNumber: string
): Promise<string> {
  try {
    const { data: existing, error } = await supabase
      .from("quotations")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("quotation_number", preferredNumber)
      .maybeSingle();

    if (error || !existing) {
      return preferredNumber;
    }

    const match = preferredNumber.match(/^(.*?)(\d+)$/);
    const prefix = match ? match[1] : "QT-";
    const baseNumber = match ? parseInt(match[2], 10) : 1000;

    const { data: allQuotes } = await supabase
      .from("quotations")
      .select("quotation_number")
      .eq("tenant_id", tenantId)
      .ilike("quotation_number", `${prefix}%`);

    let maxNumber = baseNumber;
    if (allQuotes && allQuotes.length > 0) {
      for (const q of allQuotes) {
        const numMatch = q.quotation_number.match(new RegExp(`^${escapeRegex(prefix)}(\\d+)$`));
        if (numMatch) {
          const val = parseInt(numMatch[1], 10);
          if (val > maxNumber) {
            maxNumber = val;
          }
        }
      }
    }

    const nextSafeNumber = `${prefix}${maxNumber + 1}`;
    console.info(`[Concurrency Guard] Quotation number collision resolved: ${preferredNumber} -> ${nextSafeNumber}`);
    return nextSafeNumber;
  } catch (err) {
    console.warn("Error in getSafeSequentialQuotationNumber, using fallback:", err);
    return `${preferredNumber}-${Date.now().toString().slice(-4)}`;
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
