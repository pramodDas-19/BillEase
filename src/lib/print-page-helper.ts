import { getTemplateById } from "@/config/document-templates";

export function triggerDocumentPrint(
  docNumber: string,
  docTypePrefix: "Invoice" | "Quotation",
  templateId: string
) {
  if (typeof window === "undefined") return;

  const meta = getTemplateById(templateId);
  const styleId = "dynamic-print-page-override";

  // Determine exact @page size, physical document width, and margins
  let pageSizeRule = "A4 portrait";
  let docWidthRule = "210mm";
  let docPadding = "6mm 8mm 6mm 8mm";

  if (meta.category === "a5") {
    if (meta.orientation === "landscape") {
      pageSizeRule = "A5 landscape";
      docWidthRule = "210mm";
      docPadding = "4mm 6mm 4mm 6mm";
    } else {
      pageSizeRule = "A5 portrait";
      docWidthRule = "148mm";
      docPadding = "4mm 6mm 4mm 6mm";
    }
  } else if (meta.category === "thermal") {
    if (meta.paperWidthMm <= 58) {
      pageSizeRule = "58mm auto";
      docWidthRule = "58mm";
      docPadding = "1mm 1mm 1mm 1mm";
    } else {
      pageSizeRule = "80mm auto";
      docWidthRule = "80mm";
      docPadding = "2mm 2mm 2mm 2mm";
    }
  } else if (meta.orientation === "landscape") {
    pageSizeRule = "A4 landscape";
    docWidthRule = "297mm";
    docPadding = "6mm 8mm 6mm 8mm";
  }

  // Inject or update the dynamic print style tag
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  // Note: !important is forbidden inside @page according to CSS Paged Media specs.
  // Using margin: 0 in @page suppresses default browser header (URL) and footer (page #).
  // Critical for Mobile (iOS & Android):
  // Mobile browsers use the mobile viewport (375px) unless we enforce explicit physical paper widths (210mm)
  // on html, body, and all document containers.
  styleEl.textContent = `
    @page {
      size: ${pageSizeRule};
      margin: 0;
    }
    @media print {
      html, body {
        width: ${docWidthRule} !important;
        min-width: ${docWidthRule} !important;
        margin: 0 auto !important;
        padding: 0 !important;
        background: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      .responsive-sheet-outer,
      .responsive-sheet-inner,
      .document-print-root {
        width: ${docWidthRule} !important;
        min-width: ${docWidthRule} !important;
        max-width: ${docWidthRule} !important;
        transform: none !important;
        box-shadow: none !important;
        border: none !important;
        border-radius: 0 !important;
        margin: 0 auto !important;
        padding: ${docPadding} !important;
        overflow: visible !important;
        background: #ffffff !important;
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

  // Mobile Viewport Switcher for AirPrint & Android Print:
  // Temporarily switch viewport to desktop width (1024px) during print so mobile engines format desktop layout
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  const originalViewport = viewportMeta?.getAttribute("content") || "width=device-width, initial-scale=1";

  if (viewportMeta) {
    viewportMeta.setAttribute("content", "width=1024, initial-scale=1");
  }

  // Set document title for PDF saving
  const originalTitle = document.title;
  if (docNumber) {
    document.title = `BillEase_${docTypePrefix}_${docNumber.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  }

  const cleanup = () => {
    if (viewportMeta) {
      viewportMeta.setAttribute("content", originalViewport);
    }
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

