import { CurrencyCode } from "@/types";

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  locale: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  INR: { code: "INR", symbol: "₹", name: "Indian Rupee", locale: "en-IN" },
  USD: { code: "USD", symbol: "$", name: "US Dollar", locale: "en-US" },
  EUR: { code: "EUR", symbol: "€", name: "Euro", locale: "de-DE" },
  GBP: { code: "GBP", symbol: "£", name: "British Pound", locale: "en-GB" },
  AED: { code: "AED", symbol: "AED", name: "UAE Dirham", locale: "ar-AE" },
  CAD: { code: "CAD", symbol: "CA$", name: "Canadian Dollar", locale: "en-CA" },
  AUD: { code: "AUD", symbol: "AU$", name: "Australian Dollar", locale: "en-AU" },
  SGD: { code: "SGD", symbol: "S$", name: "Singapore Dollar", locale: "en-SG" },
};

export const DEFAULT_CURRENCY: CurrencyCode = "INR";

export function getCurrencySymbol(currency: CurrencyCode = "INR"): string {
  return CURRENCIES[currency]?.symbol || "₹";
}
