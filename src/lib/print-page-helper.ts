import { getTemplateById } from "@/config/document-templates";

export function triggerDocumentPrint(
  docNumber: string,
  docTypePrefix: "Invoice" | "Quotation",
  templateId: string
) {
  if (typeof window === "undefined") return;

  const meta = getTemplateById(templateId);
  const styleId = "dynamic-print-page-override";

  // Determine exact standard @page size and physical document width
  let pageSizeRule = "A4";
  let docWidthRule = "210mm";
  let docPadding = "6mm 8mm";

  if (meta.category === "a5") {
    if (meta.orientation === "landscape") {
      pageSizeRule = "A5 landscape";
      docWidthRule = "210mm";
      docPadding = "4mm 6mm";
    } else {
      pageSizeRule = "A5 portrait";
      docWidthRule = "148mm";
      docPadding = "4mm 6mm";
    }
  } else if (meta.category === "thermal") {
    if (meta.paperWidthMm <= 58) {
      pageSizeRule = "58mm auto";
      docWidthRule = "58mm";
      docPadding = "1mm 1mm";
    } else {
      pageSizeRule = "80mm auto";
      docWidthRule = "80mm";
      docPadding = "2mm 2mm";
    }
  } else if (meta.orientation === "landscape") {
    pageSizeRule = "A4 landscape";
    docWidthRule = "297mm";
    docPadding = "6mm 8mm";
  }

  // Inject or update the dynamic print style tag
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  // Strict single-page mobile & desktop print stylesheet:
  // 1. @page explicitly locks standard A4 dimensions (preventing mobile Android spooler from defaulting to Foolscap).
  // 2. html & body take exact 100% width with 0 margins, preventing viewport clipping.
  // 3. .responsive-sheet-outer and .responsive-sheet-inner are normalized to 0 padding/margin.
  // 4. .document-print-root gets the exact page padding and enforces single-page break avoidance.
  styleEl.textContent = `
    @page {
      size: ${pageSizeRule};
      margin: 0;
    }
    @media print {
      html, body {
        width: 100% !important;
        max-width: 100% !important;
        height: auto !important;
        min-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
        overflow: visible !important;
      }
      .responsive-sheet-outer {
        width: 100% !important;
        min-width: 100% !important;
        max-width: none !important;
        height: auto !important;
        min-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        transform: none !important;
        overflow: visible !important;
        background: transparent !important;
        box-shadow: none !important;
        border: none !important;
      }
      .responsive-sheet-inner {
        width: 100% !important;
        min-width: 100% !important;
        max-width: none !important;
        height: auto !important;
        min-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        transform: none !important;
        overflow: visible !important;
        background: transparent !important;
        box-shadow: none !important;
        border: none !important;
        border-radius: 0 !important;
      }
      .document-print-root {
        width: 100% !important;
        max-width: ${docWidthRule} !important;
        min-height: 0 !important;
        height: auto !important;
        box-sizing: border-box !important;
        margin: 0 auto !important;
        padding: ${docPadding} !important;
        transform: none !important;
        box-shadow: none !important;
        border: none !important;
        border-radius: 0 !important;
        overflow: visible !important;
        background: #ffffff !important;
        break-inside: avoid !important;
        page-break-inside: avoid !important;
        break-after: avoid !important;
        page-break-after: avoid !important;
      }
      .avoid-break {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
        break-after: avoid !important;
        page-break-after: avoid !important;
      }
      .responsive-sheet-controls,
      .print\\:hidden,
      nav,
      aside,
      header,
      footer {
        display: none !important;
      }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  `;

  // Set document title for PDF saving
  const originalTitle = document.title;
  if (docNumber) {
    document.title = `BillEase_${docTypePrefix}_${docNumber.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  }

  const cleanup = () => {
    document.title = originalTitle;
  };

  window.addEventListener("afterprint", cleanup, { once: true });
  setTimeout(cleanup, 4000);

  window.print();
}

/**
 * 1-Click trigger to directly download a high-fidelity document PDF from any view
 * (invoice/quote lists, detail view, etc.).
 * Opens the preview with autoPrint=true which automatically triggers the native
 * browser "Save as PDF" engine, generating crisp vector-grade PDFs.
 */
export function downloadDocumentPdf(previewUrl: string) {
  if (typeof window === "undefined") return;
  const url = new URL(previewUrl, window.location.origin);
  url.searchParams.set("autoPrint", "true");
  window.open(url.toString(), "_blank");
}

