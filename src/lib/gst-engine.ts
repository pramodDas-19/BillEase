// ============================================================================
// BILLEASE SAAS — GST FILING ENGINE & GSTR-1 / GSTR-3B COMPLIANCE
// Aggregates sales data, categorizes returns, and exports government JSON/CSV
// ============================================================================

import { Invoice, InvoiceLineItem } from "@/types";

/**
 * Official 2-digit Indian State Codes per GST Rules
 */
export const GST_STATE_CODES: Record<string, string> = {
  "01": "Jammu and Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "26": "Dadra & Nagar Haveli and Daman & Diu",
  "27": "Maharashtra",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman and Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh",
  "97": "Other Territory",
};

/**
 * Resolves Place of Supply (POS) state code & name from GSTIN or State name
 */
export function getPlaceOfSupply(
  gstin?: string | null,
  stateOrAddress?: string | null
): { code: string; name: string } {
  if (gstin && gstin.length >= 2) {
    const code = gstin.substring(0, 2);
    if (GST_STATE_CODES[code]) {
      return { code, name: GST_STATE_CODES[code] };
    }
  }

  if (stateOrAddress) {
    const query = stateOrAddress.toLowerCase().trim();
    for (const [code, name] of Object.entries(GST_STATE_CODES)) {
      if (query.includes(name.toLowerCase())) {
        return { code, name };
      }
    }
  }

  // Default to Delhi (07) or unassigned
  return { code: "07", name: "Delhi" };
}

/**
 * GSTR-3B Summary Data Model
 */
export interface Gstr3bSummary {
  taxableTurnover: number;
  igst: number;
  cgst: number;
  sgst: number;
  totalTax: number;
  totalInvoiceValue: number;
  invoiceCount: number;
}

/**
 * GSTR-1 B2B Item (Table 4A)
 */
export interface Gstr1B2BInvoice {
  clientGstin: string;
  clientName: string;
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  invoiceValue: number;
  placeOfSupply: string; // e.g. "07-Delhi"
  reverseCharge: "N" | "Y";
  invoiceType: "Regular" | "Deemed";
  taxRate: number;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
}

/**
 * GSTR-1 B2C Item (Table 5 & 7)
 */
export interface Gstr1B2CItem {
  type: "B2CL" | "B2CS"; // Large (>2.5L inter-state) vs Small
  placeOfSupply: string;
  taxRate: number;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  invoiceCount: number;
}

/**
 * GSTR-1 HSN Summary Item (Table 12)
 */
export interface Gstr1HsnItem {
  hsnCode: string;
  description: string;
  uqc: string; // e.g. "NOS", "SAC", "OTH"
  totalQuantity: number;
  totalTaxableValue: number;
  taxRate: number;
  igst: number;
  cgst: number;
  sgst: number;
}

/**
 * GSTR-1 Documents Issued (Table 13)
 */
export interface Gstr1DocIssued {
  natureOfDoc: string;
  fromSerial: string;
  toSerial: string;
  totalCount: number;
  cancelledCount: number;
  netCount: number;
}

/**
 * Complete GSTR-1 Data Model
 */
export interface Gstr1ReportData {
  gstin: string;
  fp: string; // Return Period (MMYYYY)
  periodLabel: string;
  b2b: Gstr1B2BInvoice[];
  b2cl: Gstr1B2CItem[];
  b2cs: Gstr1B2CItem[];
  hsn: Gstr1HsnItem[];
  docIssues: Gstr1DocIssued[];
  summary: Gstr3bSummary;
}

/**
 * Computes GSTR-3B Outward Taxable Supplies Summary for a list of invoices
 */
