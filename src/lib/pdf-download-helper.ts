export interface PdfExportOptions {
  filename?: string;
  orientation?: "portrait" | "landscape";
  format?: "a4" | "a5" | "thermal";
  targetWidthPx?: number;
}

/**
 * Directly downloads an HTML element as a high-fidelity PDF file in the browser
 * without opening the browser's native print dialog.
 */
export async function downloadElementAsPdf(
  element: HTMLElement,
  filename: string,
  options?: PdfExportOptions
): Promise<boolean> {
  try {
    const orientation = options?.orientation || "portrait";
    const format = options?.format || "a4";
    const isThermal = format === "thermal";
    const targetWidthPx = options?.targetWidthPx || (isThermal ? 380 : 800);

    // Lazy load heavy PDF generation libraries on-demand
    const [html2canvasModule, jsPdfModule] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);
    const html2canvas = html2canvasModule.default || html2canvasModule;
    const jsPDF = jsPdfModule.default || jsPdfModule;

    // 1. Target the actual document root element (bypass outer flex/centering wrappers)
    const targetEl =
      (element.querySelector(".document-print-root") as HTMLElement) ||
      (element.querySelector(".responsive-sheet-inner") as HTMLElement) ||
      element;

    // Capture element canvas at 2x resolution for crisp text & borders
    const canvas = await html2canvas(targetEl, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: targetWidthPx,
      onclone: (_clonedDoc, clonedElement) => {
        // Ensure scaled mobile previews are reset to native unscaled layout in PDF
        const inners = clonedElement.querySelectorAll<HTMLElement>(".responsive-sheet-inner");
        inners.forEach((el) => {
          el.style.transform = "none";
          el.style.width = `${targetWidthPx}px`;
        });
        const outers = clonedElement.querySelectorAll<HTMLElement>(".responsive-sheet-outer");
        outers.forEach((el) => {
          el.style.transform = "none";
          el.style.width = `${targetWidthPx}px`;
          el.style.height = "auto";
        });
        const roots = clonedElement.querySelectorAll<HTMLElement>(".document-print-root");
        roots.forEach((el) => {
          el.style.width = `${targetWidthPx}px`;
          el.style.maxWidth = `${targetWidthPx}px`;
          el.style.margin = "0 auto";
          el.style.padding = isThermal ? "8px" : "24px 28px";
          el.style.boxShadow = "none";
          el.style.border = "none";
        });
        // If the clonedElement itself is the root
        if (clonedElement.classList.contains("document-print-root")) {
          clonedElement.style.width = `${targetWidthPx}px`;
          clonedElement.style.maxWidth = `${targetWidthPx}px`;
          clonedElement.style.margin = "0 auto";
          clonedElement.style.padding = isThermal ? "8px" : "24px 28px";
          clonedElement.style.boxShadow = "none";
          clonedElement.style.border = "none";
        }
        const controls = clonedElement.querySelectorAll<HTMLElement>(".responsive-sheet-controls");
        controls.forEach((el) => {
          el.style.display = "none";
        });
      },
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    // 2. Initialize jsPDF
    if (isThermal) {
      // 80mm continuous thermal slip layout
      const imgWidth = 80;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const slipHeight = Math.max(100, Math.ceil(imgHeight + 6));

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, slipHeight],
      });

      pdf.addImage(imgData, "JPEG", 0, 3, imgWidth, imgHeight);

      const safeFilename = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
      pdf.save(safeFilename);
      return true;
    }

    const isA5 = format === "a5";
    const isLandscape = orientation === "landscape";

    const pdf = new jsPDF({
      orientation: isLandscape ? "landscape" : "portrait",
      unit: "mm",
      format: isA5 ? "a5" : "a4",
    });

    const pageWidth = isLandscape ? (isA5 ? 210 : 297) : (isA5 ? 148 : 210);
    const pageHeight = isLandscape ? (isA5 ? 148 : 210) : (isA5 ? 210 : 297);

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Multi-page handling if document exceeds one page
    while (heightLeft > 5) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // 3. Save directly to Downloads folder
    const safeFilename = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
    pdf.save(safeFilename);
    return true;
  } catch (error) {
    console.error("Failed to generate direct PDF download:", error);
    return false;
  }
}
