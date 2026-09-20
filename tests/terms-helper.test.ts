import { describe, it, expect } from "vitest";
import {
  insertClauseToTerms,
  insertAllStandardTerms,
  STANDARD_QUOTATION_PRESETS,
  STANDARD_INVOICE_PRESETS,
} from "../src/lib/terms-helper";

describe("Terms & Conditions Helper", () => {
  it("numbers the first clause as '1.' when starting from empty text", () => {
    const res = insertClauseToTerms("", "50% advance required.");
    expect(res).toBe("1. 50% advance required.");
  });

  it("continues sequential numbering (3.) when existing text has 1. and 2.", () => {
    const starter = "1. 50% advance required to confirm booking.\n2. Balance due within 14 days of invoice.";
    const res = insertClauseToTerms(starter, "Prices quoted are valid for 15 days.");
    expect(res).toBe(
      "1. 50% advance required to confirm booking.\n2. Balance due within 14 days of invoice.\n3. Prices quoted are valid for 15 days."
    );
  });

  it("does not duplicate an already existing clause", () => {
    const current = "1. 50% advance payment required to commence work.";
    const res = insertClauseToTerms(current, "50% advance payment required to commence work.");
    expect(res).toBe(current);
  });

  it("replaces default starter template with clean numbered full terms on 'Insert All Standard' for quotations", () => {
    const starter = "1. 50% advance required to confirm booking.\n2. Balance due within 14 days of invoice.";
    const res = insertAllStandardTerms(starter, "quotation");

    // Must be cleanly numbered without bullet points
    expect(res).toContain("1. 50% advance payment required to commence work, balance upon delivery.");
    expect(res).toContain("2. Prices quoted are valid for 15 days from the quotation date.");
    expect(res).toContain("3. Delivery timeline: 7 to 10 working days from confirmation and advance payment.");
    expect(res).toContain("4. GST and statutory taxes applicable extra as per government rates.");
    expect(res).not.toContain("•");
    // Advance payment must not be duplicated
    const advanceMatches = res.match(/advance/gi);
    expect(advanceMatches?.length).toBeLessThanOrEqual(2); // One in clause 1, one in clause 3
  });

  it("replaces default starter template with clean numbered full terms on 'Insert All Standard' for invoices", () => {
    const starter = "1. 50% advance required to confirm booking.\n2. Balance due within 14 days of invoice.";
    const res = insertAllStandardTerms(starter, "invoice");

    expect(res).toContain("1. Payment is due within 15 days from the date of this invoice.");
    expect(res).toContain("2. Interest @ 18% p.a. will be charged on all payments delayed beyond the due date.");
    expect(res).toContain("3. Please remit all payments via NEFT/RTGS/IMPS/UPI to the designated company bank account.");
    expect(res).not.toContain("•");
  });

  it("appends missing clauses with continuous numbering when custom terms exist", () => {
    const custom = "1. Custom project specification must be signed off.\n2. Domain registration is included.";
    const res = insertAllStandardTerms(custom, "quotation");

    expect(res).toContain("1. Custom project specification must be signed off.");
    expect(res).toContain("2. Domain registration is included.");
    expect(res).toContain("3. 50% advance payment required to commence work, balance upon delivery.");
    expect(res).not.toContain("•");
  });
});
