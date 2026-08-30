import { supabase } from "@/lib/supabase/client";
import { Quotation } from "@/types";
import { MOCK_QUOTATIONS } from "@/mock/quotations.mock";

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
        console.warn("Supabase fetch quotations error, using mock:", error.message);
        return MOCK_QUOTATIONS;
      }

      if (!data || data.length === 0) {
        await this.seedInitialQuotations();
        return MOCK_QUOTATIONS;
      }

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
        convertedToInvoiceId: q.converted_to_invoice_id,
        createdAt: q.created_at,
        updatedAt: q.updated_at,
      }));
    } catch (err) {
      console.error("QuotationService.getQuotations error:", err);
      return MOCK_QUOTATIONS;
    }
  },

  // Create a new quotation + items in Supabase
  async createQuotation(quote: Partial<Quotation>): Promise<Quotation | null> {
    try {
      const quoteId = `qt-${Date.now()}`;
      const payload = {
        id: quoteId,
        tenant_id: TENANT_ID,
        quotation_number: quote.quotationNumber,
        client_id: quote.clientId || null,
        client_name: quote.clientName,
        client_email: quote.clientEmail || null,
        clientPhone: quote.clientPhone || null,
        client_address: quote.clientAddress || null,
        client_gstin: quote.clientGstin || null,
        date: quote.date,
        valid_until: quote.validUntil,
        status: quote.status || "sent",
        currency: quote.currency || "INR",
        subtotal: quote.subtotal || 0,
        discount_type: quote.discountType || "percentage",
        discount_value: quote.discountValue || 0,
        discount_amount: quote.discountAmount || 0,
        is_tax_enabled: quote.isTaxEnabled ?? true,
        total_tax: quote.totalTax || 0,
        total_amount: quote.totalAmount || 0,
        terms_and_conditions: quote.termsAndConditions || null,
        notes: quote.notes || null,
      };

      const { data, error } = await supabase
        .from("quotations")
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error("Supabase insert quotation error:", error);
        return null;
      }

      // Insert line items
      if (quote.items && quote.items.length > 0) {
        const itemRows = quote.items.map((item, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          quotation_id: quoteId,
          description: item.description,
          detailed_notes: item.detailedNotes || null,
          quantity: item.quantity || 1,
          unit: item.unit || "pcs",
          rate: item.rate || 0,
          amount: item.amount || 0,
        }));

        await supabase.from("quotation_items").insert(itemRows);
      }

      return {
        ...quote,
        id: quoteId,
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

  // Seed helper
  async seedInitialQuotations() {
    try {
      for (const q of MOCK_QUOTATIONS) {
        await supabase.from("quotations").upsert({
          id: q.id,
          tenant_id: TENANT_ID,
          quotation_number: q.quotationNumber,
          client_id: q.clientId || null,
          client_name: q.clientName,
          client_email: q.clientEmail || null,
          client_phone: q.clientPhone || null,
          client_address: q.clientAddress || null,
          client_gstin: q.clientGstin || null,
          date: q.date,
          valid_until: q.validUntil,
          status: q.status,
          currency: q.currency,
          subtotal: q.subtotal,
          discount_type: q.discountType || "fixed",
          discount_value: q.discountValue || 0,
          discount_amount: q.discountAmount || 0,
          is_tax_enabled: q.isTaxEnabled,
          total_tax: q.totalTax,
          total_amount: q.totalAmount,
          notes: q.notes || null,
          converted_to_invoice_id: q.convertedToInvoiceId || null,
        });

        if (q.items && q.items.length > 0) {
          const itemRows = q.items.map((item) => ({
            id: item.id,
            quotation_id: q.id,
            description: item.description,
            detailed_notes: item.detailedNotes || null,
            quantity: item.quantity || 1,
            unit: item.unit || "pcs",
            rate: item.rate || 0,
            amount: item.amount,
          }));
          await supabase.from("quotation_items").upsert(itemRows);
        }
      }
    } catch (e) {
      console.warn("Could not auto-seed quotations:", e);
    }
  },
};
