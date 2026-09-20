import { getTemplateById } from "@/config/document-templates";

export function triggerDocumentPrint(
  docNumber: string,
  docTypePrefix: "Invoice" | "Quotation",
  templateId: string
) {
  if (typeof window === "undefined") return;

  const meta = getTemplateById(templateId);
  const styleId = "dynamic-print-page-override";

  // Determine exact @page size and margins
  let pageSizeRule = "A4 portrait";
  let pageMargin = "6mm 8mm 6mm 8mm";

  if (meta.category === "a5") {
    if (meta.orientation === "landscape") {
      pageSizeRule = "A5 landscape";
      pageMargin = "4mm 6mm 4mm 6mm";
    } else {
      pageSizeRule = "A5 portrait";
      pageMargin = "4mm 6mm 4mm 6mm";
    }
  } else if (meta.category === "thermal") {
    if (meta.paperWidthMm <= 58) {
      pageSizeRule = "58mm auto";
      pageMargin = "1mm 1mm 1mm 1mm";
    } else {
      pageSizeRule = "80mm auto";
      pageMargin = "1mm 1mm 1mm 1mm";
    }
  }

  // Inject or update the dynamic print style tag
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = `
    @media print {
      @page {
        size: ${pageSizeRule} !important;
        margin: ${pageMargin} !important;
      }
    }
  `;

  // Set document title for PDF saving
  const originalTitle = document.title;
  if (docNumber) {
    document.title = `BillEase_${docTypePrefix}_${docNumber.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  }

  window.print();

  setTimeout(() => {
    document.title = originalTitle;
  }, 2000);
}

/**
 * 1-Click trigger to directly download a document PDF from any view (detail page, listing card, etc.)
 * Loads the document in a hidden iframe with ?download=true which executes direct file saving
 * without opening the browser's native print dialog.
 */
export function downloadDocumentPdf(previewUrl: string) {
  if (typeof window === "undefined") return;
  const url = new URL(previewUrl, window.location.origin);
  url.searchParams.set("download", "true");

  try {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.left = "-9999px";
    iframe.style.top = "0";
    iframe.style.width = "850px";
    iframe.style.height = "1100px";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    iframe.src = url.toString();
    document.body.appendChild(iframe);

    // Auto-clean up iframe after download completes
    setTimeout(() => {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    }, 12000);
  } catch (err) {
    console.warn("Could not use hidden iframe, falling back to window download:", err);
    window.open(url.toString(), "_blank");
  }
}

