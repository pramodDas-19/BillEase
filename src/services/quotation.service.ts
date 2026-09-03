import { supabase } from "@/lib/supabase/client";
import { Quotation, QuotationStatus, TaxBreakdown } from "@/types";
import { AuthService } from "./auth.service";

export const QuotationService = {
  // Fetch all quotations for active tenant from Supabase
  async getQuotations(): Promise<Quotation[]> {
    try {
      const tenantId = await AuthService.getActiveTenantId();
      const { data, error } = await supabase
        .from("quotations")
        .select(`
          *,
          quotation_items (*)
        `)
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Supabase fetch quotations error:", error.message);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map((q: any) => {
        const isInterState = (q.notes || "").includes("[IGST]");
        const cleanNotes = (q.notes || "").replace(/\[IGST\]\s*/g, "").trim() || undefined;
        const isTaxEnabled = q.is_tax_enabled ?? true;
        const totalTax = parseFloat(q.total_tax || "0");
        const subtotal = parseFloat(q.subtotal || "0");
        const discountAmount = parseFloat(q.discount_amount || "0");
        const net = Math.max(1, subtotal - discountAmount);

        let taxBreakdown: TaxBreakdown[] | undefined = undefined;
        if (isTaxEnabled && totalTax > 0) {
          const rate = Math.round((totalTax / net) * 100);
          if (isInterState) {
            taxBreakdown = [{ name: `IGST (${rate}%)`, rate, amount: totalTax }];
          } else {
            const halfRate = Math.round((rate / 2) * 100) / 100;
            const cgst = Math.round((totalTax / 2) * 100) / 100;
            taxBreakdown = [
              { name: `CGST (${halfRate}%)`, rate: halfRate, amount: cgst },
              { name: `SGST (${halfRate}%)`, rate: halfRate, amount: Math.round((totalTax - cgst) * 100) / 100 },
            ];
          }
        }

        const items = (q.quotation_items || []).map((item: any) => {
          const rawNotes = item.detailed_notes || "";
          const hsnMatch = rawNotes.match(/\[(?:SAC|HSN):\s*([^\]]+)\]/i);
          const hsnSacCode = item.hsn_sac_code || (hsnMatch ? hsnMatch[1] : undefined);
          const detailedNotes = hsnMatch ? rawNotes.replace(/\[(?:SAC|HSN):\s*[^\]]+\]\s*/i, "").trim() : (item.detailed_notes || undefined);

          return {
            id: item.id,
            description: item.description,
            detailedNotes,
            hsnSacCode,
            quantity: item.quantity !== null && item.quantity !== undefined ? parseFloat(item.quantity) : undefined,
            unit: item.unit,
            rate: item.rate !== null && item.rate !== undefined ? parseFloat(item.rate) : undefined,
            amount: parseFloat(item.amount || "0"),
          };
        });

        return {
          id: q.id,
          publicToken: q.public_token,
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
          items,
          subtotal,
          discountType: q.discount_type,
          discountValue: parseFloat(q.discount_value || "0"),
          discountAmount,
          isTaxEnabled,
          gstType: isInterState ? ("inter_state" as const) : ("intra_state" as const),
          taxBreakdown,
          totalTax,
          totalAmount: parseFloat(q.total_amount || "0"),
          termsAndConditions: q.terms_and_conditions,
          notes: cleanNotes,
          createdAt: q.created_at,
          updatedAt: q.updated_at,
        };
      });

    } catch (err) {
      console.error("QuotationService.getQuotations error:", err);
      return [];
    }
  },

  // Get a single quotation by ID
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

      const isInterState = (data.notes || "").includes("[IGST]");
      const cleanNotes = (data.notes || "").replace(/\[IGST\]\s*/g, "").trim() || undefined;
      const isTaxEnabled = data.is_tax_enabled ?? true;
      const totalTax = parseFloat(data.total_tax || "0");
      const subtotal = parseFloat(data.subtotal || "0");
      const discountAmount = parseFloat(data.discount_amount || "0");
      const net = Math.max(1, subtotal - discountAmount);

      let taxBreakdown: TaxBreakdown[] | undefined = undefined;
      if (isTaxEnabled && totalTax > 0) {
        const rate = Math.round((totalTax / net) * 100);
        if (isInterState) {
          taxBreakdown = [{ name: `IGST (${rate}%)`, rate, amount: totalTax }];
        } else {
          const halfRate = Math.round((rate / 2) * 100) / 100;
          const cgst = Math.round((totalTax / 2) * 100) / 100;
          taxBreakdown = [
            { name: `CGST (${halfRate}%)`, rate: halfRate, amount: cgst },
            { name: `SGST (${halfRate}%)`, rate: halfRate, amount: Math.round((totalTax - cgst) * 100) / 100 },
          ];
        }
      }

      const items = (data.quotation_items || []).map((item: any) => {
        const rawNotes = item.detailed_notes || "";
        const hsnMatch = rawNotes.match(/\[(?:SAC|HSN):\s*([^\]]+)\]/i);
        const hsnSacCode = item.hsn_sac_code || (hsnMatch ? hsnMatch[1] : undefined);
        const detailedNotes = hsnMatch ? rawNotes.replace(/\[(?:SAC|HSN):\s*[^\]]+\]\s*/i, "").trim() : (item.detailed_notes || undefined);

        return {
          id: item.id,
          description: item.description,
          detailedNotes,
          hsnSacCode,
          quantity: item.quantity !== null && item.quantity !== undefined ? parseFloat(item.quantity) : undefined,
          unit: item.unit,
          rate: item.rate !== null && item.rate !== undefined ? parseFloat(item.rate) : undefined,
          amount: parseFloat(item.amount || "0"),
        };
      });

      return {
        id: data.id,
        publicToken: data.public_token,
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
        items,
        subtotal,
        discountType: data.discount_type,
        discountValue: parseFloat(data.discount_value || "0"),
        discountAmount,
        isTaxEnabled,
        gstType: isInterState ? ("inter_state" as const) : ("intra_state" as const),
        taxBreakdown,
        totalTax,
        totalAmount: parseFloat(data.total_amount || "0"),
        termsAndConditions: data.terms_and_conditions,
        notes: cleanNotes,
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
      const tenantId = await AuthService.getActiveTenantId();
      const quoteId = quotation.id || `quote-${Date.now()}`;
      const quoteNumber = quotation.quotationNumber || `QT-${Date.now().toString().slice(-4)}`;

      // Encode inter-state metadata into notes cleanly if IGST selected
      let finalNotes = quotation.notes || null;
      if (quotation.gstType === "inter_state") {
        finalNotes = finalNotes ? `[IGST] ${finalNotes}` : "[IGST]";
      }

      // 1. Insert master quotation record
      const quotePayload = {
        id: quoteId,
        tenant_id: tenantId,
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
        notes: finalNotes,
      };

      const { error: quoteError } = await supabase.from("quotations").insert([quotePayload]);
      if (quoteError) {
        console.error("Supabase insert quotation error:", quoteError);
        return null;
      }

      // 2. Insert line items with HSN/SAC preserved
      if (quotation.items && quotation.items.length > 0) {
        const itemRows = quotation.items.map((item, idx) => {
          let detailedNotes = item.detailedNotes || null;
          if (item.hsnSacCode) {
            detailedNotes = `[SAC: ${item.hsnSacCode}] ${detailedNotes || ""}`.trim();
          }

          return {
            id: item.id || `qi-${Date.now()}-${idx}`,
            quotation_id: quoteId,
            description: item.description,
            detailed_notes: detailedNotes,
            quantity: item.quantity || null,
            unit: item.unit || null,
            rate: item.rate || null,
            amount: item.amount,
          };
        });

        const { error: itemsError } = await supabase.from("quotation_items").insert(itemRows);
        if (itemsError) {
          console.error("Supabase insert quotation_items error:", itemsError);
        }
      }


      // 3. Dispatch Notification
      try {
        const { NotificationService } = await import("./notification.service");
        NotificationService.notifyAction({
          type: "action_created",
          title: `Quotation Created (${quotation.currency || "₹"}${quotation.totalAmount || 0})`,
          message: `Quotation #${quoteNumber} for ${quotation.clientName} generated.`,
          actionUrl: `/quotations/${quoteId}`,
          clientName: quotation.clientName,
          amount: quotation.totalAmount,
        });
      } catch {}

      return {
        ...quotation,
        id: quoteId,
        quotationNumber: quoteNumber,
        tenantId: tenantId,
      } as Quotation;
    } catch (err) {
      console.error("QuotationService.createQuotation error:", err);
      return null;
    }

  },

  // Update an existing quotation with updated line items
  async updateQuotation(id: string, quotation: Partial<Quotation>): Promise<Quotation | null> {
    try {
      const quotePayload: any = {
        updated_at: new Date().toISOString(),
      };

      if (quotation.quotationNumber) quotePayload.quotation_number = quotation.quotationNumber;
      if (quotation.clientId !== undefined) quotePayload.client_id = quotation.clientId || null;
      if (quotation.clientName !== undefined) quotePayload.client_name = quotation.clientName;
      if (quotation.clientEmail !== undefined) quotePayload.client_email = quotation.clientEmail || null;
      if (quotation.clientPhone !== undefined) quotePayload.client_phone = quotation.clientPhone || null;
      if (quotation.clientAddress !== undefined) quotePayload.client_address = quotation.clientAddress || null;
      if (quotation.clientGstin !== undefined) quotePayload.client_gstin = quotation.clientGstin || null;
      if (quotation.date) quotePayload.date = quotation.date;
      if (quotation.validUntil) quotePayload.valid_until = quotation.validUntil;
      if (quotation.status) quotePayload.status = quotation.status;
      if (quotation.currency) quotePayload.currency = quotation.currency;
      if (quotation.subtotal !== undefined) quotePayload.subtotal = quotation.subtotal;
      if (quotation.discountType !== undefined) quotePayload.discount_type = quotation.discountType || null;
      if (quotation.discountValue !== undefined) quotePayload.discount_value = quotation.discountValue;
      if (quotation.discountAmount !== undefined) quotePayload.discount_amount = quotation.discountAmount;
      if (quotation.isTaxEnabled !== undefined) quotePayload.is_tax_enabled = quotation.isTaxEnabled;
      if (quotation.totalTax !== undefined) quotePayload.total_tax = quotation.totalTax;
      if (quotation.totalAmount !== undefined) quotePayload.total_amount = quotation.totalAmount;
      if (quotation.termsAndConditions !== undefined) quotePayload.terms_and_conditions = quotation.termsAndConditions || null;
      if (quotation.notes !== undefined) quotePayload.notes = quotation.notes || null;

      const { error: quoteError } = await supabase
        .from("quotations")
        .update(quotePayload)
        .eq("id", id);

      if (quoteError) {
        console.error("Supabase update quotation error:", quoteError);
        return null;
      }

      // Update line items: Delete old and insert updated
      if (quotation.items && quotation.items.length > 0) {
        await supabase.from("quotation_items").delete().eq("quotation_id", id);

        const itemRows = quotation.items.map((item, idx) => ({
          id: item.id && !item.id.startsWith("item-") ? item.id : `qi-${Date.now()}-${idx}`,
          quotation_id: id,
          description: item.description,
          detailed_notes: item.detailedNotes || null,
          quantity: item.quantity || null,
          unit: item.unit || null,
          rate: item.rate || null,
          amount: item.amount,
        }));

        const { error: itemsError } = await supabase.from("quotation_items").insert(itemRows);
        if (itemsError) {
          console.error("Supabase insert updated quotation_items error:", itemsError);
        }
      }

      return {
        ...quotation,
        id,
      } as Quotation;
    } catch (err) {
      console.error("QuotationService.updateQuotation error:", err);
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
