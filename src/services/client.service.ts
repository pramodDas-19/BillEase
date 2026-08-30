import { supabase } from "@/lib/supabase/client";
import { Client } from "@/types";
import { MOCK_CLIENTS } from "@/mock/clients.mock";

const TENANT_ID = "tenant-royal-events";

export const ClientService = {
  // Fetch all clients from Supabase
  async getClients(): Promise<Client[]> {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("tenant_id", TENANT_ID)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Supabase fetch error, using local data:", error.message);
        return MOCK_CLIENTS;
      }

      if (!data || data.length === 0) {
        await this.seedInitialClients();
        return MOCK_CLIENTS;
      }

      return data.map((c) => ({
        id: c.id,
        tenantId: c.tenant_id,
        name: c.name,
        companyName: c.company_name,
        email: c.email,
        phone: c.phone,
        gstin: c.gstin,
        address: c.address,
        segmentTags: c.segment_tags || [],
        totalBilled: parseFloat(c.total_billed || "0"),
        totalPaid: parseFloat(c.total_paid || "0"),
        balanceDue: parseFloat(c.balance_due || "0"),
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      }));
    } catch (err) {
      console.error("ClientService.getClients error:", err);
      return MOCK_CLIENTS;
    }
  },

  // Create a new client in Supabase
  async createClient(client: Partial<Client>): Promise<Client | null> {
    try {
      const clientId = `client-${Date.now()}`;
      const payload = {
        id: clientId,
        tenant_id: TENANT_ID,
        name: client.name,
        company_name: client.companyName || null,
        email: client.email || null,
        phone: client.phone,
        gstin: client.gstin || null,
        address: client.address || null,
        segment_tags: client.segmentTags || [],
        total_billed: client.totalBilled || 0,
        total_paid: client.totalPaid || 0,
        balance_due: client.balanceDue || 0,
      };

      const { data, error } = await supabase
        .from("clients")
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error("Supabase insert client error:", error);
        return null;
      }

      return {
        id: data.id,
        tenantId: data.tenant_id,
        name: data.name,
        companyName: data.company_name,
        email: data.email,
        phone: data.phone,
        gstin: data.gstin,
        address: data.address,
        segmentTags: data.segment_tags || [],
        totalBilled: parseFloat(data.total_billed || "0"),
        totalPaid: parseFloat(data.total_paid || "0"),
        balanceDue: parseFloat(data.balance_due || "0"),
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (err) {
      console.error("ClientService.createClient error:", err);
      return null;
    }
  },

  // Delete a client from Supabase
  async deleteClient(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) {
        console.error("Supabase delete client error:", error);
        return false;
      }
      return true;
    } catch (err) {
      console.error("ClientService.deleteClient error:", err);
      return false;
    }
  },

  // Seed helper
  async seedInitialClients() {
    try {
      const rows = MOCK_CLIENTS.map((c) => ({
        id: c.id,
        tenant_id: TENANT_ID,
        name: c.name,
        company_name: c.companyName || null,
        email: c.email || null,
        phone: c.phone,
        gstin: c.gstin || null,
        address: c.address || null,
        segment_tags: c.segmentTags || [],
        total_billed: c.totalBilled || 0,
        total_paid: c.totalPaid || 0,
        balance_due: c.balanceDue || 0,
      }));

      await supabase.from("clients").upsert(rows);
    } catch (e) {
      console.warn("Could not auto-seed clients:", e);
    }
  },
};
