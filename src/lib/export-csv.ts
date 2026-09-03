import { Invoice, Payment, Client, Quotation } from "@/types";

export interface CsvColumn<T> {
  label: string;
  getValue: (item: T) => string | number | boolean | null | undefined;
}

/**
 * Escapes a cell value according to RFC 4180 rules
 */
function escapeCsvCell(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }
  const str = String(value);
  // If the cell contains commas, quotes, or newlines, wrap in quotes and escape internal quotes
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converts generic items to a CSV string with UTF-8 BOM
 */
export function generateCsvContent<T>(columns: CsvColumn<T>[], data: T[]): string {
  const headerRow = columns.map((col) => escapeCsvCell(col.label)).join(",");
  const dataRows = data.map((item) =>
    columns.map((col) => escapeCsvCell(col.getValue(item))).join(",")
  );

  // Prepend UTF-8 BOM (\uFEFF) so Excel opens UTF-8 properly without character corruption
  return "\uFEFF" + [headerRow, ...dataRows].join("\r\n");
}

/**
 * Triggers a browser download of the CSV content
 */
export function downloadCsv(filename: string, csvContent: string): void {
  if (typeof window === "undefined") return;

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generic export helper
 */
export function exportToCsv<T>(filename: string, columns: CsvColumn<T>[], data: T[]): void {
  const content = generateCsvContent(columns, data);
  downloadCsv(filename, content);
}

/**
 * 1. Export Invoices / Sales Register
 */
export function exportInvoicesToCsv(invoices: Invoice[], filenamePrefix = "BillEase_Invoices"): void {
  const dateStr = new Date().toISOString().split("T")[0];
  const columns: CsvColumn<Invoice>[] = [
    { label: "Invoice Number", getValue: (i) => i.invoiceNumber },
    { label: "Issue Date", getValue: (i) => i.issueDate },
    { label: "Due Date", getValue: (i) => i.dueDate },
    { label: "Status", getValue: (i) => i.status.toUpperCase() },
    { label: "Client Name", getValue: (i) => i.clientName },
    { label: "Client Phone", getValue: (i) => i.clientPhone || "" },
    { label: "Client Email", getValue: (i) => i.clientEmail || "" },
    { label: "Client GSTIN", getValue: (i) => i.clientGstin || "" },
    { label: "Subtotal", getValue: (i) => i.subtotal },
    { label: "Discount Amount", getValue: (i) => i.discountAmount || 0 },
    { label: "Taxable Amount", getValue: (i) => Math.max(0, (i.subtotal || 0) - (i.discountAmount || 0)) },
    { label: "GST Enabled", getValue: (i) => (i.isTaxEnabled ? "YES" : "NO") },
    {
      label: "GST Type",
      getValue: (i) => (i.isTaxEnabled ? (i.gstType === "inter_state" ? "Inter-State (IGST)" : "Intra-State (CGST+SGST)") : "N/A"),
    },
    {
      label: "CGST",
      getValue: (i) => {
        if (!i.isTaxEnabled || i.gstType === "inter_state") return 0;
        const cgst = i.taxBreakdown?.find((t) => t.name.startsWith("CGST"));
        return cgst ? cgst.amount : Math.round(((i.totalTax || 0) / 2) * 100) / 100;
      },
    },
    {
      label: "SGST",
      getValue: (i) => {
        if (!i.isTaxEnabled || i.gstType === "inter_state") return 0;
        const sgst = i.taxBreakdown?.find((t) => t.name.startsWith("SGST"));
        const half = Math.round(((i.totalTax || 0) / 2) * 100) / 100;
        return sgst ? sgst.amount : Math.round(((i.totalTax || 0) - half) * 100) / 100;
      },
    },
    {
      label: "IGST",
      getValue: (i) => {
        if (!i.isTaxEnabled || i.gstType !== "inter_state") return 0;
        return i.totalTax || 0;
      },
    },
    { label: "Total Tax", getValue: (i) => i.totalTax || 0 },
    { label: "Grand Total", getValue: (i) => i.totalAmount },
    { label: "Amount Paid", getValue: (i) => i.paidAmount || 0 },
    { label: "Balance Due", getValue: (i) => i.balanceDue },
    { label: "Origin Quote Ref", getValue: (i) => i.quotationNumber || "" },
    {
      label: "Line Items Summary",
      getValue: (i) =>
        (i.items || [])
          .map((item) => `${item.description} (Qty: ${item.quantity ?? 1}, Rate: ${item.rate ?? item.amount}, Total: ${item.amount}${item.hsnSacCode ? `, SAC: ${item.hsnSacCode}` : ""})`)
          .join(" | "),
    },
  ];

  exportToCsv(`${filenamePrefix}_${dateStr}.csv`, columns, invoices);
}

/**
 * 2. Export Payments / Collections Register
 */
export function exportPaymentsToCsv(payments: Payment[], filenamePrefix = "BillEase_Payments"): void {
  const dateStr = new Date().toISOString().split("T")[0];
  const columns: CsvColumn<Payment>[] = [
    { label: "Receipt / Payment Number", getValue: (p) => p.paymentNumber || p.id },
    { label: "Date", getValue: (p) => p.paymentDate },
    { label: "Invoice Number", getValue: (p) => p.invoiceNumber || "" },
    { label: "Client Name", getValue: (p) => p.clientName || "" },
    { label: "Payment Method", getValue: (p) => (p.paymentMethod ? p.paymentMethod.toUpperCase() : "N/A") },
    { label: "Amount Paid", getValue: (p) => p.amount },
    { label: "Reference / Transaction ID", getValue: (p) => p.transactionReference || "" },
    { label: "Status", getValue: (p) => (p.status ? p.status.toUpperCase() : "COMPLETED") },
    { label: "Notes", getValue: (p) => p.notes || "" },
  ];


  exportToCsv(`${filenamePrefix}_${dateStr}.csv`, columns, payments);
}

/**
 * 3. Export Clients Ledger / Balances Summary
 */
export function exportClientsToCsv(clients: Client[], filenamePrefix = "BillEase_Clients"): void {
  const dateStr = new Date().toISOString().split("T")[0];
  const columns: CsvColumn<Client>[] = [
    { label: "Client Name", getValue: (c) => c.name },
    { label: "Phone", getValue: (c) => c.phone || "" },
    { label: "Email", getValue: (c) => c.email || "" },
    { label: "GSTIN", getValue: (c) => c.gstin || "" },
    { label: "Address", getValue: (c) => c.address || "" },
    { label: "Total Billed", getValue: (c) => c.totalBilled || 0 },
    { label: "Total Paid", getValue: (c) => c.totalPaid || 0 },
    { label: "Outstanding Balance", getValue: (c) => c.balanceDue || 0 },
  ];

  exportToCsv(`${filenamePrefix}_${dateStr}.csv`, columns, clients);
}

/**
 * 4. Export Quotations Register
 */
export function exportQuotationsToCsv(quotations: Quotation[], filenamePrefix = "BillEase_Quotations"): void {
  const dateStr = new Date().toISOString().split("T")[0];
  const columns: CsvColumn<Quotation>[] = [
    { label: "Quotation Number", getValue: (q) => q.quotationNumber },
    { label: "Date", getValue: (q) => q.date },
    { label: "Valid Until", getValue: (q) => q.validUntil },
    { label: "Status", getValue: (q) => q.status.toUpperCase() },
    { label: "Client Name", getValue: (q) => q.clientName },
    { label: "Client Phone", getValue: (q) => q.clientPhone || "" },
    { label: "Client Email", getValue: (q) => q.clientEmail || "" },
    { label: "Client GSTIN", getValue: (q) => q.clientGstin || "" },
    { label: "Subtotal", getValue: (q) => q.subtotal },
    { label: "Discount", getValue: (q) => q.discountAmount || 0 },
    { label: "Taxable Amount", getValue: (q) => Math.max(0, (q.subtotal || 0) - (q.discountAmount || 0)) },
    { label: "GST Enabled", getValue: (q) => (q.isTaxEnabled ? "YES" : "NO") },
    { label: "Total Tax", getValue: (q) => q.totalTax || 0 },
    { label: "Estimated Total", getValue: (q) => q.totalAmount },
    { label: "Converted To Invoice ID", getValue: (q) => q.convertedToInvoiceId || "" },
  ];

  exportToCsv(`${filenamePrefix}_${dateStr}.csv`, columns, quotations);
}
