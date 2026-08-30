import { PaymentMethod } from "@/types";

export interface PaymentMethodOption {
  value: PaymentMethod;
  label: string;
  description: string;
  iconName: string;
}

export const PAYMENT_METHODS: PaymentMethodOption[] = [
  { value: "upi", label: "UPI / QR Code", description: "Google Pay, PhonePe, Paytm, etc.", iconName: "QrCode" },
  { value: "bank_transfer", label: "Bank Transfer (NEFT/RTGS/IMPS)", description: "Direct transfer to business bank account", iconName: "Building2" },
  { value: "cash", label: "Cash", description: "Direct cash payment received", iconName: "Banknote" },
  { value: "cheque", label: "Cheque", description: "Bank cheque deposit", iconName: "FileCheck" },
  { value: "card", label: "Debit / Credit Card", description: "POS or card swipe terminal", iconName: "CreditCard" },
  { value: "online", label: "Online Payment Gateway", description: "Razorpay, Stripe or payment link", iconName: "Globe" },
  { value: "other", label: "Other", description: "Other custom settlement", iconName: "MoreHorizontal" },
];