export function computeGstr3bSummary(invoices: Invoice[]): Gstr3bSummary {
  const activeInvoices = invoices.filter((i) => i.status !== "cancelled");

  let taxableTurnover = 0;
  let igst = 0;
  let cgst = 0;
  let sgst = 0;
  let totalInvoiceValue = 0;

  for (const inv of activeInvoices) {
    taxableTurnover += inv.subtotal || 0;
    totalInvoiceValue += inv.totalAmount || 0;

    const isInterState =
      inv.gstType === "inter_state" ||
      (inv.notes && inv.notes.includes("[IGST]")) ||
      Boolean(inv.taxBreakdown?.some((t) => t.name.toUpperCase().includes("IGST")));

    const invTax = inv.totalTax || 0;

    if (invTax > 0) {
      if (isInterState) {
        igst += invTax;
      } else {
        const half = Math.round((invTax / 2) * 100) / 100;
        cgst += half;
        sgst += Math.round((invTax - half) * 100) / 100;
      }
    }
  }

  // Round values
  taxableTurnover = Math.round(taxableTurnover * 100) / 100;
  igst = Math.round(igst * 100) / 100;
  cgst = Math.round(cgst * 100) / 100;
  sgst = Math.round(sgst * 100) / 100;
  const totalTax = Math.round((igst + cgst + sgst) * 100) / 100;
  totalInvoiceValue = Math.round(totalInvoiceValue * 100) / 100;

  return {
    taxableTurnover,
    igst,
    cgst,
    sgst,
    totalTax,
    totalInvoiceValue,
    invoiceCount: activeInvoices.length,
  };
}

/**
 * Aggregates all invoices into full GSTR-1 report format
 */
