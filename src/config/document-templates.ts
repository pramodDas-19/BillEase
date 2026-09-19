export type DocumentSizeCategory = "a4" | "a5" | "thermal";
export type DocumentOrientation = "portrait" | "landscape";

export interface DocumentTemplateMeta {
  id: string;
  name: string;
  category: DocumentSizeCategory;
  orientation: DocumentOrientation;
  badge: string;
  description: string;
  paperWidthMm: number;
  paperHeightMm?: number;
  tags: string[];
  isPopular?: boolean;
}

export const DOCUMENT_TEMPLATES: DocumentTemplateMeta[] = [
  // ==========================
  // 5 A4 TEMPLATES
  // ==========================
  {
    id: "a4_advanced_gst",
    name: "Advanced GST",
    category: "a4",
    orientation: "portrait",
    badge: "GST Rule 46",
    description: "Standard boxed Indian B2B tax invoice with complete vertical column dividers, full HSN/SAC matrix & dual tax splits.",
    paperWidthMm: 210,
    paperHeightMm: 297,
    tags: ["B2B", "GST Compliant", "Multi-column", "Vyapar Style"],
    isPopular: true,
  },
  {
    id: "a4_tally",
    name: "Tally ERP Classic",
    category: "a4",
    orientation: "portrait",
    badge: "Accounting Wireframe",
    description: "Authentic Tally ERP 9 / Tally Prime wireframe hairline layout with dispatch details, vehicle number & CA-preferred matrix.",
    paperWidthMm: 210,
    paperHeightMm: 297,
    tags: ["Tally Style", "Wireframe", "CA Approved", "Transport Info"],
  },
  {
    id: "a4_luxury",
    name: "Luxury Royal Gold",
    category: "a4",
    orientation: "portrait",
    badge: "Royal Edition",
    description: "Prestigious gold corner ornaments, serif headers & elegant summary blocks. Ideal for jewelry, interior & premium brands.",
    paperWidthMm: 210,
    paperHeightMm: 297,
    tags: ["Luxury", "Gold Accents", "Boutique", "Jewelry"],
    isPopular: true,
  },
  {
    id: "a4_modern",
    name: "Modern Minimalist",
    category: "a4",
    orientation: "portrait",
    badge: "Creative / IT",
    description: "Clean frameless layout with pastel pill badges for Party details, rounded subtotal banner and generous airy whitespace.",
    paperWidthMm: 210,
    paperHeightMm: 297,
    tags: ["Agencies", "Modern", "Soft Cards", "Consultants"],
  },
  {
    id: "a4_billbook",
    name: "Classic Billbook",
    category: "a4",
    orientation: "portrait",
    badge: "Bill of Supply",
    description: "Streamlined Indian trading format for composition dealers and retail traders omitting complex multi-rate tax matrices.",
    paperWidthMm: 210,
    paperHeightMm: 297,
    tags: ["Composition", "Non-GST", "Bill of Supply", "Retail"],
  },

  // ==========================
  // 5 A5 TEMPLATES
  // ==========================
  {
    id: "a5_landscape_gst",
    name: "A5 Landscape GST",
    category: "a5",
    orientation: "landscape",
    badge: "Half-Page Landscape",
    description: "Indian bill-book standard (210×148mm). Cuts paper use by 50% while displaying full GST breakdown and QR code.",
    paperWidthMm: 210,
    paperHeightMm: 148,
    tags: ["Bill Book", "Landscape", "Paper Saver", "Wholesale"],
    isPopular: true,
  },
  {
    id: "a5_landscape_billbook",
    name: "A5 Landscape Billbook",
    category: "a5",
    orientation: "landscape",
    badge: "Challan Pad",
    description: "Half-sheet landscape bill of supply and delivery slip format for mandi traders, local distributors and quick billing.",
    paperWidthMm: 210,
    paperHeightMm: 148,
    tags: ["Pad Style", "Challan", "Delivery Slip", "Mandi"],
  },
  {
    id: "a5_portrait_challan",
    name: "A5 Portrait Challan",
    category: "a5",
    orientation: "portrait",
    badge: "Vertical Half-Sheet",
    description: "148×210mm vertical slip with compact header, line items, and signature box. Great for repair shops and job work.",
    paperWidthMm: 148,
    paperHeightMm: 210,
    tags: ["Job Work", "Vertical A5", "Workshop", "Service Slip"],
  },
  {
    id: "a5_portrait_modern",
    name: "A5 Modern Studio",
    category: "a5",
    orientation: "portrait",
    badge: "Freelancer Slip",
    description: "Contemporary vertical half-sheet with sleek typography and compact UPI QR code for creative studios and freelancers.",
    paperWidthMm: 148,
    paperHeightMm: 210,
    tags: ["Freelancer", "Digital Agency", "Compact", "Creative"],
  },
  {
    id: "a5_traditional_bahi",
    name: "A5 Traditional Bahi-Khata",
    category: "a5",
    orientation: "landscape",
    badge: "Traditional Bahi",
    description: "Traditional Indian mercantile ledger aesthetic with saffron accents, auspicious crest and bilingual Hindi/English headers.",
    paperWidthMm: 210,
    paperHeightMm: 148,
    tags: ["Traditional", "Bilingual", "Bahi-Khata", "Vyapar"],
  },

  // ==========================
  // 5 THERMAL / SMALL BILL TEMPLATES
  // ==========================
  {
    id: "thermal_80mm_standard",
    name: "80mm Standard POS",
    category: "thermal",
    orientation: "portrait",
    badge: "3-Inch Thermal",
    description: "Standard 80mm thermal receipt with dashed dividers, monospaced typography, delivery charges & return policy footer.",
    paperWidthMm: 80,
    tags: ["POS", "80mm", "Thermal Roll", "Receipt"],
    isPopular: true,
  },
  {
    id: "thermal_80mm_gst_qr",
    name: "80mm GST Counter Slip",
    category: "thermal",
    orientation: "portrait",
    badge: "80mm + UPI QR",
    description: "Thermal receipt with scannable dynamic UPI QR code printed at the footer for instant countertop payment + tax summary.",
    paperWidthMm: 80,
    tags: ["Countertop", "Scan & Pay", "UPI QR", "GST Receipt"],
    isPopular: true,
  },
  {
    id: "thermal_58mm_compact",
    name: "58mm Mini Pocket Slip",
    category: "thermal",
    orientation: "portrait",
    badge: "2-Inch Mini",
    description: "Ultra-compact 32-column format for portable handheld Bluetooth printers used by delivery riders and tea/kirana stalls.",
    paperWidthMm: 58,
    tags: ["58mm", "Bluetooth Printer", "Pocket Slip", "Delivery"],
  },
  {
    id: "thermal_boutique_cafe",
    name: "Boutique & Cafe Slip",
    category: "thermal",
    orientation: "portrait",
    badge: "Cafe & Boutique",
    description: "Centered modern typography with promo discount highlights, WiFi details, custom thank-you note and Instagram handle.",
    paperWidthMm: 80,
    tags: ["Cafe", "Boutique", "Social Handle", "Modern Slip"],
  },
  {
    id: "thermal_grocery_retail",
    name: "Supermarket Grocery Slip",
    category: "thermal",
    orientation: "portrait",
    badge: "Supermarket POS",
    description: "High-density retail slip with item count, 'You Saved ₹XX' savings badge, payment mode breakdown, and barcode mockup.",
    paperWidthMm: 80,
    tags: ["Grocery", "Savings Badge", "Cashier", "Supermarket"],
  },
];

export const DEFAULT_TEMPLATE_BY_SIZE: Record<DocumentSizeCategory, string> = {
  a4: "a4_advanced_gst",
  a5: "a5_landscape_gst",
  thermal: "thermal_80mm_standard",
};

export function getTemplateById(id?: string): DocumentTemplateMeta {
  if (!id) return DOCUMENT_TEMPLATES[0];
  const found = DOCUMENT_TEMPLATES.find((t) => t.id === id);
  return found || DOCUMENT_TEMPLATES[0];
}

export function getTemplatesByCategory(category: DocumentSizeCategory): DocumentTemplateMeta[] {
  return DOCUMENT_TEMPLATES.filter((t) => t.category === category);
}
