"use client";

import React, { useState, useEffect } from "react";
import {
  DocumentSizeCategory,
  DOCUMENT_TEMPLATES,
  getTemplateById,
  getTemplatesByCategory,
} from "@/config/document-templates";
import { FileText, Printer, Check, Star, Sparkles, Layout } from "lucide-react";
import { TenantService } from "@/services/tenant.service";
import { useTenant } from "@/hooks/use-tenant";

interface DocumentFormatBarProps {
  currentTemplateId: string;
  onSelectTemplate: (templateId: string) => void;
  documentType: "invoice" | "quotation";
  tenantId?: string;
  defaultTemplateId?: string;
  onSavedAsDefault?: () => void;
  onSaveDefault?: (templateId: string, category: DocumentSizeCategory) => Promise<void>;
  hideCardsOnMobile?: boolean;
}

export function DocumentFormatBar({
  currentTemplateId,
  onSelectTemplate,
  documentType,
  tenantId,
  defaultTemplateId,
  onSavedAsDefault,
  onSaveDefault,
  hideCardsOnMobile = true,
}: DocumentFormatBarProps) {
  const { updateTenantSettings } = useTenant();
  const currentMeta = getTemplateById(currentTemplateId);
  const [activeCategory, setActiveCategory] = useState<DocumentSizeCategory>(
    currentMeta.category || "a4"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Synchronize category tabs whenever currentTemplateId changes externally (e.g., via < or > arrows)
  useEffect(() => {
    if (currentMeta?.category && currentMeta.category !== activeCategory) {
      setActiveCategory(currentMeta.category);
    }
  }, [currentMeta?.category, activeCategory]);

  const categoryTemplates = getTemplatesByCategory(activeCategory);

  const handleSetDefault = async () => {
    setIsSaving(true);
    try {
      if (onSaveDefault) {
        await onSaveDefault(currentTemplateId, activeCategory);
      } else {
        const field = documentType === "invoice" ? "defaultInvoiceTemplate" : "defaultQuotationTemplate";
        await updateTenantSettings({
          [field]: currentTemplateId,
          defaultDocumentSize: activeCategory,
        });
        if (tenantId) {
          await TenantService.updateSettings(tenantId, {
            [field]: currentTemplateId,
            defaultDocumentSize: activeCategory,
          });
        }
      }
      setSavedSuccess(true);
      if (onSavedAsDefault) onSavedAsDefault();
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error("Failed to save default template:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm space-y-4 print:hidden">
      {/* 1. Category Switcher Tabs (Matches Reference App Image 5) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Layout className="h-3.5 w-3.5 text-indigo-600" />
            <span>Select Your Document Format</span>
          </h2>
          <p className="text-xs font-bold text-slate-700 mt-0.5">
            Choose from 15 Indian-standard layouts for print, PDF, or thermal slip
          </p>
        </div>

        {/* 3 Size Tabs matching Image 5 */}
        <div className="inline-flex flex-wrap gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setActiveCategory("a4");
              const a4Templates = getTemplatesByCategory("a4");
              if (!a4Templates.some((t) => t.id === currentTemplateId)) {
                onSelectTemplate(a4Templates[0].id);
              }
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeCategory === "a4"
                ? "bg-white text-indigo-700 shadow-xs border border-indigo-200 ring-1 ring-indigo-500/20"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>A4 Size</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveCategory("a5");
              const a5Templates = getTemplatesByCategory("a5");
              if (!a5Templates.some((t) => t.id === currentTemplateId)) {
                onSelectTemplate(a5Templates[0].id);
              }
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeCategory === "a5"
                ? "bg-white text-indigo-700 shadow-xs border border-indigo-200 ring-1 ring-indigo-500/20"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>A5 Size</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveCategory("thermal");
              const thermalTemplates = getTemplatesByCategory("thermal");
              if (!thermalTemplates.some((t) => t.id === currentTemplateId)) {
                onSelectTemplate(thermalTemplates[0].id);
              }
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeCategory === "thermal"
                ? "bg-white text-indigo-700 shadow-xs border border-indigo-200 ring-1 ring-indigo-500/20"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Thermal Printer Size</span>
          </button>
        </div>
      </div>

      {/* 2. Desktop Grid Cards (Hidden on mobile to match Image 5 clean layout) */}
      <div className={`${hideCardsOnMobile ? "hidden sm:grid" : "grid"} grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5`}>
        {categoryTemplates.map((tmpl) => {
          const isSelected = tmpl.id === currentTemplateId;
          const isCurrentDefault = tmpl.id === defaultTemplateId;

          return (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => onSelectTemplate(tmpl.id)}
              className={`text-left p-3 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                isSelected
                  ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20 shadow-xs"
                  : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/70"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                      isSelected
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {tmpl.badge}
                  </span>

                  {isSelected && (
                    <span className="h-4 w-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-xs text-slate-900 leading-snug">
                  {tmpl.name}
                </h3>
                <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                  {tmpl.description}
                </p>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400">
                <span>{tmpl.orientation === "landscape" ? "Landscape" : "Portrait"}</span>
                {isCurrentDefault && (
                  <span className="flex items-center gap-0.5 text-amber-600 font-bold">
                    <Star className="h-2.5 w-2.5 fill-amber-500" /> Default
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Action Footer: Save as Default for this Tenant */}
      <div className="hidden sm:flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500">Active Format:</span>
          <span className="font-bold text-indigo-900 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
            {currentMeta.name} ({currentMeta.category.toUpperCase()} • {currentMeta.orientation})
          </span>
        </div>

        <button
          type="button"
          disabled={isSaving || currentTemplateId === defaultTemplateId}
          onClick={handleSetDefault}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            savedSuccess
              ? "bg-emerald-600 text-white shadow-xs"
              : currentTemplateId === defaultTemplateId
              ? "bg-slate-100 text-slate-400 cursor-default"
              : "clay-btn-secondary text-slate-700 hover:text-slate-900"
          }`}
        >
          {savedSuccess ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>Saved as Default Format</span>
            </>
          ) : currentTemplateId === defaultTemplateId ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span>Current Default Format</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Set as Business Default</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
