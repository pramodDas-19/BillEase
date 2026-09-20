import type { WorkBook } from "xlsx";
import { ServiceItem } from "@/types";

export interface ParsedCatalogItem {
  name: string;
  category: string;
  rate: number;
  unit: string;
  hsnSac: string;
  gstRate: number;
  description: string;
  isValid: boolean;
  validationError?: string;
  rowNumber: number;
}

export interface CatalogImportResult {
  validItems: ParsedCatalogItem[];
  invalidItems: ParsedCatalogItem[];
  totalRows: number;
  fileName: string;
  error?: string;
}

/**
 * Smart Header Field Matching using flexible regex patterns
 */
function findMatchingHeader(headers: string[], regex: RegExp): string | null {
  for (const h of headers) {
    if (regex.test(h.trim())) {
      return h;
    }
  }
  return null;
}

/**
 * Parses a loaded XLSX WorkBook object into validated catalog items
 */
export function parseCatalogWorkbook(
  workbook: WorkBook,
  fileName: string = "catalog.xlsx",
  xlsxLib?: any
): CatalogImportResult {
  try {
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return {
        validItems: [],
        invalidItems: [],
        totalRows: 0,
        fileName,
        error: "The uploaded file does not contain any sheets.",
      };
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Resolve XLSX utils dynamically or from passed module
    const xlsx =
      xlsxLib ||
      (typeof window === "undefined"
        ? // eslint-disable-next-line @typescript-eslint/no-require-imports
          require("xlsx")
        : null);

    if (!xlsx?.utils?.sheet_to_json) {
      return {
        validItems: [],
        invalidItems: [],
        totalRows: 0,
        fileName,
        error: "Spreadsheet parser could not be initialized.",
      };
    }

    // Convert sheet to JSON rows as objects with headers
    const rawRows: Record<string, any>[] = xlsx.utils.sheet_to_json(worksheet, {
      defval: "",
      raw: false,
    });

    if (!rawRows || rawRows.length === 0) {
      return {
        validItems: [],
        invalidItems: [],
        totalRows: 0,
        fileName,
        error: "The spreadsheet is empty. Please add rows to import.",
      };
    }

    // Extract headers from the first row keys
    const headers = Object.keys(rawRows[0]);

    // Match column headers with smart variations
    const nameHeader = findMatchingHeader(
      headers,
      /^(item[\s_/-]?name|product[\s_/-]?name|service[\s_/-]?name|particulars|item|product|service|title)$/i
    ) || findMatchingHeader(headers, /^(name|description)$/i);

    const rateHeader = findMatchingHeader(
      headers,
      /^(rate|price|unit[\s_/-]?price|mrp|standard[\s_/-]?rate|base[\s_/-]?rate|selling[\s_/-]?price|amount|cost)$/i
    );

    const categoryHeader = findMatchingHeader(
      headers,
      /^(category|group|type|segment|department|class)$/i
    );

    const unitHeader = findMatchingHeader(
      headers,
      /^(unit|uom|unit[\s_/-]?of[\s_/-]?measure|measure|qty[\s_/-]?type)$/i
    );

    const hsnHeader = findMatchingHeader(
      headers,
      /^(hsn[/\s_-]*sac([/\s_-]*code)?|hsn([/\s_-]*code)?|sac([/\s_-]*code)?|code)$/i
    );

    const gstHeader = findMatchingHeader(
      headers,
      /^(gst[\s_/-]?rate|gst[\s_/-]?%|tax[\s_/-]?rate|tax[\s_/-]?%|gst|tax|vat)$/i
    );

    const descHeader = findMatchingHeader(
      headers,
      /^(description|details|notes|specs|specification|long[\s_/-]?desc|info)$/i
    );

    if (!nameHeader) {
      return {
        validItems: [],
        invalidItems: [],
        totalRows: rawRows.length,
        fileName,
        error: "Could not find a column for 'Item Name' or 'Product/Service Name'. Please check your headers.",
      };
    }

    const validItems: ParsedCatalogItem[] = [];
    const invalidItems: ParsedCatalogItem[] = [];

    rawRows.forEach((row, index) => {
      const rowNumber = index + 2; // +1 for 0-index, +1 for header row in Excel

      const rawName = (row[nameHeader] || "").toString().trim();
      const rawRate = rateHeader ? row[rateHeader] : "";
      const rawCategory = categoryHeader ? (row[categoryHeader] || "").toString().trim() : "";
      const rawUnit = unitHeader ? (row[unitHeader] || "").toString().trim() : "";
      const rawHsn = hsnHeader ? (row[hsnHeader] || "").toString().trim() : "";
      const rawGst = gstHeader ? row[gstHeader] : "";
      const rawDesc = descHeader && descHeader !== nameHeader ? (row[descHeader] || "").toString().trim() : "";

      // Skip completely blank rows
      if (!rawName && !rawRate && !rawCategory && !rawHsn) {
        return;
      }

      // Validation 1: Name is required
      if (!rawName) {
        invalidItems.push({
          name: "",
          category: rawCategory || "General",
          rate: 0,
          unit: rawUnit,
          hsnSac: rawHsn,
          gstRate: 18,
          description: rawDesc,
          isValid: false,
          validationError: "Item / Service name is missing",
          rowNumber,
        });
        return;
      }

      // Parsing Rate
      let rate = 0;
      if (rawRate) {
        const cleanedRate = rawRate.toString().replace(/[^0-9.-]+/g, "");
        const parsed = parseFloat(cleanedRate);
        if (!isNaN(parsed) && parsed >= 0) {
          rate = parsed;
        }
      }

      // Parsing GST Rate
      let gstRate = 18;
      if (rawGst !== undefined && rawGst !== "") {
        const cleanedGst = rawGst.toString().replace(/[^0-9.-]+/g, "");
        const parsed = parseFloat(cleanedGst);
        if (!isNaN(parsed) && parsed >= 0) {
          gstRate = parsed;
        }
      }

      validItems.push({
        name: rawName,
        category: rawCategory || "General",
        rate,
        unit: rawUnit || "Pcs",
        hsnSac: rawHsn,
        gstRate,
        description: rawDesc,
        isValid: true,
        rowNumber,
      });
    });

    return {
      validItems,
      invalidItems,
      totalRows: validItems.length + invalidItems.length,
      fileName,
    };
  } catch (err: any) {
    console.error("parseCatalogWorkbook error:", err);
    return {
      validItems: [],
      invalidItems: [],
      totalRows: 0,
      fileName,
      error: err?.message || "Failed to parse spreadsheet. Please ensure it is a valid .xlsx or .csv file.",
    };
  }
}