export function generateGstr1Report(
  invoices: Invoice[],
  businessGstin: string = "07AAAAA0000A1Z5",
  returnPeriod: string = "042026"
): Gstr1ReportData {
  const activeInvoices = invoices.filter((i) => i.status !== "cancelled");
  const b2b: Gstr1B2BInvoice[] = [];
  const b2cl: Gstr1B2CItem[] = [];
  const b2csMap: Record<string, Gstr1B2CItem> = {};
  const hsnMap: Record<string, Gstr1HsnItem> = {};

  for (const inv of activeInvoices) {
    const pos = getPlaceOfSupply(inv.clientGstin, inv.clientAddress);
    const posLabel = `${pos.code}-${pos.name}`;

    const isInterState =
      inv.gstType === "inter_state" ||
      (inv.notes && inv.notes.includes("[IGST]")) ||
      Boolean(inv.taxBreakdown?.some((t) => t.name.toUpperCase().includes("IGST")));

    const totalTax = inv.totalTax || 0;
    const taxableVal = inv.subtotal || 0;
    const invVal = inv.totalAmount || 0;

    let rate = 18;
    if (taxableVal > 0 && totalTax > 0) {
      rate = Math.round((totalTax / taxableVal) * 100);
    }

    const curIgst = isInterState ? totalTax : 0;
    const curCgst = isInterState ? 0 : Math.round((totalTax / 2) * 100) / 100;
    const curSgst = isInterState ? 0 : Math.round((totalTax - curCgst) * 100) / 100;

    // Check if client has a valid 15-character GSTIN
    const hasValidGstin = Boolean(
      inv.clientGstin &&
        inv.clientGstin.trim().length === 15 &&
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(inv.clientGstin.trim())
    );

    if (hasValidGstin) {
      // Table 4A: B2B
      b2b.push({
        clientGstin: inv.clientGstin!.toUpperCase().trim(),
        clientName: inv.clientName || "Registered Client",
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.issueDate,
        invoiceValue: invVal,
        placeOfSupply: posLabel,
        reverseCharge: "N",
        invoiceType: "Regular",
        taxRate: rate,
        taxableValue: taxableVal,
        igst: curIgst,
        cgst: curCgst,
        sgst: curSgst,
      });
    } else {
      // B2C Customer: Check if Large (> 2.5L inter-state) or Small
      if (isInterState && invVal > 250000) {
        b2cl.push({
          type: "B2CL",
          placeOfSupply: posLabel,
          taxRate: rate,
          taxableValue: taxableVal,
          igst: curIgst,
          cgst: 0,
          sgst: 0,
          invoiceCount: 1,
        });
      } else {
        // Table 7: B2CS (Grouped by POS + Rate)
        const key = `${pos.code}_${rate}`;
        if (!b2csMap[key]) {
          b2csMap[key] = {
            type: "B2CS",
            placeOfSupply: posLabel,
            taxRate: rate,
            taxableValue: 0,
            igst: 0,
            cgst: 0,
            sgst: 0,
            invoiceCount: 0,
          };
        }
        b2csMap[key].taxableValue += taxableVal;
        b2csMap[key].igst += curIgst;
        b2csMap[key].cgst += curCgst;
        b2csMap[key].sgst += curSgst;
        b2csMap[key].invoiceCount += 1;
      }
    }

    // Line items -> Table 12 HSN Summary
    const items = (inv.items && inv.items.length > 0 ? inv.items : [
      { description: "General Services", amount: taxableVal, quantity: 1, rate: taxableVal }
    ]) as (Partial<InvoiceLineItem> & { hsnCode?: string; hsn?: string })[];

    for (const item of items) {
      const hsn = item.hsnSacCode || item.hsnCode || item.hsn || "998311";
      const desc = item.description || "Services";
      const qty = item.quantity || 1;
      const amt = item.amount || 0;

      const itemTaxRatio = taxableVal > 0 ? amt / taxableVal : 0;
      const itemTax = Math.round(totalTax * itemTaxRatio * 100) / 100;
      const itemIgst = isInterState ? itemTax : 0;
      const itemCgst = isInterState ? 0 : Math.round((itemTax / 2) * 100) / 100;
      const itemSgst = isInterState ? 0 : Math.round((itemTax - itemCgst) * 100) / 100;

      if (!hsnMap[hsn]) {
        hsnMap[hsn] = {
          hsnCode: hsn,
          description: desc,
          uqc: "NOS",
          totalQuantity: 0,
          totalTaxableValue: 0,
          taxRate: rate,
          igst: 0,
          cgst: 0,
          sgst: 0,
        };
      }

      hsnMap[hsn].totalQuantity += qty;
      hsnMap[hsn].totalTaxableValue = Math.round((hsnMap[hsn].totalTaxableValue + amt) * 100) / 100;
      hsnMap[hsn].igst = Math.round((hsnMap[hsn].igst + itemIgst) * 100) / 100;
      hsnMap[hsn].cgst = Math.round((hsnMap[hsn].cgst + itemCgst) * 100) / 100;
      hsnMap[hsn].sgst = Math.round((hsnMap[hsn].sgst + itemSgst) * 100) / 100;
    }
  }

  // Documents Issued (Table 13)
  const allInvoicesSorted = [...invoices].sort(
    (a, b) => new Date(a.issueDate || a.createdAt).getTime() - new Date(b.issueDate || b.createdAt).getTime()
  );

  const totalCount = allInvoicesSorted.length;
  const cancelledCount = invoices.filter((i) => i.status === "cancelled").length;
  const netCount = totalCount - cancelledCount;

  const docIssues: Gstr1DocIssued[] = [];
  if (totalCount > 0) {
    docIssues.push({
      natureOfDoc: "Invoices for outward supply",
      fromSerial: allInvoicesSorted[0].invoiceNumber || "INV-001",
      toSerial: allInvoicesSorted[allInvoicesSorted.length - 1].invoiceNumber || "INV-999",
      totalCount,
      cancelledCount,
      netCount,
    });
  }

  const summary = computeGstr3bSummary(invoices);

  // Month label e.g. "April 2026" from "042026"
  const monthNum = parseInt(returnPeriod.substring(0, 2), 10);
  const yearNum = returnPeriod.substring(2);
  const dateObj = new Date(parseInt(yearNum, 10), monthNum - 1, 1);
  const periodLabel = dateObj.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return {
    gstin: businessGstin,
    fp: returnPeriod,
    periodLabel,
    b2b,
    b2cl,
    b2cs: Object.values(b2csMap),
    hsn: Object.values(hsnMap),
    docIssues,
    summary,
  };
}

/**
 * Builds the official Government-Compliant GSTR-1 JSON
 * Compatible with GST Offline Tool for direct upload to gst.gov.in
 */
