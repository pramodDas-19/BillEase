import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { parseCatalogWorkbook } from "@/lib/excel-catalog-importer";

describe("Catalog Spreadsheet Importer", () => {
  it("successfully parses standard headers and rows from an Excel workbook", () => {
    const rawData = [
      {
        "Item Name": "Logitech Wireless Mouse",
        "Category": "Hardware",
        "Rate": 850,
        "Unit": "Pcs",
        "HSN/SAC Code": "84716060",
        "GST Rate (%)": 18,
        "Description": "2.4GHz optical mouse",
      },
      {
        "Item Name": "Website UI/UX Audit",
        "Category": "Consulting",
        "Rate": 15000,
        "Unit": "Hours",
        "HSN/SAC Code": "998314",
        "GST Rate (%)": 18,
        "Description": "Comprehensive usability analysis",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(rawData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    const result = parseCatalogWorkbook(wb, "products.xlsx");

    expect(result.error).toBeUndefined();
    expect(result.totalRows).toBe(2);
    expect(result.validItems).toHaveLength(2);
    expect(result.invalidItems).toHaveLength(0);

    const first = result.validItems[0];
    expect(first.name).toBe("Logitech Wireless Mouse");
    expect(first.category).toBe("Hardware");
    expect(first.rate).toBe(850);
    expect(first.unit).toBe("Pcs");
    expect(first.hsnSac).toBe("84716060");
    expect(first.gstRate).toBe(18);
    expect(first.description).toBe("2.4GHz optical mouse");
    expect(first.isValid).toBe(true);
  });

  it("handles alternative Indian service header synonyms (Particulars, SAC, UOM, Selling Price)", () => {
    const rawData = [
      {
        "Particulars": "Legal Consultation",
        "Group": "Professional Services",
        "Selling Price": "₹ 5,000",
        "UOM": "Session",
        "SAC": "998211",
        "GST %": "18%",
        "Details": "Retainer contract review",
      },
      {
        "Particulars": "Trademark Filing",
        "Group": "Legal",
        "Selling Price": "₹ 8,500",
        "UOM": "Application",
        "SAC": "998212",
        "GST %": "18%",
        "Details": "IP India filing fee and drafting",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(rawData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Services");

    const result = parseCatalogWorkbook(wb, "indian_services.xlsx");

    expect(result.validItems).toHaveLength(2);

    const item1 = result.validItems[0];
    expect(item1.name).toBe("Legal Consultation");
    expect(item1.category).toBe("Professional Services");
    expect(item1.rate).toBe(5000);
    expect(item1.unit).toBe("Session");
    expect(item1.hsnSac).toBe("998211");
    expect(item1.gstRate).toBe(18);

    const item2 = result.validItems[1];
    expect(item2.name).toBe("Trademark Filing");
    expect(item2.category).toBe("Legal");
    expect(item2.rate).toBe(8500);
    expect(item2.unit).toBe("Application");
    expect(item2.hsnSac).toBe("998212");
  });

  it("handles retail & physical goods synonyms (Product Name, MRP, Measure, HSN, Tax Rate)", () => {
    const rawData = [
      {
        "Product Name": "Cotton Formal Shirt",
        "Type": "Apparel",
        "MRP": "1,299.50",
        "Measure": "Pcs",
        "HSN": "6205",
        "Tax Rate": "5%",
        "Notes": "100% Linen fabric",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(rawData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");

    const result = parseCatalogWorkbook(wb, "retail_goods.xlsx");

    expect(result.validItems).toHaveLength(1);
    const item = result.validItems[0];
    expect(item.name).toBe("Cotton Formal Shirt");
    expect(item.category).toBe("Apparel");
    expect(item.rate).toBe(1299.5);
    expect(item.unit).toBe("Pcs");
    expect(item.hsnSac).toBe("6205");
    expect(item.gstRate).toBe(5);
  });

  it("validates missing item names and flags them without failing the whole batch", () => {
    const rawData = [
      {
        "Item Name": "Valid Product",
        "Rate": 500,
      },
      {
        "Item Name": "",
        "Rate": 300,
        "Category": "Hardware",
      },
      {
        "Item Name": "Another Valid Product",
        "Rate": 1200,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(rawData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    const result = parseCatalogWorkbook(wb, "mixed.xlsx");

    expect(result.validItems).toHaveLength(2);
    expect(result.invalidItems).toHaveLength(1);
    expect(result.invalidItems[0].validationError).toContain("name is missing");
    expect(result.invalidItems[0].rowNumber).toBe(3); // Row 3 in Excel
  });

  it("ignores completely blank rows cleanly", () => {
    const rawData = [
      { "Item Name": "Product 1", "Rate": 100 },
      { "Item Name": "", "Rate": "", "Category": "", "HSN/SAC": "" },
      { "Item Name": "Product 2", "Rate": 200 },
    ];

    const ws = XLSX.utils.json_to_sheet(rawData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    const result = parseCatalogWorkbook(wb, "with_blank_rows.xlsx");

    expect(result.validItems).toHaveLength(2);
    expect(result.invalidItems).toHaveLength(0);
    expect(result.totalRows).toBe(2);
  });

  it("assigns sensible defaults when optional fields are empty", () => {
    const rawData = [
      {
        "Item Name": "Bare Minimum Service",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(rawData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    const result = parseCatalogWorkbook(wb, "minimal.xlsx");

    expect(result.validItems).toHaveLength(1);
    const item = result.validItems[0];
    expect(item.name).toBe("Bare Minimum Service");
    expect(item.category).toBe("General");
    expect(item.unit).toBe("Pcs");
    expect(item.rate).toBe(0);
    expect(item.gstRate).toBe(18);
    expect(item.hsnSac).toBe("");
  });

  it("returns error if no recognized item name column exists", () => {
    const rawData = [
      {
        "Random Column A": "Something",
        "Random Column B": 123,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(rawData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    const result = parseCatalogWorkbook(wb, "unrecognized.xlsx");

    expect(result.error).toBeDefined();
    expect(result.error).toContain("Could not find a column for 'Item Name'");
    expect(result.validItems).toHaveLength(0);
  });
});
