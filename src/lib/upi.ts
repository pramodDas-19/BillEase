/**
 * Generates standardized Indian UPI Payment Intent URI
 * Compatible with Google Pay, PhonePe, Paytm, BHIM, Cred, and all UPI apps.
 */
export interface UpiIntentParams {
  upiId: string;
  businessName: string;
  amount?: number;
  transactionRef?: string;
  note?: string;
}

export function generateUpiIntentUrl({
  upiId,
  businessName,
  amount,
  transactionRef,
  note,
}: UpiIntentParams): string {
  const cleanUpi = encodeURIComponent(upiId.trim());
  const cleanName = encodeURIComponent(businessName.trim());
  const cleanNote = encodeURIComponent(note || `Payment for ${transactionRef || "BillEase Invoice"}`);
  const cleanRef = transactionRef ? encodeURIComponent(transactionRef) : "";

  let url = `upi://pay?pa=${cleanUpi}&pn=${cleanName}&tn=${cleanNote}&cu=INR`;

  if (amount && amount > 0) {
    url += `&am=${amount.toFixed(2)}`;
  }

  if (cleanRef) {
    url += `&tr=${cleanRef}`;
  }

  return url;
}

/**
 * Returns a high-res QR code image URL for the generated UPI string.
 */
export function getUpiQrImageUrl(upiUrl: string, size = 300): string {
  const encoded = encodeURIComponent(upiUrl);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&margin=8`;
}
