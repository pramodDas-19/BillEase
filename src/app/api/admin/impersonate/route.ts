import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminSession(request);
    if (!auth.valid) {
      return NextResponse.json({ error: "Unauthorized. Admin session required." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const type = searchParams.get("type") || "all";

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://butxutqhbhscbihunnwr.supabase.co";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!serviceRoleKey) {
      return NextResponse.json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY environment variable." }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    if (type === "invoices") {
      const { data: invoices, error: invErr } = await supabase
        .from("invoices")
        .select(`*, invoice_items (*)`)
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (invErr) {
        return NextResponse.json({ error: invErr.message }, { status: 500 });
      }
      return NextResponse.json({ invoices: invoices || [] });
    }

    if (type === "quotations") {
      const { data: quotations, error: qErr } = await supabase
        .from("quotations")
        .select(`*, quotation_items (*)`)
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (qErr) {
        return NextResponse.json({ error: qErr.message }, { status: 500 });
      }
      return NextResponse.json({ quotations: quotations || [] });
    }

    if (type === "clients") {
      const { data: clients, error: cErr } = await supabase
        .from("clients")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (cErr) {
        return NextResponse.json({ error: cErr.message }, { status: 500 });
      }
      return NextResponse.json({ clients: clients || [] });
    }

    if (type === "payments") {
      const { data: payments, error: pErr } = await supabase
        .from("payments")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (pErr) {
        return NextResponse.json({ error: pErr.message }, { status: 500 });
      }
      return NextResponse.json({ payments: payments || [] });
    }

    // Default: fetch tenant profile + all relations
    const { data: tenant, error: tErr } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", tenantId)
      .single();

    if (tErr || !tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const settings = (tenant.settings || {}) as Record<string, any>;
    if (!settings.subscription) {
      const createdMs = new Date(tenant.created_at).getTime();
      const trialEndMs = createdMs + 7 * 24 * 60 * 60 * 1000;
      const graceEndMs = trialEndMs + 48 * 60 * 60 * 1000;
      const isPastTrial = Date.now() > trialEndMs;

      settings.subscription = {
        plan: "trial",
        status: isPastTrial ? "trial_expired" : "trial_active",
        trialStartDate: tenant.created_at,
        trialEndDate: new Date(trialEndMs).toISOString(),
        gracePeriodEndsAt: new Date(graceEndMs).toISOString(),
      };
      tenant.settings = settings;
    }

    const { data: invoices } = await supabase
      .from("invoices")
      .select(`*, invoice_items (*)`)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    const { data: quotations } = await supabase
      .from("quotations")
      .select(`*, quotation_items (*)`)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    const { data: clients } = await supabase
      .from("clients")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    const { data: payments } = await supabase
      .from("payments")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    return NextResponse.json({
      success: true,
      tenant,
      invoices: invoices || [],
      quotations: quotations || [],
      clients: clients || [],
      payments: payments || [],
    });
  } catch (err: any) {
    console.error("Admin impersonate API error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
