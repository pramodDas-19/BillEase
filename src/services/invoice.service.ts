import { supabase } from "@/lib/supabase/client";
import { Invoice, InvoiceStatus } from "@/types";
import { QuotationService } from "./quotation.service";
import { AuthService } from "./auth.service";

export const InvoiceService = {
  // Fetch all invoices with line items for active tenant from Supabase
  async getInvoices(): Promise<Invoice[]> {
    try {
      const tenantId = await AuthService.getActiveTenantId();
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          invoice_items (*)
        `)
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Supabase fetch invoices error:", error.message);
        return [];
      }

      if (!data) return [];

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
      return [];
    }
  },

  // Fetch single invoice by ID
  async getInvoiceById(id: string): Promise<Invoice | null> {
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          invoice_items (*)
        `)
        .eq("id", id)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        tenantId: data.tenant_id,
        invoiceNumber: data.invoice_number,
        quotationId: data.quotation_id,
        quotationNumber: data.quotation_number,
        clientId: data.client_id,
        clientName: data.client_name,
        clientEmail: data.client_email,
        clientPhone: data.client_phone,
        clientAddress: data.client_address,
        clientGstin: data.client_gstin,
        issueDate: data.issue_date,
        dueDate: data.due_date,
        status: data.status,
        currency: data.currency || "INR",
        items: (data.invoice_items || []).map((item: any) => ({
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
        paidAmount: parseFloat(data.paid_amount || "0"),
        balanceDue: parseFloat(data.balance_due || "0"),
        termsAndConditions: data.terms_and_conditions,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (err) {
      return null;
    }
  },

  // Update Invoice Status
  async updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("invoices")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        console.error("Supabase update invoice status error:", error);
        return false;
      }
      return true;
    } catch (err) {
      console.error("InvoiceService.updateInvoiceStatus error:", err);
      return false;
    }
  },

  // Create a new invoice with line items in Supabase
  async createInvoice(invoice: Partial<Invoice>): Promise<Invoice | null> {
    try {
      const tenantId = await AuthService.getActiveTenantId();
      const invoiceId = invoice.id || `inv-${Date.now()}`;
      const invoiceNumber = invoice.invoiceNumber || `INV-${Date.now().toString().slice(-4)}`;

      // 1. Insert master invoice record
      const invoicePayload = {
        id: invoiceId,
        tenant_id: tenantId,
        invoice_number: invoiceNumber,
        quotation_id: invoice.quotationId || null,
        quotation_number: invoice.quotationNumber || null,
        client_id: invoice.clientId || null,
        client_name: invoice.clientName,
        client_email: invoice.clientEmail || null,
        client_phone: invoice.clientPhone || null,
        client_address: invoice.clientAddress || null,
        client_gstin: invoice.clientGstin || null,
        issue_date: invoice.issueDate || new Date().toISOString().split("T")[0],
        due_date: invoice.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
        status: invoice.status || "due",
        currency: invoice.currency || "INR",
        subtotal: invoice.subtotal || 0,
        discount_type: invoice.discountType || null,
        discount_value: invoice.discountValue || 0,
        discount_amount: invoice.discountAmount || 0,
        is_tax_enabled: invoice.isTaxEnabled ?? true,
        total_tax: invoice.totalTax || 0,
        total_amount: invoice.totalAmount || 0,
        paid_amount: invoice.paidAmount || 0,
        balance_due: invoice.balanceDue !== undefined ? invoice.balanceDue : invoice.totalAmount || 0,
        terms_and_conditions: invoice.termsAndConditions || null,
        notes: invoice.notes || null,
      };

      const { error: invError } = await supabase.from("invoices").insert([invoicePayload]);
      if (invError) {
        console.error("Supabase insert invoice error:", invError);
        return null;
      }

      // 2. Insert line items
      if (invoice.items && invoice.items.length > 0) {
        const itemRows = invoice.items.map((item, idx) => ({
          id: item.id || `ii-${Date.now()}-${idx}`,
          invoice_id: invoiceId,
          description: item.description,
          detailed_notes: item.detailedNotes || null,
          quantity: item.quantity || null,
          unit: item.unit || null,
          rate: item.rate || null,
          amount: item.amount,
        }));

        const { error: itemsError } = await supabase.from("invoice_items").insert(itemRows);
        if (itemsError) {
          console.error("Supabase insert invoice_items error:", itemsError);
        }
      }

      // 3. If converted from a quotation, update quotation status to 'converted'
      if (invoice.quotationId) {
        try {
          await QuotationService.updateQuotationStatus(invoice.quotationId, "converted", invoiceId);
        } catch (quoteErr) {
          console.warn("Failed to mark source quotation as converted:", quoteErr);
        }
      }

      // 4. Dispatch Notification
      try {
        const { NotificationService } = await import("./notification.service");
        NotificationService.notifyAction({
          type: "action_created",
          title: `Invoice Created (${invoice.currency || "₹"}${invoice.totalAmount || 0})`,
          message: `Invoice #${invoiceNumber} for ${invoice.clientName} generated.`,
          actionUrl: `/invoices/${invoiceId}`,
          clientName: invoice.clientName,
          amount: invoice.totalAmount,
        });
      } catch {}

      return {
        ...invoice,
        id: invoiceId,
        invoiceNumber,
        tenantId: tenantId,
      } as Invoice;

    } catch (err) {
      console.error("InvoiceService.createInvoice error:", err);
      return null;
    }

  },

  // Update an existing invoice in Supabase
  async updateInvoice(id: string, invoice: Partial<Invoice>): Promise<Invoice | null> {
    try {
      const invPayload: any = {
        updated_at: new Date().toISOString(),
      };

      if (invoice.invoiceNumber) invPayload.invoice_number = invoice.invoiceNumber;
      if (invoice.quotationId !== undefined) invPayload.quotation_id = invoice.quotationId || null;
      if (invoice.quotationNumber !== undefined) invPayload.quotation_number = invoice.quotationNumber || null;
      if (invoice.clientId !== undefined) invPayload.client_id = invoice.clientId || null;
      if (invoice.clientName !== undefined) invPayload.client_name = invoice.clientName;
      if (invoice.clientEmail !== undefined) invPayload.client_email = invoice.clientEmail || null;
      if (invoice.clientPhone !== undefined) invPayload.client_phone = invoice.clientPhone || null;
      if (invoice.clientAddress !== undefined) invPayload.client_address = invoice.clientAddress || null;
      if (invoice.clientGstin !== undefined) invPayload.client_gstin = invoice.clientGstin || null;
      if (invoice.issueDate) invPayload.issue_date = invoice.issueDate;
      if (invoice.dueDate) invPayload.due_date = invoice.dueDate;
      if (invoice.status) invPayload.status = invoice.status;
      if (invoice.currency) invPayload.currency = invoice.currency;
      if (invoice.subtotal !== undefined) invPayload.subtotal = invoice.subtotal;
      if (invoice.discountType !== undefined) invPayload.discount_type = invoice.discountType || null;
      if (invoice.discountValue !== undefined) invPayload.discount_value = invoice.discountValue;
      if (invoice.discountAmount !== undefined) invPayload.discount_amount = invoice.discountAmount;
      if (invoice.isTaxEnabled !== undefined) invPayload.is_tax_enabled = invoice.isTaxEnabled;
      if (invoice.totalTax !== undefined) invPayload.total_tax = invoice.totalTax;
      if (invoice.totalAmount !== undefined) invPayload.total_amount = invoice.totalAmount;
      if (invoice.paidAmount !== undefined) invPayload.paid_amount = invoice.paidAmount;
      if (invoice.balanceDue !== undefined) invPayload.balance_due = invoice.balanceDue;
      if (invoice.termsAndConditions !== undefined) invPayload.terms_and_conditions = invoice.termsAndConditions || null;
      if (invoice.notes !== undefined) invPayload.notes = invoice.notes || null;

      const { error: invError } = await supabase
        .from("invoices")
        .update(invPayload)
        .eq("id", id);

      if (invError) {
        console.error("Supabase update invoice error:", invError);
        return null;
      }

      // Update line items: Delete old and insert updated
      if (invoice.items && invoice.items.length > 0) {
        await supabase.from("invoice_items").delete().eq("invoice_id", id);

        const itemRows = invoice.items.map((item, idx) => ({
          id: item.id && !item.id.startsWith("item-") ? item.id : `ii-${Date.now()}-${idx}`,
          invoice_id: id,
          description: item.description,
          detailed_notes: item.detailedNotes || null,
          quantity: item.quantity || null,
          unit: item.unit || null,
          rate: item.rate || null,
          amount: item.amount,
        }));

        const { error: itemsError } = await supabase.from("invoice_items").insert(itemRows);
        if (itemsError) {
          console.error("Supabase insert updated invoice_items error:", itemsError);
        }
      }

      return {
        ...invoice,
        id,
      } as Invoice;
    } catch (err) {
      console.error("InvoiceService.updateInvoice error:", err);
      return null;
    }
  },

  // Delete an invoice
  async deleteInvoice(id: string): Promise<boolean> {
    try {
      await supabase.from("invoice_items").delete().eq("invoice_id", id);
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
};

