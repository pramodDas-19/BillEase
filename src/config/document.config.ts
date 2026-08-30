export const DEFAULT_DOCUMENT_CONFIG = {
  quotation: {
    prefix: "QT-",
    defaultValidityDays: 15,
    defaultTerms: `1. Validity: This quotation is valid for 15 days from the date of issue.
2. Advance: 50% advance required to confirm booking/order.
3. Balance: Remaining balance due on delivery/event day.
4. Taxes: Taxes applicable as indicated.`,
    defaultNotes: "Thank you for giving us the opportunity to serve you!",
  },
  invoice: {
    prefix: "INV-",
    defaultDueDays: 15,
    defaultTerms: `1. Payment is due within the stipulated due date.
2. Please mention the invoice number in all payment references.
3. For delayed payments, interest @ 1.5% per month may be charged.`,
    defaultNotes: "We appreciate your prompt business and cooperation!",
  },
  taxRates: [
    { label: "0% (No Tax / Exempt)", value: 0 },
    { label: "5% (Standard GST)", value: 5 },
    { label: "12% (Standard GST)", value: 12 },
    { label: "18% (Services / Print GST)", value: 18 },
    { label: "28% (Luxury / Specific Goods)", value: 28 },
  ],
};
