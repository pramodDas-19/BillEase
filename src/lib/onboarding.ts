import { Tenant } from "@/types";

export interface ChecklistState {
  businessDetailsComplete: boolean;
  hasFirstClient: boolean;
  hasFirstDocument: boolean;
  hasSentPaymentLink: boolean;
}

export interface ChecklistItem {
  id: keyof ChecklistState;
  title: string;
  description: string;
  href: string;
  isCompleted: boolean;
}

export function computeChecklistState(
  tenant: Tenant | null,
  clientCount: number,
  invoiceCount: number,
  quotationCount: number,
  paymentCount: number
): ChecklistState {
  const upiId = tenant?.bankDetails?.upiId?.trim() || "";
  const city = tenant?.address?.city?.trim() || "";
  const businessDetailsComplete = Boolean(upiId && city);

  const hasFirstClient = clientCount > 0;
  const hasFirstDocument = invoiceCount + quotationCount > 0;
  const hasSentPaymentLink = paymentCount > 0 || invoiceCount > 0;

  return {
    businessDetailsComplete,
    hasFirstClient,
    hasFirstDocument,
    hasSentPaymentLink,
  };
}

export function getChecklistProgress(state: ChecklistState): number {
  return [
    state.businessDetailsComplete,
    state.hasFirstClient,
    state.hasFirstDocument,
    state.hasSentPaymentLink,
  ].filter(Boolean).length;
}

export function getChecklistItems(state: ChecklistState): ChecklistItem[] {
  return [
    {
      id: "businessDetailsComplete",
      title: "Add your business details",
      description: "Configure Bank UPI & address for invoices",
      href: "/settings",
      isCompleted: state.businessDetailsComplete,
    },
    {
      id: "hasFirstClient",
      title: "Add your first client",
      description: "Save customer contact & billing address",
      href: "/clients",
      isCompleted: state.hasFirstClient,
    },
    {
      id: "hasFirstDocument",
      title: "Create your first invoice or quotation",
      description: "Generate a professional GST-compliant bill",
      href: "/invoices/new",
      isCompleted: state.hasFirstDocument,
    },
    {
      id: "hasSentPaymentLink",
      title: "Get your first payment",
      description: "Collect settlement via dynamic UPI QR code",
      href: "/payments",
      isCompleted: state.hasSentPaymentLink,
    },
  ];
}
