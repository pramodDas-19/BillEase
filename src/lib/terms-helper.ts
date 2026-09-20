/**
 * BillEase Terms & Conditions Helper
 * Provides consistent numbering (1., 2., 3...) and standard clauses
 * for Quotations and Invoices without mixing numbers and bullet points.
 */

export const STANDARD_QUOTATION_PRESETS = [
  { label: "50% Advance", text: "50% advance payment required to commence work, balance upon delivery." },
  { label: "15 Days Validity", text: "Prices quoted are valid for 15 days from the quotation date." },
  { label: "Delivery 7-10 Days", text: "Delivery timeline: 7 to 10 working days from confirmation and advance payment." },
  { label: "GST Extra", text: "GST and statutory taxes applicable extra as per government rates." },
  { label: "100% Advance", text: "100% advance payment required to confirm booking / dispatch." },
];

export const STANDARD_INVOICE_PRESETS = [
  { label: "Due on Receipt", text: "Payment is due immediately upon receipt of this tax invoice." },
  { label: "Net 15 Days", text: "Payment is due within 15 days from the date of this invoice." },
  { label: "Net 30 Days", text: "Payment is due within 30 days from the date of this invoice." },
  { label: "Late Fee 18%", text: "Interest @ 18% p.a. will be charged on all payments delayed beyond the due date." },
  { label: "Bank Remittance", text: "Please remit all payments via NEFT/RTGS/IMPS/UPI to the designated company bank account." },
];

export const STANDARD_QUOTATION_FULL_TERMS = [
  "50% advance payment required to commence work, balance upon delivery.",
  "Prices quoted are valid for 15 days from the quotation date.",
  "Delivery timeline: 7 to 10 working days from confirmation and advance payment.",
  "GST and statutory taxes applicable extra as per government rates.",
];

export const STANDARD_INVOICE_FULL_TERMS = [
  "Payment is due within 15 days from the date of this invoice.",
  "Interest @ 18% p.a. will be charged on all payments delayed beyond the due date.",
  "Please remit all payments via NEFT/RTGS/IMPS/UPI to the designated company bank account.",
  "Goods or services once delivered will be billed as per the agreed scope of work.",
];

/**
 * Inserts an individual clause into existing terms, preserving and continuing
 * the list numbering (e.g. 1., 2. -> 3.) rather than mixing bullet points.
 */
export function insertClauseToTerms(currentText: string, clauseText: string): string {
  const trimmed = (currentText || "").trim();
  if (!trimmed) {
    return `1. ${clauseText}`;
  }

  // Check if clause already exists (avoid duplicates)
  if (trimmed.toLowerCase().includes(clauseText.toLowerCase())) {
    return trimmed;
  }

  const lines = trimmed.split("\n");

  // Detect numbered lines (e.g., "1.", "2.", "1)", etc.)
  const numberedLines: number[] = [];
  lines.forEach((line) => {
    const match = line.match(/^\s*(\d+)[\.\)]\s*/);
    if (match) {
      numberedLines.push(parseInt(match[1], 10));
    }
  });

  if (numberedLines.length > 0) {
    const nextNum = Math.max(...numberedLines) + 1;
    return `${trimmed}\n${nextNum}. ${clauseText}`;
  }

  // Detect bulleted lines
  const isBulleted = lines.some((line) => /^\s*[•\-\*]\s*/.test(line));
  if (isBulleted) {
    return `${trimmed}\n• ${clauseText}`;
  }

  // Default to numbered list
  const nextIndex = lines.filter((l) => l.trim().length > 0).length + 1;
  return `${trimmed}\n${nextIndex}. ${clauseText}`;
}

/**
 * Inserts all standard terms for a quotation or invoice.
 * If the current text is empty or is the default 2-line starter template,
 * it cleanly populates the comprehensive numbered terms (1., 2., 3., 4.).
 * If custom terms exist, it appends missing standard clauses with sequential numbering.
 */
export function insertAllStandardTerms(
  currentText: string,
  type: "quotation" | "invoice"
): string {
  const standardClauses =
    type === "quotation" ? STANDARD_QUOTATION_FULL_TERMS : STANDARD_INVOICE_FULL_TERMS;

  const trimmed = (currentText || "").trim();
  const normalized = trimmed.replace(/\r\n/g, "\n");

  // Check if text is empty or matches initial 2-line starter defaults
  const isStarter =
    !trimmed ||
    normalized === "1. 50% advance required to confirm booking.\n2. Balance due within 14 days of invoice." ||
    normalized === "1. 50% advance required to confirm booking.\n2. Balance due within 14 days of invoice" ||
    normalized.startsWith("1. 50% advance required to confirm booking.\n2. Balance due within 14 days of invoice.");

  if (isStarter) {
    return standardClauses.map((c, i) => `${i + 1}. ${c}`).join("\n");
  }

  // If custom terms already exist, append missing standard clauses without duplicate concepts
  let updated = trimmed;
  for (const clause of standardClauses) {
    const lower = updated.toLowerCase();
    const isAlreadyCovered =
      lower.includes(clause.toLowerCase()) ||
      (clause.includes("advance") && lower.includes("advance")) ||
      (clause.includes("valid for") && lower.includes("valid")) ||
      (clause.includes("delivery timeline") && lower.includes("delivery timeline")) ||
      (clause.includes("due within") && lower.includes("due within"));

    if (!isAlreadyCovered) {
      updated = insertClauseToTerms(updated, clause);
    }
  }

  return updated;
}
