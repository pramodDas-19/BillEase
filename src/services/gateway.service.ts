import { generateUpiIntentUrl, getUpiQrImageUrl } from "@/lib/upi";

export interface CreatePaymentLinkParams {
  invoiceId: string;
  invoiceNumber: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  amount: number;
  description?: string;
}

export interface PaymentLinkResponse {
  linkId: string;
  paymentUrl: string;
  qrImageUrl: string;
  amount: number;
  currency: string;
  status: "created" | "paid" | "expired";
}

export class PaymentGatewayService {
  /**
   * Generates a Hosted Payment Link and Dynamic QR Code.
   * Can be plugged into Razorpay, Cashfree, or Standard UPI Intent.
   */
  static async createPaymentLink(params: CreatePaymentLinkParams): Promise<PaymentLinkResponse> {
    const defaultUpiId = "royalevents@hdfcbank";
    const defaultBusiness = "Royal Events & Studio";

    const upiUri = generateUpiIntentUrl({
      upiId: defaultUpiId,
      businessName: defaultBusiness,
      amount: params.amount,
      transactionRef: params.invoiceNumber,
      note: `Invoice ${params.invoiceNumber}`,
    });

    const qrUrl = getUpiQrImageUrl(upiUri, 320);
    const linkId = `plink_${Date.now().toString().slice(-6)}`;

    // In production, when RAZORPAY_KEY_ID is provided, calls Razorpay API:
    // POST https://api.razorpay.com/v1/payment_links
    const simulatedPaymentUrl = `https://pay.billease.app/pay/${params.invoiceId}?amt=${params.amount}`;

    return {
      linkId,
      paymentUrl: simulatedPaymentUrl,
      qrImageUrl: qrUrl,
      amount: params.amount,
      currency: "INR",
      status: "created",
    };
  }

  /**
   * Generates a pre-filled WhatsApp payment intent message with UPI link.
   */
  static getWhatsAppPaymentMessage(
    clientName: string,
    invoiceNumber: string,
    balanceDue: number,
    upiId: string = "royalevents@hdfcbank"
  ): string {
    const formattedAmount = `₹${balanceDue.toLocaleString("en-IN")}`;
    return encodeURIComponent(
      `Hello ${clientName}, this is regarding Invoice #${invoiceNumber}. Outstanding balance: ${formattedAmount}.\n\nYou can settle instantly via UPI to: ${upiId} or scan the QR code on your invoice. Thank you!`
    );
  }
}
