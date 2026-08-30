import { supabase } from "@/lib/supabase/client";
import { Invoice } from "@/types";
import { MOCK_INVOICES } from "@/mock/invoices.mock";

const TENANT_ID = "tenant-royal-events";

export const InvoiceService = {
  // Fetch all invoices with line items from Supabase
  async getInvoices(): Promise<Invoice[]> {
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          invoice_items (*)
        `)
        .eq("tenant_id", TENANT_ID)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Supabase fetch invoices error, using mock:", error.message);
        return MOCK_INVOICES;
      }

      if (!data || data.length === 0) {
        await this.seedInitialInvoices();
        return MOCK_INVOICES;
      }

      return data.map((inv) => ({
        id: inv.id,
        tenantId: inv.tenant_id,
        invoiceNumber: inv.invoice_number,
        quotationId: inv.quotation_id,
        quotationNumber: inv.quotation_number,
        clientId: inv.client_id,
        clientName: inv.client_name,
        clientEmail: inv.client_email,
        clientPhone: inv.client_phone,
        clientAddress: inv.client_address,
        clientGstin: inv.client_gstin,
        issueDate: inv.issue_date,
        dueDate: inv.due_date,
        status: inv.status,
        currency: inv.currency || "INR",
        items: (inv.invoice_items || []).map((item: any) => ({
          id: item.id,
          description: item.description,
          detailedNotes: item.detailed_notes,
          quantity: item.quantity ? parseFloat(item.quantity) : undefined,
          unit: item.unit,
          rate: item.rate ? parseFloat(item.rate) : undefined,
          amount: parseFloat(item.amount || "0"),
        })),
        subtotal: parseFloat(inv.subtotal || "0"),
        discountType: inv.discount_type,
        discountValue: parseFloat(inv.discount_value || "0"),
        discountAmount: parseFloat(inv.discount_amount || "0"),
        isTaxEnabled: inv.is_tax_enabled ?? true,
        totalTax: parseFloat(inv.total_tax || "0"),
        totalAmount: parseFloat(inv.total_amount || "0"),
        paidAmount: parseFloat(inv.paid_amount || "0"),
        balanceDue: parseFloat(inv.balance_due || "0"),
        termsAndConditions: inv.terms_and_conditions,
        notes: inv.notes,
        createdAt: inv.created_at,
        updatedAt: inv.updated_at,
      }));
    } catch (err) {
      console.error("InvoiceService.getInvoices error:", err);
      return MOCK_INVOICES;
    }
  },

  // Create a new invoice + items in Supabase
  async createInvoice(inv: Partial<Invoice>): Promise<Invoice | null> {
    try {
      const invId = `inv-${Date.now()}`;
      const payload = {
        id: invId,
        tenant_id: TENANT_ID,
        invoice_number: inv.invoiceNumber,
        quotation_id: inv.quotationId || null,
        quotation_number: inv.quotationNumber || null,
        client_id: inv.clientId || null,
        client_name: inv.clientName,
        client_email: inv.clientEmail || null,
        client_phone: inv.clientPhone || null,
        client_address: inv.clientAddress || null,
        client_gstin: inv.clientGstin || null,
        issue_date: inv.issueDate,
        due_date: inv.dueDate,
        status: inv.status || "due",
        currency: inv.currency || "INR",
        subtotal: inv.subtotal || 0,
        discount_type: inv.discountType || "percentage",
        discount_value: inv.discountValue || 0,
        discount_amount: inv.discountAmount || 0,
        is_tax_enabled: inv.isTaxEnabled ?? true,
        total_tax: inv.totalTax || 0,
        total_amount: inv.totalAmount || 0,
        paid_amount: inv.paidAmount || 0,
        balance_due: inv.balanceDue ?? inv.totalAmount ?? 0,
        terms_and_conditions: inv.termsAndConditions || null,
        notes: inv.notes || null,
      };

      const { data, error } = await supabase
        .from("invoices")
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error("Supabase insert invoice error:", error);
        return null;
      }

      // Insert line items
      if (inv.items && inv.items.length > 0) {
        const itemRows = inv.items.map((item, idx) => ({
          id: `inv-item-${Date.now()}-${idx}`,
          invoice_id: invId,
          description: item.description,
          detailed_notes: item.detailedNotes || null,
          quantity: item.quantity || 1,
          unit: item.unit || "pcs",
          rate: item.rate || 0,
          amount: item.amount || 0,
        }));

        await supabase.from("invoice_items").insert(itemRows);
      }

      return {
        ...inv,
        id: invId,
        tenantId: TENANT_ID,
      } as Invoice;
    } catch (err) {
      console.error("InvoiceService.createInvoice error:", err);
      return null;
    }
  },

  // Delete an invoice
  async deleteInvoice(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) {
        console.error("Supabase delete invoice error:", error);
        return false;
      }
      return true;
    } catch (err) {
      console.error("InvoiceService.deleteInvoice error:", err);
      return false;
    }
  },

  // Seed helper
  async seedInitialInvoices() {
    try {
      for (const inv of MOCK_INVOICES) {
        await supabase.from("invoices").upsert({
          id: inv.id,
          tenant_id: TENANT_ID,
          invoice_number: inv.invoiceNumber,
          quotation_id: inv.quotationId || null,
          quotation_number: inv.quotationNumber || null,
          client_id: inv.clientId || null,
          client_name: inv.clientName,
          client_email: inv.clientEmail || null,
          client_phone: inv.clientPhone || null,
          client_address: inv.clientAddress || null,
          client_gstin: inv.clientGstin || null,
          issue_date: inv.issueDate,
          due_date: inv.dueDate,
          status: inv.status,
          currency: inv.currency,
          subtotal: inv.subtotal,
          discount_type: inv.discountType || "fixed",
          discount_value: inv.discountValue || 0,
          discount_amount: inv.discountAmount || 0,
          is_tax_enabled: inv.isTaxEnabled,
          total_tax: inv.totalTax,
          total_amount: inv.totalAmount,
          paid_amount: inv.paidAmount,
          balance_due: inv.balanceDue,
          notes: inv.notes || null,
        });

        if (inv.items && inv.items.length > 0) {
          const itemRows = inv.items.map((item) => ({
            id: item.id,
            invoice_id: inv.id,
            description: item.description,
            detailed_notes: item.detailedNotes || null,
            quantity: item.quantity || 1,
            unit: item.unit || "pcs",
            rate: item.rate || 0,
            amount: item.amount,
          }));
          await supabase.from("invoice_items").upsert(itemRows);
        }
      }
    } catch (e) {
      console.warn("Could not auto-seed invoices:", e);
    }
  },
};