export function generateGstr1GovJson(data: Gstr1ReportData): object {
  // 1. Format B2B by receiver GSTIN
  const b2bGrouped: Record<string, any> = {};

  data.b2b.forEach((item) => {
    if (!b2bGrouped[item.clientGstin]) {
      b2bGrouped[item.clientGstin] = {
        ctin: item.clientGstin,
        inv: [],
      };
    }

    b2bGrouped[item.clientGstin].inv.push({
      inum: item.invoiceNumber,
      idt: formatDateForGov(item.invoiceDate),
      val: item.invoiceValue,
      pos: item.placeOfSupply.split("-")[0],
      rchrg: item.reverseCharge,
      inv_typ: "R",
      itms: [
        {
          num: 1,
          itm_det: {
            rt: item.taxRate,
            txval: item.taxableValue,
            iamt: item.igst,
            camt: item.cgst,
            samt: item.sgst,
            csamt: 0,
          },
        },
      ],
    });
  });

  // 2. Format B2CL
  const b2clList = data.b2cl.map((item, idx) => ({
    pos: item.placeOfSupply.split("-")[0],
    inv: [
      {
        inum: `B2CL-${idx + 1}`,
        idt: formatDateForGov(new Date().toISOString().split("T")[0]),
        val: Math.round((item.taxableValue + item.igst) * 100) / 100,
        itms: [
          {
            num: 1,
            itm_det: {
              rt: item.taxRate,
              txval: item.taxableValue,
              iamt: item.igst,
              csamt: 0,
            },
          },
        ],
      },
    ],
  }));

  // 3. Format B2CS
  const b2csList = data.b2cs.map((item) => ({
    sply_ty: item.igst > 0 ? "INTER" : "INTRA",
    pos: item.placeOfSupply.split("-")[0],
    typ: "OE",
    rt: item.taxRate,
    txval: item.taxableValue,
    iamt: item.igst,
    camt: item.cgst,
    samt: item.sgst,
    csamt: 0,
  }));

  // 4. Format HSN
  const hsnList = data.hsn.map((item, idx) => ({
    num: idx + 1,
    hsn_sc: item.hsnCode,
    desc: item.description,
    uqc: item.uqc,
    qty: item.totalQuantity,
    val: Math.round((item.totalTaxableValue + item.igst + item.cgst + item.sgst) * 100) / 100,
    txval: item.totalTaxableValue,
    iamt: item.igst,
    camt: item.cgst,
    samt: item.sgst,
    csamt: 0,
  }));

  // 5. Format Document Issued
  const docDetList = data.docIssues.map((doc, idx) => ({
    doc_num: idx + 1,
    doc_typ: "Invoices for outward supply",
    docs: [
      {
        num: 1,
        from: doc.fromSerial,
        to: doc.toSerial,
        totnum: doc.totalCount,
        canc: doc.cancelledCount,
        net_issue: doc.netCount,
      },
    ],
  }));

  return {
    gstin: data.gstin,
    fp: data.fp,
    cur_gt: data.summary.totalInvoiceValue,
    gt: data.summary.totalInvoiceValue,
    b2b: Object.values(b2bGrouped),
    b2cl: b2clList,
    b2cs: b2csList,
    hsn: {
      data: hsnList,
    },
    doc_issue: {
      doc_det: docDetList,
    },
  };
}

/**
 * Converts ISO/standard date (YYYY-MM-DD) to Government date format (DD-MM-YYYY)
 */
function formatDateForGov(dateStr?: string): string {
  if (!dateStr) return "01-04-2026";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  } catch {}
  return dateStr;
}

/**
 * Triggers download of the official GSTR-1 JSON file
 */
