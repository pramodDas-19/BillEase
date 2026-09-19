import { Invoice, Quotation, Tenant } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { numberToWords } from "@/lib/number-to-words";
import { generateUpiIntentUrl, getUpiQrImageUrl } from "@/lib/upi";

export interface NormalizedItem {
  id: string;
  name: string;
  description?: string;
  hsnSacCode?: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  taxRate?: number;
  taxAmount?: number;
  discountValue?: number;
  discountType?: "percentage" | "fixed";
  discountAmount?: number;
  batchNo?: string;
}

export interface NormalizedDocument {
  documentType: "invoice" | "quotation";
  documentTitle: string;
  documentNumber: string;
  date: string;
  dueDateOrValidUntil: {
    label: string;
    value: string;
  };
  tenant: {
    businessName: string;
    address?: string;
    phone?: string;
    email?: string;
    gstin?: string;
    pan?: string;
    logoUrl?: string;
    signatureUrl?: string;
    bankDetails: {
      accountName: string;
      accountNumber: string;
      ifscCode: string;
      bankName: string;
      upiId: string;
      branch?: string;
    };
  };
  client: {
    name: string;
    companyName?: string;
    address?: string;
    phone?: string;
    email?: string;
    gstin?: string;
    pan?: string;
  };
  shippingAddress?: string;
  placeOfSupply?: string;
  eWayBillNo?: string;
  poNumber?: string;
  vehicleNo?: string;
  items: NormalizedItem[];
  subtotal: number;
  discountAmount: number;
  taxBreakdown: Array<{
    rate: number;
    taxableAmount: number;
    amount: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    isInterState: boolean;
  }>;
  totalTax: number;
  totalAmount: number;
  totalInWords: string;
  receivedAmount: number;
  balanceDue: number;
  notes?: string;
  terms?: string;
  upiUri: string;
  upiQrUrl: string;
  isTaxEnabled: boolean;
  isFullyPaid: boolean;
  hasHsn: boolean;
  hasQtyOrRate: boolean;
}