/**
 * Parses a binary ArrayBuffer or Uint8Array representing an Excel or CSV file
 */
export async function parseCatalogBuffer(
  buffer: ArrayBuffer | Uint8Array,
  fileName: string = "catalog.xlsx"
): Promise<CatalogImportResult> {
  try {
    const XLSX =
      typeof window === "undefined"
        ? // eslint-disable-next-line @typescript-eslint/no-require-imports
          require("xlsx")
        : await import("xlsx");
    const workbook = XLSX.read(buffer, { type: "array" });
    return parseCatalogWorkbook(workbook, fileName, XLSX);
  } catch (err: any) {
    console.error("parseCatalogBuffer error:", err);
    return {
      validItems: [],
      invalidItems: [],
      totalRows: 0,
      fileName,
      error: err?.message || "Failed to read spreadsheet file. Please ensure it is a valid .xlsx, .xls, or .csv file.",
    };
  }
}

/**
 * Parses an Excel (.xlsx, .xls) or .csv browser File object
 */
export async function parseCatalogSpreadsheet(file: File): Promise<CatalogImportResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    return await parseCatalogBuffer(arrayBuffer, file.name);
  } catch (err: any) {
    console.error("parseCatalogSpreadsheet error:", err);
    return {
      validItems: [],
      invalidItems: [],
      totalRows: 0,
      fileName: file.name,
      error: err?.message || "Failed to parse spreadsheet file.",
    };
  }
}

/**
 * Generates and downloads a clean starter sample Excel template
 */
export async function downloadSampleCatalogExcel() {
  const XLSX = await import("xlsx");
  const sampleData = [
    {
      "Item Name": "Laptop Stand Aluminum",
      "Category": "Physical Products / Goods",
      "Rate": 1499,
      "Unit": "Pcs",
      "HSN/SAC Code": "84733092",
      "GST Rate (%)": 18,
      "Description": "Adjustable ergonomic laptop stand with anti-slip silicone",
    },
    {
      "Item Name": "Consulting & Strategy Session",
      "Category": "Consulting & Advisory",
      "Rate": 3500,
      "Unit": "Hours",
      "HSN/SAC Code": "998311",
      "GST Rate (%)": 18,
      "Description": "Comprehensive 1-on-1 business & digital operations advisory",
    },
    {
      "Item Name": "Premium Cotton T-Shirt (M)",
      "Category": "Retail / Trade",
      "Rate": 799,
      "Unit": "Pcs",
      "HSN/SAC Code": "61091000",
      "GST Rate (%)": 5,
      "Description": "100% combed organic bio-wash cotton",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  // Set column widths for readability
  worksheet["!cols"] = [
    { wch: 32 }, // Item Name
    { wch: 26 }, // Category
    { wch: 12 }, // Rate
    { wch: 10 }, // Unit
    { wch: 16 }, // HSN/SAC
    { wch: 14 }, // GST Rate
    { wch: 45 }, // Description
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Items_Catalog");

  // Trigger browser download
  XLSX.writeFile(workbook, "BillEase_Catalog_Import_Template.xlsx");
}

