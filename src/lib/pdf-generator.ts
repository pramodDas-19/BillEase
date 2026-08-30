/**
 * PDF Generator Utility Placeholder.
 * Designed to support browser printing (window.print()) as well as future headless rendering
 * (e.g., @react-pdf/renderer or server-side Puppeteer/Playwright generation).
 */

export interface PDFExportOptions {
  documentTitle: string;
  filename: string;
  landscape?: boolean;
}

export async function triggerPrintPreview(): Promise<void> {
  if (typeof window !== "undefined") {
    window.print();
  }
}

export function generateShareableWhatsAppUrl(phone: string, text: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

export function generateShareableEmailUrl(email: string, subject: string, body: string): string {
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  return `mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`;
}
