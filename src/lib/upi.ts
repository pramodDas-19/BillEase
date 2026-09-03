import QRCode from "qrcode";

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
 * Returns a crisp, 100% offline local SVG data URI for the generated UPI string.
 * Zero external network calls (no api.qrserver.com), fully private, instant 0ms render.
 */
export function getUpiQrImageUrl(upiUrl: string, size = 300): string {
  try {
    const qr = QRCode.create(upiUrl, { errorCorrectionLevel: "M" });
    const moduleCount = qr.modules.size;
    const margin = 2;
    const totalBoxes = moduleCount + margin * 2;

    let path = "";
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (qr.modules.get(r, c)) {
          path += `M${c + margin} ${r + margin}h1v1h-1z `;
        }
      }
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalBoxes} ${totalBoxes}" shape-rendering="crispEdges" width="${size}" height="${size}"><rect width="100%" height="100%" fill="#ffffff"/><path d="${path.trim()}" fill="#000000"/></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  } catch (err) {
    console.error("Local QR generation error:", err);
    return `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="10" y="50" font-size="12">QR Error</text></svg>')}`;
  }
}

