import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCookie = request.cookies.get("billease_admin_session")?.value;
    if (adminCookie !== "true") {
      return NextResponse.json({ error: "Unauthorized. Admin session required." }, { status: 401 });
    }

    const { id: tenantId } = await params;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://butxutqhbhscbihunnwr.supabase.co";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!serviceRoleKey) {
      return NextResponse.json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY environment variable." }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 1. Fetch Tenant
    const { data: tenant, error: tErr } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", tenantId)
      .single();

    if (tErr || !tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // 2. Fetch Clients
    const { data: clients } = await supabase
      .from("clients")
      .select("*")
      .eq("tenant_id", tenantId);

    // 3. Fetch Services
    const { data: services } = await supabase
      .from("services")
      .select("*")
      .eq("tenant_id", tenantId);

    // 4. Fetch Quotations
    const { data: quotations } = await supabase
      .from("quotations")
      .select("*, quotation_items(*)")
      .eq("tenant_id", tenantId);

    // 5. Fetch Invoices
    const { data: invoices } = await supabase
      .from("invoices")
      .select("*, invoice_items(*)")
      .eq("tenant_id", tenantId);

    // 6. Fetch Payments
    const { data: payments } = await supabase
      .from("payments")
      .select("*")
      .eq("tenant_id", tenantId);

    const exportArchive = {
      exportMetadata: {
        platform: "BillEase Platform Control",
        exportedAt: new Date().toISOString(),
        dpdpCompliance: "Section 9 - Data Portability Guaranteed",
        tenantId,
      },
      tenantProfile: tenant,
      clients: clients || [],
      services: services || [],
      quotations: quotations || [],
      invoices: invoices || [],
      payments: payments || [],
    };

    return NextResponse.json(exportArchive);
  } catch (err: any) {
    console.error("Export API error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
