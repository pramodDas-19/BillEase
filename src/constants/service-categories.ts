import { ServiceCategory } from "@/types";

export interface ServiceCategoryOption {
  value: ServiceCategory;
  label: string;
  description: string;
}

export const SERVICE_CATEGORIES: ServiceCategoryOption[] = [
  {
    value: "event",
    label: "Event Management & Services",
    description: "Stage setup, lighting, sound, decoration, coordination, venue",
  },
  {
    value: "printing",
    label: "Printing & Fabrication",
    description: "Banners, visiting cards, brochures, flyers, foam boards, standees",
  },
  {
    value: "design",
    label: "Graphic Design & Creative",
    description: "Branding, logo design, invitation design, marketing collaterals",
  },
  {
    value: "custom",
    label: "Custom Work / Other",
    description: "Miscellaneous custom client deliverables",
  },
];

export const COMMON_UNITS = [
  "pcs",
  "sq ft",
  "copies",
  "sets",
  "pages",
  "hours",
  "days",
  "event",
  "package",
  "kg",
  "meters",
];
