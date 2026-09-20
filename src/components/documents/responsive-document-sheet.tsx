"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ZoomIn, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ResponsiveDocumentSheetProps {
  children: React.ReactNode;
  /** Base desktop paper width in pixels. Defaults to 800 for A4 / standard documents. */
  baseWidth?: number;
  /** Show floating mobile zoom toggle (Fit to Screen vs 100% Zoom)? Defaults to true */
  showZoomControls?: boolean;
  /** Apply realistic paper drop shadow and border? Defaults to true */
  paperEffect?: boolean;
  className?: string;
}

/**
 * ResponsiveDocumentSheet renders documents (invoices, quotations, estimates)
 * at their full desktop paper dimensions (default 800px base width) and proportionally
 * scales them down via CSS transforms on mobile devices to fit the viewport perfectly.
 * 
 * Matches the mobile document viewer design pattern (A4 sheet fit-to-width with
 * margins, paper shadow, and zero horizontal cut-off).
 */
export function ResponsiveDocumentSheet({
  children,
  baseWidth = 800,
  showZoomControls = true,
  paperEffect = true,
  className,
}: ResponsiveDocumentSheetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  const [scale, setScale] = useState<number>(1);
  const [contentHeight, setContentHeight] = useState<number>(0);
  const [isZoom100, setIsZoom100] = useState<boolean>(false);

  const recomputeScale = useCallback(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    if (!containerWidth) return;

    // Measure unscaled content height
    if (innerRef.current) {
      const naturalHeight = innerRef.current.offsetHeight || innerRef.current.scrollHeight;
      if (naturalHeight > 0) {
        setContentHeight(naturalHeight);
      }
    }

    // Leave a small margin (16px on small mobile, 24px on tablet) for paper shadow
    const padding = containerWidth < 480 ? 16 : containerWidth < 768 ? 24 : 0;
    const availableWidth = Math.max(280, containerWidth - padding);

    if (availableWidth < baseWidth) {
      const computedScale = Math.min(1, Math.max(0.32, availableWidth / baseWidth));
      setScale(computedScale);
    } else {
      setScale(1);
    }
  }, [baseWidth]);

  useEffect(() => {
    setMounted(true);
    recomputeScale();

    const handleResize = () => {
      recomputeScale();
    };

    window.addEventListener("resize", handleResize);

    // ResizeObserver on the container to detect modal or layout changes
    let containerRo: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && containerRef.current) {
      containerRo = new ResizeObserver(() => {
        recomputeScale();
      });
      containerRo.observe(containerRef.current);
    }

    // ResizeObserver on the inner content to detect line items or image updates
    let contentRo: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && innerRef.current) {
      contentRo = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect.height > 0) {
            setContentHeight(entry.contentRect.height);
          }
        }
      });
      contentRo.observe(innerRef.current);
    }

    // Secondary timers to catch late font rendering or image asset loads
    const t1 = setTimeout(recomputeScale, 150);
    const t2 = setTimeout(recomputeScale, 600);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (containerRo) containerRo.disconnect();
      if (contentRo) contentRo.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [recomputeScale]);

  // Is scaling actively applied? (Only when viewport is narrower than baseWidth and user hasn't forced 100% zoom)
  const isScalingActive = mounted && scale < 0.98 && !isZoom100;
  const zoomPercent = Math.round((isScalingActive ? scale : 1) * 100);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full overflow-x-hidden print:overflow-visible print:w-auto",
        isZoom100 && "overflow-x-auto",
        className
      )}
    >
      <style jsx global>{`
        @media print {
          .responsive-sheet-outer {
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .responsive-sheet-inner {
            width: 100% !important;
            transform: none !important;
            overflow: visible !important;
          }
          .responsive-sheet-controls {
            display: none !important;
          }
        }
      `}</style>

      {/* Scaled Geometry Outer Container */}
      <div
        className={cn(
          "responsive-sheet-outer relative transition-all duration-150 ease-out",
          isScalingActive ? "mx-auto" : "w-full"
        )}
        style={{
          width: isScalingActive ? `${baseWidth * scale}px` : isZoom100 ? `${baseWidth}px` : "100%",
          height: isScalingActive && contentHeight > 0 ? `${contentHeight * scale}px` : "auto",
        }}
      >
        {/* Inner Content Wrapper */}
        <div
          ref={innerRef}
          className={cn(
            "responsive-sheet-inner origin-top-left",
            paperEffect &&
              "bg-white shadow-xl rounded-2xl border border-slate-200/90 ring-1 ring-slate-900/5 print:shadow-none print:border-none print:ring-0 print:rounded-none"
          )}
          style={{
            width: isScalingActive || isZoom100 ? `${baseWidth}px` : "100%",
            transform: isScalingActive ? `scale(${scale})` : "none",
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
      </div>

      {/* Optional Floating Mobile Zoom Toggle (Only visible on mobile/tablet when scaled) */}
      {showZoomControls && scale < 0.95 && mounted && (
        <div className="responsive-sheet-controls sticky bottom-3 left-0 right-0 z-30 flex justify-center pointer-events-none mt-2 print:hidden">
          <button
            type="button"
            onClick={() => setIsZoom100((prev) => !prev)}
            className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white text-[11px] font-bold shadow-lg backdrop-blur-xs border border-white/20 transition-all cursor-pointer active:scale-95"
            title={isZoom100 ? "Fit to mobile screen" : "Zoom to 100% actual size"}
          >
            {isZoom100 ? (
              <>
                <Maximize2 className="h-3 w-3 text-emerald-400" />
                <span>Fit to Screen ({Math.round(scale * 100)}%)</span>
              </>
            ) : (
              <>
                <ZoomIn className="h-3 w-3 text-indigo-300" />
                <span>Zoom 100% ({zoomPercent}%)</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
