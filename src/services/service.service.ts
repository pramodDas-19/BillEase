import { supabase } from "@/lib/supabase/client";
import { ServiceItem } from "@/types";
import { AuthService } from "./auth.service";
import { DataCache } from "@/lib/data-cache";
import { enqueueMutation, getPendingMutations } from "@/lib/offline-queue";
import { isNetworkError } from "@/lib/network-detector";

export const CatalogService = {
  // Fetch all services for active tenant from Supabase (with DataCache & offline merge)
  async getServices(): Promise<ServiceItem[]> {
    return DataCache.fetch("services", async () => {
      try {
        const tenantId = await AuthService.getActiveTenantId();
        const { data, error } = await supabase
          .from("services")
          .select("*")
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false });

        if (error) {
          if (isNetworkError(error)) {
            console.warn("[CatalogService] Network offline during fetch. Returning empty or local data...");
          } else {
            console.warn("Supabase fetch services error:", error.message);
          }
        }

        const parsed: ServiceItem[] = (data || []).map((s) => ({
          id: s.id,
          tenantId: s.tenant_id,
          name: s.name,
          category: s.category || "General",
          description: s.description || "",
          rate: s.rate !== null && s.rate !== undefined ? parseFloat(s.rate) : 0,
          unit: s.unit || "",
          hsnSac: s.hsn_sac || "",
          gstRate: s.gst_rate !== null && s.gst_rate !== undefined ? parseFloat(s.gst_rate) : 0,
          isActive: s.is_active ?? true,
          createdAt: s.created_at,
          updatedAt: s.updated_at,
        }));

        // Merge pending offline services from IndexedDB
        if (typeof window !== "undefined") {
          try {
            const pending = await getPendingMutations();
            const pendingServices = pending.filter((p) => p.entityType === "service");
            for (const p of pendingServices) {
              const raw = p.payload?.servicePayload;
              if (raw && !parsed.some((s) => s.id === p.entityId)) {
                parsed.unshift({
                  id: p.entityId,
                  tenantId: p.tenantId,
                  name: raw.name || "Item",
                  category: raw.category || "General",
                  description: raw.description || "",
                  rate: raw.rate !== null && raw.rate !== undefined ? parseFloat(raw.rate) : 0,
                  unit: raw.unit || "",
                  hsnSac: raw.hsn_sac || "",
                  gstRate: raw.gst_rate !== null && raw.gst_rate !== undefined ? parseFloat(raw.gst_rate) : 0,
                  isActive: raw.is_active ?? true,
                  createdAt: p.createdAt,
                  updatedAt: p.updatedAt,
                  _isPendingSync: true,
                  _pendingMessage: "Saved locally — will sync when you're back online",
                });
              }
            }
          } catch {}
        }

        return parsed;
      } catch (err) {
        console.error("CatalogService.getServices error:", err);
        return [];
      }
    });
  },

  // Create a new service in Supabase with offline resilience
  async createService(item: Partial<ServiceItem>): Promise<ServiceItem | null> {
    try {
      const tenantId = await AuthService.getActiveTenantId();
      const srvId = item.id || `srv-${Date.now()}`;
      
      const parsedRate = item.rate !== undefined 
        ? Number(item.rate) 
        : (item.defaultRate !== undefined ? Number(item.defaultRate) : 0);

      const parsedGstRate = item.gstRate !== undefined 
        ? Number(item.gstRate) 
        : (item.defaultTaxRate !== undefined ? Number(item.defaultTaxRate) : 0);

      const payload = {
        id: srvId,
        tenant_id: tenantId,
        name: (item.name || "").trim(),
        category: (item.category || "General").trim(),
        description: item.description?.trim() || null,
        rate: isNaN(parsedRate) || parsedRate < 0 ? 0 : parsedRate,
        unit: (item.unit !== undefined ? item.unit : (item.defaultUnit || "")).trim(),
        hsn_sac: (item.hsnSac || item.hsnSacCode || "").trim() || null,
        gst_rate: isNaN(parsedGstRate) || parsedGstRate < 0 ? 0 : parsedGstRate,
        is_active: true,
      };

      const { data, error } = await supabase
        .from("services")
        .insert(payload)
        .select()
        .single();

      if (error) {
        if (isNetworkError(error)) {
          console.warn("[CatalogService] Network offline during service insert. Enqueuing to IndexedDB...");
          await enqueueMutation({
            entityType: "service",
            entityId: srvId,
            action: "create",
            tenantId,
            payload: { servicePayload: payload },
            displayTitle: `Item: ${item.name || srvId}`,
          });

          DataCache.invalidate("services");

          return {
            id: srvId,
            tenantId,
            name: payload.name || "Item",
            category: payload.category,
            description: payload.description || "",
            rate: payload.rate,
            unit: payload.unit,
            hsnSac: payload.hsn_sac || "",
            gstRate: payload.gst_rate,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            _isPendingSync: true,
            _pendingMessage: "Saved locally — will sync when you're back online",
          };
        }
        console.error("Supabase insert service error:", error);
        return null;
      }

      DataCache.invalidate("services");

      return {
        id: data.id,
        tenantId: data.tenant_id,
        name: data.name,
        category: data.category,
        description: data.description || "",
        rate: data.rate !== null && data.rate !== undefined ? parseFloat(data.rate) : 0,
        unit: data.unit || "",
        hsnSac: data.hsn_sac || "",
        gstRate: data.gst_rate !== null && data.gst_rate !== undefined ? parseFloat(data.gst_rate) : 0,
        isActive: data.is_active ?? true,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (err: any) {
      if (isNetworkError(err)) {
        try {
          const tenantId = await AuthService.getActiveTenantId();
          const srvId = item.id || `srv-${Date.now()}`;
          const fallbackPayload = {
            id: srvId,
            tenant_id: tenantId,
            name: (item.name || "").trim(),
            category: (item.category || "General").trim(),
            description: item.description?.trim() || null,
            rate: Number(item.rate) || 0,
            unit: (item.unit || "").trim(),
            hsn_sac: (item.hsnSac || "").trim() || null,
            gst_rate: Number(item.gstRate) || 0,
            is_active: true,
          };
          await enqueueMutation({
            entityType: "service",
            entityId: srvId,
            action: "create",
            tenantId,
            payload: { servicePayload: fallbackPayload },
            displayTitle: `Item: ${item.name || srvId}`,
          });
          DataCache.invalidate("services");
          return {
            id: srvId,
            tenantId,
            name: fallbackPayload.name || "Item",
            category: fallbackPayload.category,
            description: fallbackPayload.description || "",
            rate: fallbackPayload.rate,
            unit: fallbackPayload.unit,
            hsnSac: fallbackPayload.hsn_sac || "",
            gstRate: fallbackPayload.gst_rate,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            _isPendingSync: true,
            _pendingMessage: "Saved locally — will sync when you're back online",
          };
        } catch {}
      }
      console.error("CatalogService.createService error:", err);
      return null;
    }
  },

  // Update an existing service in Supabase with offline resilience
  async updateService(id: string, updates: Partial<ServiceItem>): Promise<ServiceItem | null> {
    try {
      const payload: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.name !== undefined) payload.name = updates.name.trim();
      if (updates.category !== undefined) payload.category = updates.category.trim();
      if (updates.description !== undefined) payload.description = updates.description?.trim() || null;
      if (updates.rate !== undefined) payload.rate = Math.max(0, Number(updates.rate) || 0);
      if (updates.unit !== undefined) payload.unit = updates.unit.trim();
      if (updates.hsnSac !== undefined) payload.hsn_sac = updates.hsnSac.trim() || null;
      if (updates.gstRate !== undefined) payload.gst_rate = Math.max(0, Number(updates.gstRate) || 0);
      if (updates.isActive !== undefined) payload.is_active = updates.isActive;

      const { data, error } = await supabase
        .from("services")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        if (isNetworkError(error)) {
          console.warn("[CatalogService] Network offline during service update. Enqueuing mutation...");
          const tenantId = updates.tenantId || (await AuthService.getActiveTenantId());
          await enqueueMutation({
            entityType: "service",
            entityId: id,
            action: "update",
            tenantId,
            payload: { id, servicePayload: payload },
            displayTitle: `Item: ${updates.name || id}`,
          });
          DataCache.invalidate("services");
          return {
            id,
            tenantId,
            name: updates.name || "Item",
            category: updates.category || "General",
            description: updates.description || "",
            rate: updates.rate !== undefined ? Number(updates.rate) : 0,
            unit: updates.unit || "",
            hsnSac: updates.hsnSac || "",
            gstRate: updates.gstRate !== undefined ? Number(updates.gstRate) : 0,
            isActive: updates.isActive ?? true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            _isPendingSync: true,
            _pendingMessage: "Saved locally — will sync when you're back online",
          };
        }
        console.error("Supabase update service error:", error);
        return null;
      }

      DataCache.invalidate("services");

      return {
        id: data.id,
        tenantId: data.tenant_id,
        name: data.name,
        category: data.category,
        description: data.description || "",
        rate: data.rate !== null && data.rate !== undefined ? parseFloat(data.rate) : 0,
        unit: data.unit || "",
        hsnSac: data.hsn_sac || "",
        gstRate: data.gst_rate !== null && data.gst_rate !== undefined ? parseFloat(data.gst_rate) : 0,
        isActive: data.is_active ?? true,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (err: any) {
      if (isNetworkError(err)) {
        try {
          const tenantId = updates.tenantId || (await AuthService.getActiveTenantId());
          await enqueueMutation({
            entityType: "service",
            entityId: id,
            action: "update",
            tenantId,
            payload: { id, servicePayload: updates },
            displayTitle: `Item: ${updates.name || id}`,
          });
          DataCache.invalidate("services");
          return {
            id,
            tenantId,
            name: updates.name || "Item",
            category: updates.category || "General",
            description: updates.description || "",
            rate: updates.rate !== undefined ? Number(updates.rate) : 0,
            unit: updates.unit || "",
            hsnSac: updates.hsnSac || "",
            gstRate: updates.gstRate !== undefined ? Number(updates.gstRate) : 0,
            isActive: updates.isActive ?? true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            _isPendingSync: true,
            _pendingMessage: "Saved locally — will sync when you're back online",
          };
        } catch {}
      }
      console.error("CatalogService.updateService error:", err);
      return null;
    }
  },

  // Delete a service from Supabase
  async deleteService(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) {
        console.error("Supabase delete service error:", error);
        return false;
      }
      DataCache.invalidate("services");
      return true;
    } catch (err) {
      console.error("CatalogService.deleteService error:", err);
      return false;
    }
  },

  // Batch insert multiple services into Supabase (up to 100 items per chunk)
  async createBatchServices(
    items: Partial<ServiceItem>[]
  ): Promise<{ successCount: number; failedCount: number; error?: string }> {
    try {
      if (!items || items.length === 0) {
        return { successCount: 0, failedCount: 0 };
      }

      const tenantId = await AuthService.getActiveTenantId();
      if (!tenantId) {
        return { successCount: 0, failedCount: items.length, error: "Authentication required" };
      }

      const rowsToInsert = items.map((item, idx) => {
        const srvId = item.id || `srv-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`;
        const parsedRate = item.rate !== undefined ? Number(item.rate) : 0;
        const parsedGstRate = item.gstRate !== undefined ? Number(item.gstRate) : 0;

        return {
          id: srvId,
          tenant_id: tenantId,
          name: (item.name || "Item").trim(),
          category: (item.category || "General").trim(),
          description: item.description?.trim() || null,
          rate: isNaN(parsedRate) || parsedRate < 0 ? 0 : parsedRate,
          unit: item.unit?.trim() || "",
          hsn_sac: item.hsnSac?.trim() || item.hsnSacCode?.trim() || null,
          gst_rate: isNaN(parsedGstRate) || parsedGstRate < 0 ? 0 : parsedGstRate,
          is_active: item.isActive ?? true,
        };
      });

      // Insert in chunks of 100 to prevent payload limits
      const CHUNK_SIZE = 100;
      let totalInserted = 0;

      for (let i = 0; i < rowsToInsert.length; i += CHUNK_SIZE) {
        const chunk = rowsToInsert.slice(i, i + CHUNK_SIZE);
        const { error } = await supabase.from("services").insert(chunk);
        if (error) {
          console.error("Batch insert chunk error:", error);
          DataCache.invalidate("services");
          return {
            successCount: totalInserted,
            failedCount: rowsToInsert.length - totalInserted,
            error: error.message,
          };
        }
        totalInserted += chunk.length;
      }

      DataCache.invalidate("services");
      return { successCount: totalInserted, failedCount: 0 };
    } catch (err: any) {
      console.error("CatalogService.createBatchServices exception:", err);
      DataCache.invalidate("services");
      return { successCount: 0, failedCount: items.length, error: err?.message || "Unknown error" };
    }
  },
};
