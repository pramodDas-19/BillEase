export interface PdfExportOptions {
  filename?: string;
  orientation?: "portrait" | "landscape";
  format?: "a4" | "a5" | "thermal";
  targetWidthPx?: number;
}

/**
 * Directly downloads an HTML element as a high-fidelity PDF file in the browser
 * without opening the browser's native print dialog.
 * 
 * Works flawlessly on both Mobile (iOS/Android) and Desktop by rendering in
 * an isolated full-width off-screen sandbox to avoid mobile viewport squishing.
 */
export async function downloadElementAsPdf(
  element: HTMLElement,
  filename: string,
  options?: PdfExportOptions
): Promise<boolean> {
  let sandbox: HTMLElement | null = null;
  try {
    const orientation = options?.orientation || "portrait";
    const format = options?.format || "a4";
    const isThermal = format === "thermal";
    const isA5 = format === "a5";
    const isLandscape = orientation === "landscape";

    // Standard desktop pixel widths for pixel-perfect typography & tables
    const targetWidthPx =
      options?.targetWidthPx || (isThermal ? 380 : isA5 && !isLandscape ? 560 : isLandscape ? 1120 : 800);

    // Lazy load heavy PDF generation libraries on-demand
    const [html2canvasModule, jsPdfModule] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);
    const html2canvas = html2canvasModule.default || html2canvasModule;
    const jsPDF = jsPdfModule.default || jsPdfModule;

    // 1. Target the actual document root element
    const targetEl =
      (element.querySelector(".document-print-root") as HTMLElement) ||
      (element.querySelector(".responsive-sheet-inner") as HTMLElement) ||
      element;

    // 2. Create an isolated staging sandbox positioned at (0,0) with opacity 0
    // Origin (0,0) prevents sub-pixel coordinate matrix distortion from large negative coordinates (-99999px)
    sandbox = document.createElement("div");
    sandbox.id = "billease-pdf-staging-sandbox";
    sandbox.style.position = "fixed";
    sandbox.style.left = "0";
    sandbox.style.top = "0";
    sandbox.style.opacity = "0";
    sandbox.style.pointerEvents = "none";
    sandbox.style.width = `${targetWidthPx}px`;
    sandbox.style.minWidth = `${targetWidthPx}px`;
    sandbox.style.maxWidth = `${targetWidthPx}px`;
    sandbox.style.background = "#ffffff";
    sandbox.style.zIndex = "-9999";
    sandbox.style.overflow = "visible";
    sandbox.style.boxSizing = "border-box";
    sandbox.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

    // Inject canvas font alignment styles to correct Android/Chrome baseline shifting
    const canvasStyle = document.createElement("style");
    canvasStyle.textContent = `
      #billease-pdf-staging-sandbox {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
        -webkit-font-smoothing: antialiased !important;
      }
      #billease-pdf-staging-sandbox * {
        box-sizing: border-box !important;
        letter-spacing: 0.01px !important;
      }
      #billease-pdf-staging-sandbox img {
        display: inline-block !important;
        vertical-align: middle !important;
      }
      #billease-pdf-staging-sandbox table {
        border-collapse: collapse !important;
      }
      #billease-pdf-staging-sandbox table th,
      #billease-pdf-staging-sandbox table td {
        vertical-align: middle !important;
        line-height: 1.35 !important;
      }
      #billease-pdf-staging-sandbox p,
      #billease-pdf-staging-sandbox span,
      #billease-pdf-staging-sandbox div,
      #billease-pdf-staging-sandbox h1,
      #billease-pdf-staging-sandbox h2,
      #billease-pdf-staging-sandbox h3 {
        line-height: 1.35 !important;
      }
    `;
    sandbox.appendChild(canvasStyle);

    // Clone target element into sandbox
    const clone = targetEl.cloneNode(true) as HTMLElement;
    clone.style.transform = "none";
    clone.style.width = `${targetWidthPx}px`;
    clone.style.minWidth = `${targetWidthPx}px`;
    clone.style.maxWidth = `${targetWidthPx}px`;
    clone.style.minHeight = "0";
    clone.style.height = "auto";
    clone.style.margin = "0 auto";
    clone.style.padding = isThermal ? "8px" : "24px 28px";
    clone.style.boxShadow = "none";
    clone.style.border = "none";
    clone.style.borderRadius = "0";
    clone.style.background = "#ffffff";
    clone.style.boxSizing = "border-box";

    // Strip interactive controls from clone
    const hideElements = clone.querySelectorAll<HTMLElement>(
      ".responsive-sheet-controls, .print\\:hidden, button, [role='button']"
    );
    hideElements.forEach((el) => {
      el.style.display = "none";
    });

    // Reset any nested sheet wrappers inside clone
    const inners = clone.querySelectorAll<HTMLElement>(".responsive-sheet-inner, .responsive-sheet-outer");
    inners.forEach((el) => {
      el.style.transform = "none";
      el.style.width = "100%";
      el.style.height = "auto";
      el.style.boxShadow = "none";
      el.style.border = "none";
    });

    sandbox.appendChild(clone);
    document.body.appendChild(sandbox);

    // Ensure all font metrics and webfonts are completely loaded before rasterization
    if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch {
        // Continue if FontFaceSet is unavailable
      }
    }

    // Give browser sufficient ticks to compute font layout at 1:1 scale
    await new Promise((resolve) => setTimeout(resolve, 120));

    // 3. Capture canvas at 2x resolution for crisp vector-like text & borders
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: "#ffffff",
      width: targetWidthPx,
      windowWidth: targetWidthPx,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    // 4. Initialize jsPDF
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
      return savePdfFile(pdf, filename);
    }

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

    return savePdfFile(pdf, filename);
  } catch (error) {
    console.error("Failed to generate direct PDF download:", error);
    return false;
  } finally {
    if (sandbox && sandbox.parentNode) {
      sandbox.parentNode.removeChild(sandbox);
    }
  }
}

/**
 * Universal Mobile (iOS / Android) & Desktop safe PDF save helper
 */
function savePdfFile(pdf: any, filename: string): boolean {
  const safeFilename = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  const isIOS =
    typeof navigator !== "undefined" &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

  try {
    const blob = pdf.output("blob");
    const blobUrl = URL.createObjectURL(blob);

    if (isIOS) {
      // iOS Safari: open blob in native Safari PDF viewer for 1-click "Save to Files" / Share
      const win = window.open(blobUrl, "_blank");
      if (!win) {
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = safeFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else {
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = safeFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    setTimeout(() => {
      try {
        URL.revokeObjectURL(blobUrl);
      } catch {}
    }, 20000);
    return true;
  } catch (saveErr) {
    console.warn("Direct blob download fallback to pdf.save():", saveErr);
    pdf.save(safeFilename);
    return true;
  }
}
