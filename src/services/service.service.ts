import { supabase } from "@/lib/supabase/client";
import { ProductOrService, ServiceItem } from "@/types";
import { MOCK_SERVICES } from "@/mock/services.mock";
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
        console.warn("Supabase fetch services error, using mock:", error.message);
        return MOCK_SERVICES;
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map((s) => ({
        id: s.id,
        tenantId: s.tenant_id,
        name: s.name,
        category: s.category,
        description: s.description || "",
        rate: parseFloat(s.rate || "0"),
        unit: s.unit || "pcs",
        hsnSac: s.hsn_sac || "",
        gstRate: parseFloat(s.gst_rate || "18"),
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
      const payload = {
        id: srvId,
        tenant_id: tenantId,
        name: item.name,
        category: item.category || "custom",
        description: item.description || null,
        rate: item.rate || item.defaultRate || 0,
        unit: item.unit || item.defaultUnit || "pcs",
        hsn_sac: item.hsnSac || item.hsnSacCode || null,
        gst_rate: item.gstRate ?? item.defaultTaxRate ?? 18,
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
        rate: parseFloat(data.rate || "0"),
        unit: data.unit || "pcs",
        hsnSac: data.hsn_sac || "",
        gstRate: parseFloat(data.gst_rate || "18"),
        isActive: data.is_active ?? true,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (err) {
      console.error("CatalogService.createService error:", err);
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
