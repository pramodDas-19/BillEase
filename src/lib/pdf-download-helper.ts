import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export interface PdfExportOptions {
  filename?: string;
  orientation?: "portrait" | "landscape";
  format?: "a4" | "a5";
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

    // 1. Capture element canvas at 2x resolution for crisp text & borders
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: 800,
      onclone: (_clonedDoc, clonedElement) => {
        // Ensure scaled mobile previews are reset to full native 800px unscaled layout in PDF
        const inners = clonedElement.querySelectorAll<HTMLElement>(".responsive-sheet-inner");
        inners.forEach((el) => {
          el.style.transform = "none";
          el.style.width = "800px";
        });
        const outers = clonedElement.querySelectorAll<HTMLElement>(".responsive-sheet-outer");
        outers.forEach((el) => {
          el.style.transform = "none";
          el.style.width = "800px";
          el.style.height = "auto";
        });
        const controls = clonedElement.querySelectorAll<HTMLElement>(".responsive-sheet-controls");
        controls.forEach((el) => {
          el.style.display = "none";
        });
      },
    });

    // 2. Initialize jsPDF
    const pdf = new jsPDF({
      orientation: orientation === "landscape" ? "landscape" : "portrait",
      unit: "mm",
      format,
    });

    const pageWidth = orientation === "landscape" ? 297 : 210;
    const pageHeight = orientation === "landscape" ? 210 : 297;

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const imgData = canvas.toDataURL("image/jpeg", 0.95);

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
