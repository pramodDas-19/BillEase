"use client";

import { useState, useMemo } from "react";
import { QuotationLineItem, CurrencyCode } from "@/types";
import { calculateDocumentTotals } from "@/lib/calculation";

export interface QuotationBuilderState {
  quotationNumber: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  clientGstin: string;
  date: string;
  validUntil: string;
  currency: CurrencyCode;
  items: QuotationLineItem[];
  discountType?: "percentage" | "fixed";
  discountValue: number;
  isTaxEnabled: boolean;
  gstType?: "intra_state" | "inter_state";
  defaultTaxRate: number;

  termsAndConditions: string;
  notes: string;
}

export function useQuotationBuilder(initialState?: Partial<QuotationBuilderState>) {
  const today = new Date().toISOString().split("T")[0];
  const defaultValidDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [state, setState] = useState<QuotationBuilderState>({
    quotationNumber: initialState?.quotationNumber || "",
    clientId: initialState?.clientId || "",
    clientName: initialState?.clientName || "",
    clientEmail: initialState?.clientEmail || "",
    clientPhone: initialState?.clientPhone || "",
    clientAddress: initialState?.clientAddress || "",
    clientGstin: initialState?.clientGstin || "",
    date: initialState?.date || today,
    validUntil: initialState?.validUntil || defaultValidDate,
    currency: initialState?.currency || "INR",
    items: initialState?.items || [
      {
        id: `item-${Date.now()}`,
        description: "",
        detailedNotes: "",
        amount: 0,
      },
    ],
    discountType: initialState?.discountType,
    discountValue: initialState?.discountValue || 0,
    isTaxEnabled: initialState?.isTaxEnabled ?? false,
    gstType: initialState?.gstType || "intra_state",
    defaultTaxRate: initialState?.defaultTaxRate ?? 18,
    termsAndConditions: initialState?.termsAndConditions || "",
    notes: initialState?.notes || "",
  });

  const totals = useMemo(() => {
    return calculateDocumentTotals({
      items: state.items,
      discountType: state.discountType,
      discountValue: state.discountValue,
      isTaxEnabled: state.isTaxEnabled,
      defaultTaxRate: state.defaultTaxRate,
      gstType: state.gstType,
    });
  }, [state.items, state.discountType, state.discountValue, state.isTaxEnabled, state.defaultTaxRate, state.gstType]);


  const addItem = () => {
    setState((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: `item-${Date.now()}`,
          description: "",
          amount: 0,
        },
      ],
    }));
  };

  const removeItem = (id: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.length > 1 ? prev.items.filter((item) => item.id !== id) : prev.items,
    }));
  };

  const updateItem = (id: string, updates: Partial<QuotationLineItem>) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...updates };

        // If both quantity and rate are provided, auto-calculate line amount
        if (updates.quantity !== undefined || updates.rate !== undefined) {
          if (updated.quantity !== undefined && updated.rate !== undefined) {
            updated.amount = Math.round(Number(updated.quantity) * Number(updated.rate) * 100) / 100;
          }
        }
        return updated;
      }),
    }));
  };

  return {
    state,
    setState,
    totals,
    addItem,
    removeItem,
    updateItem,
  };
}