export function normalizeDocument(
  doc: Invoice | Quotation,
  type: "invoice" | "quotation",
  tenant: Tenant | null | undefined
): NormalizedDocument {
  const isInvoice = type === "invoice";
  const inv = isInvoice ? (doc as Invoice) : null;
  const quot = !isInvoice ? (doc as Quotation) : null;

  const documentNumber = isInvoice ? inv!.invoiceNumber : quot!.quotationNumber;
  const isTaxEnabled = doc.isTaxEnabled ?? true;
  const isFullyPaid = isInvoice ? ((inv!.balanceDue ?? 0) <= 0 || inv!.status === "paid") : false;

  let documentTitle = "";
  if (isInvoice) {
    if (!isTaxEnabled) documentTitle = "BILL OF SUPPLY";
    else if (isFullyPaid) documentTitle = "TAX INVOICE & RECEIPT";
    else documentTitle = "TAX INVOICE";
  } else {
    documentTitle = !isTaxEnabled ? "ESTIMATE / QUOTATION" : "TAX QUOTATION";
  }

  const dateRaw = isInvoice ? inv!.issueDate : quot!.date;
  const dateStr = formatDate(dateRaw);
  const dueOrValidLabel = isInvoice ? (isFullyPaid ? "Settled On" : "Due Date") : "Valid Until";
  const dueOrValidValue = formatDate(isInvoice ? inv!.dueDate : quot!.validUntil);

  const bankDetails = {
    accountName: tenant?.bankDetails?.accountName || tenant?.businessName || "",
    accountNumber: tenant?.bankDetails?.accountNumber || "",
    ifscCode: tenant?.bankDetails?.ifscCode || "",
    bankName: tenant?.bankDetails?.bankName || "",
    upiId: tenant?.bankDetails?.upiId || "",
    branch: (tenant?.bankDetails as { branch?: string })?.branch || "",
  };

  const balanceDue = isInvoice ? (inv!.balanceDue ?? 0) : doc.totalAmount;
  const receivedAmount = isInvoice ? (inv!.paidAmount ?? 0) : 0;

  const upiUri = generateUpiIntentUrl({
    upiId: bankDetails.upiId || "business@upi",
    businessName: tenant?.businessName || "Business",
    amount: balanceDue > 0 ? balanceDue : doc.totalAmount,
    transactionRef: documentNumber,
    note: `${documentTitle} ${documentNumber}`,
  });

  const upiQrUrl = getUpiQrImageUrl(upiUri, 200);

  const rawItems = doc.items || [];
  const normalizedItems: NormalizedItem[] = rawItems.map((item, idx) => {
    const it = item as unknown as Record<string, unknown>;
    const qty = (it.quantity as number) ?? 1;
    const rate = (it.rate as number) ?? (it.amount as number) ?? 0;
    const amount = (it.amount as number) ?? (qty * rate);
    const dVal = (it.discountValue as number) || 0;
    const dType = (it.discountType as "percentage" | "fixed") || "percentage";
    const dAmt = (it.discountAmount as number) || (
      dVal > 0 ? (dType === "fixed" ? dVal : (amount * dVal) / 100) : 0
    );

    return {
      id: (it.id as string) || String(idx + 1),
      name: (it.name as string) || (it.description as string) || "Item",
      description: (it.description as string) || "",
      hsnSacCode: (it.hsnSacCode as string) || "",
      quantity: qty,
      unit: (it.unit as string) || "PCS",
      rate,
      amount,
      taxRate: (it.taxRate as number) || undefined,
      taxAmount: (it.taxAmount as number) || undefined,
      discountValue: dVal,
      discountType: dType,
      discountAmount: dAmt,
      batchNo: (it.batchNo as string) || "",
    };
  });

  const hasHsn = normalizedItems.some((i) => Boolean(i.hsnSacCode));
  const hasQtyOrRate = normalizedItems.some((i) => i.quantity > 0 || i.rate > 0);

  const isInterStateDoc = isInvoice && inv?.gstType === "inter_state";

  // Compute tax breakdown
  const taxBreakdown = (doc.taxBreakdown || []).map((t) => {
    const rate = t.rate || 0;
    const amt = t.amount || 0;
    const taxableAmt = (doc.subtotal || 0) - (doc.discountAmount || 0);

    return {
      rate,
      taxableAmount: taxableAmt,
      amount: amt,
      cgstAmount: isInterStateDoc ? 0 : Math.round((amt / 2) * 100) / 100,
      sgstAmount: isInterStateDoc ? 0 : Math.round((amt / 2) * 100) / 100,
      igstAmount: isInterStateDoc ? amt : 0,
      isInterState: isInterStateDoc,
    };
  });

  // Calculate total tax
  const totalTax = taxBreakdown.reduce((sum, t) => sum + t.amount, 0) || (
    Math.max(0, doc.totalAmount - (doc.subtotal || 0) + (doc.discountAmount || 0))
  );

  const docAny = doc as unknown as Record<string, unknown>;

  return {
    documentType: type,
    documentTitle,
    documentNumber,
    date: dateStr,
    dueDateOrValidUntil: {
      label: dueOrValidLabel,
      value: dueOrValidValue,
    },
    tenant: {
      businessName: tenant?.businessName || "My Business",
      address: tenant?.address
        ? typeof tenant.address === "string"
          ? tenant.address
          : `${tenant.address.street || ""}, ${tenant.address.city || ""} ${tenant.address.state || ""} ${tenant.address.postalCode || ""}`.trim()
        : "",
      phone: tenant?.phone || "",
      email: tenant?.email || "",
      gstin: tenant?.gstin || "",
      pan: tenant?.pan || "",
      logoUrl: tenant?.settings?.logoUrl || "",
      signatureUrl: tenant?.settings?.signatureUrl || "",
      bankDetails,
    },
    client: {
      name: doc.clientName || "Customer",
      companyName: doc.clientCompanyName || "",
      address: doc.clientAddress || "",
      phone: doc.clientPhone || "",
      email: doc.clientEmail || "",
      gstin: doc.clientGstin || "",
      pan: doc.clientPan || "",
    },
    shippingAddress: (docAny.shippingAddress as string) || doc.clientAddress || "",
    placeOfSupply: (docAny.placeOfSupply as string) || "",
    eWayBillNo: (docAny.eWayBillNo as string) || "",
    poNumber: (docAny.poNumber as string) || "",
    vehicleNo: (docAny.vehicleNo as string) || "",
    items: normalizedItems,
    subtotal: doc.subtotal || 0,
    discountAmount: doc.discountAmount || 0,
    taxBreakdown,
    totalTax,
    totalAmount: doc.totalAmount || 0,
    totalInWords: numberToWords(doc.totalAmount || 0),
    receivedAmount,
    balanceDue,
    notes: doc.notes || "",
    terms: doc.termsAndConditions || "",
    upiUri,
    upiQrUrl,
    isTaxEnabled,
    isFullyPaid,
    hasHsn,
    hasQtyOrRate,
  };
}
