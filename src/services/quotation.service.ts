import { supabase } from "@/lib/supabase/client";
import { Quotation, QuotationStatus } from "@/types";

const TENANT_ID = "tenant-royal-events";

export const QuotationService = {
  // Fetch all quotations with line items from Supabase
  async getQuotations(): Promise<Quotation[]> {
    try {
      const { data, error } = await supabase
        .from("quotations")
        .select(`
          *,
          quotation_items (*)
        `)
        .eq("tenant_id", TENANT_ID)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Supabase fetch quotations error:", error.message);
        return [];
      }

      if (!data) return [];

      return data.map((q) => ({
        id: q.id,
        tenantId: q.tenant_id,
        quotationNumber: q.quotation_number,
        clientId: q.client_id,
        clientName: q.client_name,
        clientEmail: q.client_email,
        clientPhone: q.client_phone,
        clientAddress: q.client_address,
        clientGstin: q.client_gstin,
        date: q.date,
        validUntil: q.valid_until,
        status: q.status,
        convertedToInvoiceId: q.converted_to_invoice_id || undefined,
        currency: q.currency || "INR",
        items: (q.quotation_items || []).map((item: any) => ({
          id: item.id,
          description: item.description,
          detailedNotes: item.detailed_notes,
          quantity: item.quantity ? parseFloat(item.quantity) : undefined,
          unit: item.unit,
          rate: item.rate ? parseFloat(item.rate) : undefined,
          amount: parseFloat(item.amount || "0"),
        })),
        subtotal: parseFloat(q.subtotal || "0"),
        discountType: q.discount_type,
        discountValue: parseFloat(q.discount_value || "0"),
        discountAmount: parseFloat(q.discount_amount || "0"),
        isTaxEnabled: q.is_tax_enabled ?? true,
        totalTax: parseFloat(q.total_tax || "0"),
        totalAmount: parseFloat(q.total_amount || "0"),
        termsAndConditions: q.terms_and_conditions,
        notes: q.notes,
        createdAt: q.created_at,
        updatedAt: q.updated_at,
      }));
    } catch (err) {
      console.error("QuotationService.getQuotations error:", err);
      return [];
    }
  },

  // Fetch single quotation by ID
  async getQuotationById(id: string): Promise<Quotation | null> {
    try {
      const { data, error } = await supabase
        .from("quotations")
        .select(`
          *,
          quotation_items (*)
        `)
        .eq("id", id)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        tenantId: data.tenant_id,
        quotationNumber: data.quotation_number,
        clientId: data.client_id,
        clientName: data.client_name,
        clientEmail: data.client_email,
        clientPhone: data.client_phone,
        clientAddress: data.client_address,
        clientGstin: data.client_gstin,
        date: data.date,
        validUntil: data.valid_until,
        status: data.status,
        convertedToInvoiceId: data.converted_to_invoice_id || undefined,
        currency: data.currency || "INR",
        items: (data.quotation_items || []).map((item: any) => ({
          id: item.id,
          description: item.description,
          detailedNotes: item.detailed_notes,
          quantity: item.quantity ? parseFloat(item.quantity) : undefined,
          unit: item.unit,
          rate: item.rate ? parseFloat(item.rate) : undefined,
          amount: parseFloat(item.amount || "0"),
        })),
        subtotal: parseFloat(data.subtotal || "0"),
        discountType: data.discount_type,
        discountValue: parseFloat(data.discount_value || "0"),
        discountAmount: parseFloat(data.discount_amount || "0"),
        isTaxEnabled: data.is_tax_enabled ?? true,
        totalTax: parseFloat(data.total_tax || "0"),
        totalAmount: parseFloat(data.total_amount || "0"),
        termsAndConditions: data.terms_and_conditions,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (err) {
      return null;
    }
  },

  // Update Quotation Status (e.g. to "converted" or "accepted")
  async updateQuotationStatus(
    id: string,
    status: QuotationStatus,
    convertedInvoiceId?: string
  ): Promise<boolean> {
    try {
      const payload: any = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (convertedInvoiceId) {
        payload.converted_to_invoice_id = convertedInvoiceId;
      }

      const { error } = await supabase
        .from("quotations")
        .update(payload)
        .eq("id", id);

      if (error) {
        console.error("Supabase update quotation status error:", error);
        return false;
      }
      return true;
    } catch (err) {
      console.error("QuotationService.updateQuotationStatus error:", err);
      return false;
    }
  },

  // Create a new quotation with line items in Supabase
  async createQuotation(quotation: Partial<Quotation>): Promise<Quotation | null> {
    try {
      const quoteId = `quote-${Date.now()}`;
      const quoteNumber = quotation.quotationNumber || `QT-${Date.now().toString().slice(-4)}`;

      // 1. Insert master quotation record
      const quotePayload = {
        id: quoteId,
        tenant_id: TENANT_ID,
        quotation_number: quoteNumber,
        client_id: quotation.clientId || null,
        client_name: quotation.clientName,
        client_email: quotation.clientEmail || null,
        client_phone: quotation.clientPhone || null,
        client_address: quotation.clientAddress || null,
        client_gstin: quotation.clientGstin || null,
        date: quotation.date || new Date().toISOString().split("T")[0],
        valid_until: quotation.validUntil || new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
        status: quotation.status || "draft",
        currency: quotation.currency || "INR",
        subtotal: quotation.subtotal || 0,
        discount_type: quotation.discountType || null,
        discount_value: quotation.discountValue || 0,
        discount_amount: quotation.discountAmount || 0,
        is_tax_enabled: quotation.isTaxEnabled ?? true,
        total_tax: quotation.totalTax || 0,
        total_amount: quotation.totalAmount || 0,
        terms_and_conditions: quotation.termsAndConditions || null,
        notes: quotation.notes || null,
      };

      const { error: quoteError } = await supabase.from("quotations").insert([quotePayload]);
      if (quoteError) {
        console.error("Supabase insert quotation error:", quoteError);
        return null;
      }

      // 2. Insert line items
      if (quotation.items && quotation.items.length > 0) {
        const itemRows = quotation.items.map((item, idx) => ({
          id: `qi-${Date.now()}-${idx}`,
          quotation_id: quoteId,
          description: item.description,
          detailed_notes: item.detailedNotes || null,
          quantity: item.quantity || null,
          unit: item.unit || null,
          rate: item.rate || null,
          amount: item.amount,
        }));

        const { error: itemsError } = await supabase.from("quotation_items").insert(itemRows);
        if (itemsError) {
          console.error("Supabase insert quotation_items error:", itemsError);
        }
      }

      return {
        ...quotation,
        id: quoteId,
        quotationNumber: quoteNumber,
        tenantId: TENANT_ID,
      } as Quotation;
    } catch (err) {
      console.error("QuotationService.createQuotation error:", err);
      return null;
    }
  },

  // Delete a quotation
  async deleteQuotation(id: string): Promise<boolean> {
    try {
      await supabase.from("quotation_items").delete().eq("quotation_id", id);
      const { error } = await supabase.from("quotations").delete().eq("id", id);
      if (error) {
        console.error("Supabase delete quotation error:", error);
        return false;
      }
      return true;
    } catch (err) {
      console.error("QuotationService.deleteQuotation error:", err);
      return false;
    }
  },
};
