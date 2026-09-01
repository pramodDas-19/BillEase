import { supabase } from "@/lib/supabase/client";
import { ProductOrService, ServiceItem } from "@/types";
import { AuthService } from "./auth.service";

export const CatalogService = {
  // Fetch all services for active tenant from Supabase
  async getServices(): Promise<ServiceItem[]> {
    try {
      const tenantId = await AuthService.getActiveTenantId();
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Supabase fetch services error:", error.message);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map((s) => ({
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
    } catch (err) {
      console.error("CatalogService.getServices error:", err);
      return [];
    }
  },

  // Create a new service in Supabase
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
        name: item.name,
        category: item.category || "General",
        description: item.description || null,
        rate: isNaN(parsedRate) ? 0 : parsedRate,
        unit: item.unit !== undefined ? item.unit : (item.defaultUnit || ""),
        hsn_sac: item.hsnSac || item.hsnSacCode || null,
        gst_rate: isNaN(parsedGstRate) ? 0 : parsedGstRate,
        is_active: true,
      };

      const { data, error } = await supabase
        .from("services")
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error("Supabase insert service error:", error);
        return null;
      }

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
    } catch (err) {
      console.error("CatalogService.createService error:", err);
      return null;
    }
  },

  // Update an existing service in Supabase
  async updateService(id: string, updates: Partial<ServiceItem>): Promise<ServiceItem | null> {
    try {
      const payload: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.rate !== undefined) payload.rate = Number(updates.rate);
      if (updates.unit !== undefined) payload.unit = updates.unit;
      if (updates.hsnSac !== undefined) payload.hsn_sac = updates.hsnSac;
      if (updates.gstRate !== undefined) payload.gst_rate = Number(updates.gstRate);
      if (updates.isActive !== undefined) payload.is_active = updates.isActive;

      const { data, error } = await supabase
        .from("services")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Supabase update service error:", error);
        return null;
      }

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
    } catch (err) {
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
      return true;
    } catch (err) {
      console.error("CatalogService.deleteService error:", err);
      return false;
    }
  },
};
