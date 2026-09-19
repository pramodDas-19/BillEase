import { supabase } from "@/lib/supabase/client";
import { Client } from "@/types";
import { AuthService } from "./auth.service";
import { isNetworkError } from "@/lib/network-detector";
import { enqueueMutation, getPendingMutations } from "@/lib/offline-queue";

export const ClientService = {
  // Fetch all clients for active tenant from Supabase
  async getClients(): Promise<Client[]> {
    try {
      const tenantId = await AuthService.getActiveTenantId();
      let data: any[] | null = null;

      const isImpersonating =
        typeof window !== "undefined" &&
        (sessionStorage.getItem("billease_is_impersonating") === "true" ||
          localStorage.getItem("billease_is_impersonating") === "true");

      if (isImpersonating) {
        try {
          const res = await fetch(`/api/admin/impersonate?tenantId=${tenantId}&type=clients`);
          if (res.ok) {
            const json = await res.json();
            data = json.clients || [];
          }
        } catch (e) {
          console.warn("Could not fetch impersonated clients via admin API:", e);
        }
      }

      if (data === null) {
        const { data: queryData, error } = await supabase
          .from("clients")
          .select("*")
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false });

        if (error) {
          console.warn("Supabase fetch clients error:", error.message);
          data = [];
        } else {
          data = queryData;
        }
      }

      const parsed: Client[] = (data || []).map((c) => ({
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

      // Merge pending offline clients from IndexedDB
      if (typeof window !== "undefined") {
        try {
          const pending = await getPendingMutations();
          const pendingClients = pending.filter((p) => p.entityType === "client");
          for (const p of pendingClients) {
            const raw = p.payload?.clientPayload;
            if (raw && !parsed.some((c) => c.id === p.entityId)) {
              parsed.unshift({
                id: p.entityId,
                tenantId: p.tenantId,
                name: raw.name || "Client",
                companyName: raw.company_name,
                email: raw.email,
                phone: raw.phone || "",
                gstin: raw.gstin,
                address: raw.address,
                segmentTags: raw.segment_tags || [],
                totalBilled: 0,
                totalPaid: 0,
                balanceDue: 0,
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
                _isPendingSync: true,
                _pendingStatus: p.status,
                _pendingMessage: "Saved locally — will sync when you're back online",
              });
            }
          }
        } catch {}
      }

      return parsed;
    } catch (err) {
      console.error("ClientService.getClients error:", err);
      return [];
    }
  },

  // Get a single client by ID
  async getClientById(id: string): Promise<Client | null> {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) return null;

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
      return null;
    }
  },

  // Create a new client in Supabase
  async createClient(client: Partial<Client>): Promise<Client | null> {
    try {
      const tenantId = await AuthService.getActiveTenantId();
      const clientId = client.id || `client-${Date.now()}`;
      const payload = {
        id: clientId,
        tenant_id: tenantId,
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
        if (isNetworkError(error)) {
          console.warn("[ClientService] Network offline during client insert. Enqueuing to IndexedDB...");
          await enqueueMutation({
            entityType: "client",
            entityId: clientId,
            action: "create",
            tenantId,
            payload: { clientPayload: payload },
            displayTitle: `Client: ${client.name}`,
          });
          return {
            id: clientId,
            tenantId,
            name: client.name || "Client",
            companyName: client.companyName,
            email: client.email,
            phone: client.phone || "",
            gstin: client.gstin,
            address: client.address,
            segmentTags: client.segmentTags || [],
            totalBilled: 0,
            totalPaid: 0,
            balanceDue: 0,
            createdAt: new Date().toISOString(),
            _isPendingSync: true,
            _pendingMessage: "Saved locally — will sync when you're back online",
          };
        }
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
    } catch (err: any) {
      if (isNetworkError(err)) {
        console.warn("[ClientService] Network exception during client creation. Enqueuing to IndexedDB...");
        try {
          const tenantId = await AuthService.getActiveTenantId();
          const clientId = client.id || `client-${Date.now()}`;
          const payload = {
            id: clientId,
            tenant_id: tenantId,
            name: client.name || "Client",
            company_name: client.companyName || null,
            email: client.email || null,
            phone: client.phone || "",
            gstin: client.gstin || null,
            address: client.address || null,
            segment_tags: client.segmentTags || [],
          };
          await enqueueMutation({
            entityType: "client",
            entityId: clientId,
            action: "create",
            tenantId,
            payload: { clientPayload: payload },
            displayTitle: `Client: ${client.name}`,
          });
          return {
            id: clientId,
            tenantId,
            name: client.name || "Client",
            companyName: client.companyName,
            email: client.email,
            phone: client.phone || "",
            gstin: client.gstin,
            address: client.address,
            segmentTags: client.segmentTags || [],
            totalBilled: 0,
            totalPaid: 0,
            balanceDue: 0,
            createdAt: new Date().toISOString(),
            _isPendingSync: true,
            _pendingMessage: "Saved locally — will sync when you're back online",
          };
        } catch {}
      }
      console.error("ClientService.createClient error:", err);
      return null;
    }
  },

  // Update an existing client in Supabase
  async updateClient(id: string, updates: Partial<Client>): Promise<Client | null> {
    try {
      const payload: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.companyName !== undefined) payload.company_name = updates.companyName || null;
      if (updates.email !== undefined) payload.email = updates.email || null;
      if (updates.phone !== undefined) payload.phone = updates.phone;
      if (updates.gstin !== undefined) payload.gstin = updates.gstin || null;
      if (updates.address !== undefined) payload.address = updates.address || null;
      if (updates.segmentTags !== undefined) payload.segment_tags = updates.segmentTags;
      if (updates.totalBilled !== undefined) payload.total_billed = updates.totalBilled;
      if (updates.totalPaid !== undefined) payload.total_paid = updates.totalPaid;
      if (updates.balanceDue !== undefined) payload.balance_due = updates.balanceDue;

      const { data, error } = await supabase
        .from("clients")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        if (isNetworkError(error)) {
          console.warn("[ClientService] Network offline during client update. Enqueuing mutation...");
          const tenantId = updates.tenantId || (await AuthService.getActiveTenantId());
          await enqueueMutation({
            entityType: "client",
            entityId: id,
            action: "update",
            tenantId,
            payload: { id, clientPayload: payload },
            displayTitle: `Client: ${updates.name || id}`,
          });
          return {
            id,
            tenantId,
            name: updates.name || "Client",
            ...updates,
            _isPendingSync: true,
            _pendingMessage: "Saved locally — will sync when you're back online",
          } as Client;
        }
        console.error("Supabase update client error:", error);
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
    } catch (err: any) {
      if (isNetworkError(err)) {
        console.warn("[ClientService] Network exception during client update. Enqueuing mutation...");
        try {
          const tenantId = updates.tenantId || (await AuthService.getActiveTenantId());
          await enqueueMutation({
            entityType: "client",
            entityId: id,
            action: "update",
            tenantId,
            payload: { id, clientPayload: updates },
            displayTitle: `Client: ${updates.name || id}`,
          });
          return {
            id,
            tenantId,
            name: updates.name || "Client",
            ...updates,
            _isPendingSync: true,
            _pendingMessage: "Saved locally — will sync when you're back online",
          } as Client;
        } catch {}
      }
      console.error("ClientService.updateClient error:", err);
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
};
