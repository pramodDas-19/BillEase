import React from "react";
import { Invoice, Quotation, Tenant } from "@/types";
import { normalizeDocument } from "./templates/shared/template-adapter";
import { getTemplateById } from "@/config/document-templates";
import { cn } from "@/lib/utils";

// 5 A4 Templates
import { A4AdvancedGstTemplate } from "./templates/a4/a4-advanced-gst";
import { A4TallyTemplate } from "./templates/a4/a4-tally";
import { A4LuxuryTemplate } from "./templates/a4/a4-luxury";
import { A4ModernTemplate } from "./templates/a4/a4-modern";
import { A4BillbookTemplate } from "./templates/a4/a4-billbook";

// 5 A5 Templates
import { A5LandscapeGstTemplate } from "./templates/a5/a5-landscape-gst";
import { A5LandscapeBillbookTemplate } from "./templates/a5/a5-landscape-billbook";
import { A5PortraitChallanTemplate } from "./templates/a5/a5-portrait-challan";
import { A5PortraitModernTemplate } from "./templates/a5/a5-portrait-modern";
import { A5TraditionalBahiTemplate } from "./templates/a5/a5-traditional-bahi";

// 5 Thermal Templates
import { Thermal80mmStandardTemplate } from "./templates/thermal/thermal-80mm-standard";
import { Thermal80mmGstQrTemplate } from "./templates/thermal/thermal-80mm-gst-qr";
import { Thermal58mmCompactTemplate } from "./templates/thermal/thermal-58mm-compact";
import { ThermalBoutiqueCafeTemplate } from "./templates/thermal/thermal-boutique-cafe";
import { ThermalGroceryRetailTemplate } from "./templates/thermal/thermal-grocery-retail";

export interface DocumentTemplateRendererProps {
  document: Invoice | Quotation;
  type: "invoice" | "quotation";
  tenant: Tenant | null | undefined;
  templateId?: string;
}

export function DocumentTemplateRenderer({
  document,
  type,
  tenant,
  templateId = "a4_modern",
}: DocumentTemplateRendererProps) {
  const normDoc = normalizeDocument(document, type, tenant);
  const meta = getTemplateById(templateId);

  // Determine wrapper styling for desktop screen preview
  const wrapperClass =
    meta.category === "thermal"
      ? "max-w-sm mx-auto shadow-md rounded-xl bg-white border border-slate-200 overflow-hidden print:shadow-none print:border-none print:m-0 print:p-0 print:max-w-none"
      : meta.category === "a5" && meta.orientation === "landscape"
      ? "max-w-3xl mx-auto shadow-sm rounded-xl bg-white border border-slate-200 print:shadow-none print:border-none print:m-0 print:p-0 print:max-w-none"
      : meta.category === "a5"
      ? "max-w-md mx-auto shadow-sm rounded-xl bg-white border border-slate-200 print:shadow-none print:border-none print:m-0 print:p-0 print:max-w-none"
      : "max-w-4xl mx-auto shadow-sm rounded-xl bg-white border border-slate-200 print:shadow-none print:border-none print:m-0 print:p-0 print:max-w-none";

  const renderTemplateContent = () => {
    switch (templateId) {
      // 5 A4
      case "a4_advanced_gst":
        return <A4AdvancedGstTemplate doc={normDoc} />;
      case "a4_tally":
        return <A4TallyTemplate doc={normDoc} />;
      case "a4_luxury":
        return <A4LuxuryTemplate doc={normDoc} />;
      case "a4_modern":
        return <A4ModernTemplate doc={normDoc} />;
      case "a4_billbook":
        return <A4BillbookTemplate doc={normDoc} />;

      // 5 A5
      case "a5_landscape_gst":
        return <A5LandscapeGstTemplate doc={normDoc} />;
      case "a5_landscape_billbook":
        return <A5LandscapeBillbookTemplate doc={normDoc} />;
      case "a5_portrait_challan":
        return <A5PortraitChallanTemplate doc={normDoc} />;
      case "a5_portrait_modern":
        return <A5PortraitModernTemplate doc={normDoc} />;
      case "a5_traditional_bahi":
        return <A5TraditionalBahiTemplate doc={normDoc} />;

      // 5 Thermal
      case "thermal_80mm_standard":
        return <Thermal80mmStandardTemplate doc={normDoc} />;
      case "thermal_80mm_gst_qr":
        return <Thermal80mmGstQrTemplate doc={normDoc} />;
      case "thermal_58mm_compact":
        return <Thermal58mmCompactTemplate doc={normDoc} />;
      case "thermal_boutique_cafe":
        return <ThermalBoutiqueCafeTemplate doc={normDoc} />;
      case "thermal_grocery_retail":
        return <ThermalGroceryRetailTemplate doc={normDoc} />;

      default:
        return <A4AdvancedGstTemplate doc={normDoc} />;
    }
  };

  return (
    <div className={cn(wrapperClass, "relative overflow-hidden")}>
      {/* Official Paid Rubber Stamp when invoice is settled */}
      {type === "invoice" && normDoc.isFullyPaid && (
        <div
          className={cn(
            "absolute pointer-events-none select-none z-30 transition-all",
            meta.category === "thermal"
              ? "top-8 right-2 w-20 opacity-90 print:w-16 print:top-6 print:right-2"
              : meta.category === "a5"
              ? "top-4 right-44 sm:top-5 sm:right-52 w-26 sm:w-34 opacity-95 print:w-26 print:top-4 print:right-44"
              : "top-4 right-60 sm:top-5 sm:right-68 md:right-76 w-32 sm:w-42 opacity-95 print:w-32 print:top-4 print:right-60"
          )}
        >
          <img
            src="/assets/logo/paid-stamp.png"
            alt="PAID Stamp"
            className="w-full h-auto object-contain drop-shadow-xs"
          />
        </div>
      )}
      {renderTemplateContent()}
    </div>
  );
}
