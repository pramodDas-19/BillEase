import React from "react";
import { Invoice, Quotation, Tenant } from "@/types";
import { normalizeDocument } from "./templates/shared/template-adapter";
import { getTemplateById } from "@/config/document-templates";

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
  templateId = "a4_advanced_gst",
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

  return <div className={wrapperClass}>{renderTemplateContent()}</div>;
}