export function downloadGstr1Json(data: Gstr1ReportData, filename?: string): void {
  if (typeof window === "undefined") return;

  const govPayload = generateGstr1GovJson(data);
  const jsonStr = JSON.stringify(govPayload, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const finalName = filename || `GSTR1_${data.gstin}_${data.fp}.json`;
  const link = document.createElement("a");
  link.href = url;
  link.download = finalName;
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates official GSTR-1 CSV matching government Excel/CSV offline columns
 */
export function generateGstr1Csv(data: Gstr1ReportData): string {
  const rows: string[] = [];

  // Section 1: GSTR-3B Summary Header
  rows.push("=== GSTR-3B OUTWARD TAXABLE SUPPLIES (TABLE 3.1) ===");
  rows.push("Total Invoices,Total Invoice Value,Taxable Turnover,Integrated Tax (IGST),Central Tax (CGST),State Tax (SGST),Total Tax Liability");
  rows.push(
    [
      data.summary.invoiceCount,
      data.summary.totalInvoiceValue.toFixed(2),
      data.summary.taxableTurnover.toFixed(2),
      data.summary.igst.toFixed(2),
      data.summary.cgst.toFixed(2),
      data.summary.sgst.toFixed(2),
      data.summary.totalTax.toFixed(2),
    ].join(",")
  );
  rows.push("");

  // Section 2: Table 4A - B2B Invoices
  rows.push("=== GSTR-1 TABLE 4A: B2B INVOICES (REGISTERED BUYERS) ===");
  rows.push("GSTIN/UIN of Recipient,Receiver Name,Invoice Number,Invoice Date,Invoice Value,Place Of Supply,Reverse Charge,Invoice Type,Rate,Taxable Value,Integrated Tax,Central Tax,State Tax");

  data.b2b.forEach((b) => {
    rows.push(
      [
        `"${b.clientGstin}"`,
        `"${b.clientName.replace(/"/g, '""')}"`,
        `"${b.invoiceNumber}"`,
        formatDateForGov(b.invoiceDate),
        b.invoiceValue.toFixed(2),
        `"${b.placeOfSupply}"`,
        b.reverseCharge,
        b.invoiceType,
        b.taxRate,
        b.taxableValue.toFixed(2),
        b.igst.toFixed(2),
        b.cgst.toFixed(2),
        b.sgst.toFixed(2),
      ].join(",")
    );
  });
  rows.push("");

  // Section 3: Table 7 - B2C Small
  rows.push("=== GSTR-1 TABLE 7: B2C SMALL SUPPLIES (UNREGISTERED) ===");
  rows.push("Type,Place Of Supply,Rate,Taxable Value,Integrated Tax,Central Tax,State Tax,Count");

  data.b2cs.forEach((item) => {
    rows.push(
      [
        item.type,
        `"${item.placeOfSupply}"`,
        item.taxRate,
        item.taxableValue.toFixed(2),
        item.igst.toFixed(2),
        item.cgst.toFixed(2),
        item.sgst.toFixed(2),
        item.invoiceCount,
      ].join(",")
    );
  });
  rows.push("");

  // Section 4: Table 12 - HSN Summary
  rows.push("=== GSTR-1 TABLE 12: HSN / SAC SUMMARY OF OUTWARD SUPPLIES ===");
  rows.push("HSN/SAC,Description,UQC,Total Quantity,Total Taxable Value,Rate,Integrated Tax,Central Tax,State Tax");

  data.hsn.forEach((h) => {
    rows.push(
      [
        `"${h.hsnCode}"`,
        `"${h.description.replace(/"/g, '""')}"`,
        h.uqc,
        h.totalQuantity,
        h.totalTaxableValue.toFixed(2),
        h.taxRate,
        h.igst.toFixed(2),
        h.cgst.toFixed(2),
        h.sgst.toFixed(2),
      ].join(",")
    );
  });
  rows.push("");

  // Section 5: Table 13 - Documents Issued
  rows.push("=== GSTR-1 TABLE 13: DOCUMENTS ISSUED ===");
  rows.push("Nature of Document,From Serial,To Serial,Total Count,Cancelled Count,Net Issued");

  data.docIssues.forEach((d) => {
    rows.push(
      [
        `"${d.natureOfDoc}"`,
        `"${d.fromSerial}"`,
        `"${d.toSerial}"`,
        d.totalCount,
        d.cancelledCount,
        d.netCount,
      ].join(",")
    );
  });

  // Prepend UTF-8 BOM so Excel opens with proper encoding
  return "\uFEFF" + rows.join("\r\n");
}

/**
 * Triggers download of the GSTR-1 CSV file
 */
export function downloadGstr1Csv(data: Gstr1ReportData, filename?: string): void {
  if (typeof window === "undefined") return;

  const csv = generateGstr1Csv(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const finalName = filename || `GSTR1_${data.gstin}_${data.fp}.csv`;
  const link = document.createElement("a");
  link.href = url;
  link.download = finalName;
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
