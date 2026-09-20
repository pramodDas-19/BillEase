"use client";

import React, { useState, useRef } from "react";
import {
  parseCatalogSpreadsheet,
  downloadSampleCatalogExcel,
  ParsedCatalogItem,
  CatalogImportResult,
} from "@/lib/excel-catalog-importer";
import { CatalogService } from "@/services/service.service";
import { formatCurrency, cn } from "@/lib/utils";
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Package,
  Layers,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

interface CatalogImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (importedCount: number) => void;
}

export function CatalogImportModal({
  isOpen,
  onClose,
  onImportSuccess,
}: CatalogImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState<CatalogImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsParsing(true);
    setImportStatus("idle");
    setStatusMessage("");

    const result = await parseCatalogSpreadsheet(selectedFile);
    setParsedResult(result);
    setIsParsing(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleReset = () => {
    setFile(null);
    setParsedResult(null);
    setImportStatus("idle");
    setStatusMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleConfirmImport = async () => {
    if (!parsedResult || parsedResult.validItems.length === 0) return;

    setIsImporting(true);
    setImportStatus("idle");

    try {
      const itemsToInsert = parsedResult.validItems.map((item) => ({
        name: item.name,
        category: item.category,
        rate: item.rate,
        unit: item.unit,
        hsnSac: item.hsnSac,
        gstRate: item.gstRate,
        description: item.description,
        isActive: true,
      }));

      const res = await CatalogService.createBatchServices(itemsToInsert);

      if (res.error && res.successCount === 0) {
        setImportStatus("error");
        setStatusMessage(res.error || "Failed to import items. Please try again.");
      } else {
        setImportStatus("success");
        setStatusMessage(`Successfully imported ${res.successCount} catalog items into BillEase!`);
        setTimeout(() => {
          onImportSuccess(res.successCount);
          onClose();
          handleReset();
        }, 1200);
      }
    } catch (err: any) {
      setImportStatus("error");
      setStatusMessage(err?.message || "An unexpected error occurred during import.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50 duration-200">
      <div className="clay-card relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/90 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col justify-between overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="clay-icon-squircle p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Import Catalog from Excel / CSV
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Bulk import your products and services with pre-set rates and GST slabs.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-4">
          {/* STEP 1: File Dropzone & Template Download (if no valid result yet) */}
          {!parsedResult ? (
            <div className="space-y-4">
              {/* Sample Template Download Pill */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200/70 flex flex-col xs:flex-row xs:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-white border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                    <Download className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Need the correct Excel format?</h5>
                    <p className="text-[11px] text-slate-500 font-medium">Download our starter template with pre-filled columns.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={downloadSampleCatalogExcel}
                  className="clay-tag inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs transition-colors cursor-pointer shrink-0"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Sample</span>
                </button>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-50/20 rounded-3xl p-8 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />

                <div className="clay-icon-squircle p-3.5 bg-white border border-slate-200 group-hover:border-emerald-300 text-slate-500 group-hover:text-emerald-600 rounded-2xl mb-3 shadow-xs transition-colors">
                  {isParsing ? (
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  ) : (
                    <Upload className="h-6 w-6" />
                  )}
                </div>

                <h4 className="text-sm font-bold text-slate-900">
                  {isParsing ? "Reading spreadsheet..." : "Drag & drop your Excel or CSV file here"}
                </h4>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  or <span className="text-emerald-700 font-bold underline underline-offset-2">browse files</span> from your device
                </p>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-3">
                  Supports .xlsx, .xls, .csv (Max 1,000 items)
                </span>
              </div>
            </div>
          ) : (
            /* STEP 2: Parsed Preview & Validation View */
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              {/* Summary Pill */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block truncate max-w-xs">
                      {parsedResult.fileName}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {parsedResult.validItems.length} valid {parsedResult.validItems.length === 1 ? "item" : "items"} detected
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Choose Another File</span>
                </button>
              </div>

              {/* Parsing Error Banner */}
              {parsedResult.error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{parsedResult.error}</span>
                </div>
              )}

              {/* Invalid items warning if some rows had missing names */}
              {parsedResult.invalidItems.length > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>
                    Skipping {parsedResult.invalidItems.length} row(s) with missing item names.
                  </span>
                </div>
              )}

              {/* Preview Table */}
              {parsedResult.validItems.length > 0 && (
                <div className="clay-card overflow-hidden border border-slate-200/80 rounded-2xl max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] sticky top-0 bg-slate-100 z-10">
                      <tr>
                        <th className="py-2.5 px-3">Item / Service Name</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Unit</th>
                        <th className="py-2.5 px-3">HSN/SAC</th>
                        <th className="py-2.5 px-3 text-right">Rate</th>
                        <th className="py-2.5 px-3 text-right">GST</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedResult.validItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2 px-3 font-bold text-slate-900 truncate max-w-[160px]">
                            {item.name}
                          </td>
                          <td className="py-2 px-3 text-slate-600 text-[11px]">
                            {item.category}
                          </td>
                          <td className="py-2 px-3 text-slate-600 text-[11px]">
                            {item.unit || "-"}
                          </td>
                          <td className="py-2 px-3 text-slate-500 font-mono text-[10px]">
                            {item.hsnSac || "-"}
                          </td>
                          <td className="py-2 px-3 text-right font-extrabold text-slate-900">
                            {formatCurrency(item.rate, "INR")}
                          </td>
                          <td className="py-2 px-3 text-right font-semibold text-slate-600">
                            {item.gstRate}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Status feedback message */}
          {statusMessage && (
            <div
              className={cn(
                "p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in-50",
                importStatus === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              )}
            >
              {importStatus === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {parsedResult && parsedResult.validItems.length > 0 && (
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={isImporting || importStatus === "success"}
              className="clay-btn-emerald inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Importing Catalog...</span>
                </>
              ) : importStatus === "success" ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-white" />
                  <span>Import Completed!</span>
                </>
              ) : (
                <>
                  <span>Import {parsedResult.validItems.length} Items</span>
                  <ArrowRight className="h-4 w-4 text-emerald-100" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
