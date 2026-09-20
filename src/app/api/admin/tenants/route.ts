
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminSession(request);
    if (!auth.valid) {
      return NextResponse.json({ error: "Unauthorized. Admin session required." }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://butxutqhbhscbihunnwr.supabase.co";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!serviceRoleKey) {
      return NextResponse.json({
        error: "Missing SUPABASE_SERVICE_ROLE_KEY in environment variables. Please add SUPABASE_SERVICE_ROLE_KEY to your Vercel Project Settings → Environment Variables.",
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 1. Fetch all real tenants (excluding internal platform configuration record)
    const { data: rawTenants, error: tenantErr } = await supabase
      .from("tenants")
      .select("*")
      .neq("id", "system-platform-config")
      .order("created_at", { ascending: false });

    if (tenantErr) {
      console.error("Failed to query real tenants from Supabase:", tenantErr);
      return NextResponse.json({ error: "Failed to fetch tenants from database." }, { status: 500 });
    }

    // 2. Fetch all invoices for aggregation
    const { data: invoices, error: invErr } = await supabase
      .from("invoices")
      .select("id, tenant_id, total_amount, status, created_at");

    // 3. Fetch clients count
    const { data: clients, error: clientErr } = await supabase
      .from("clients")
      .select("id, tenant_id");

    // 4. Fetch quotations count
    const { data: quotations, error: quoteErr } = await supabase
      .from("quotations")
      .select("id, tenant_id");

    // Build aggregations per tenant
    const invoicesByTenant: Record<string, { count: number; totalBilled: number; lastActive: string }> = {};
    (invoices || []).forEach((inv) => {
      const tid = inv.tenant_id;
      if (!invoicesByTenant[tid]) {
        invoicesByTenant[tid] = { count: 0, totalBilled: 0, lastActive: inv.created_at };
      }
      invoicesByTenant[tid].count += 1;
      invoicesByTenant[tid].totalBilled += Number(inv.total_amount || 0);
      if (new Date(inv.created_at) > new Date(invoicesByTenant[tid].lastActive)) {
        invoicesByTenant[tid].lastActive = inv.created_at;
      }
    });

    const clientsCountByTenant: Record<string, number> = {};
    (clients || []).forEach((c) => {
      clientsCountByTenant[c.tenant_id] = (clientsCountByTenant[c.tenant_id] || 0) + 1;
    });

    const quotationsCountByTenant: Record<string, number> = {};
    (quotations || []).forEach((q) => {
      quotationsCountByTenant[q.tenant_id] = (quotationsCountByTenant[q.tenant_id] || 0) + 1;
    });

    // 5. Transform tenants to full schema with real database stats
    const formattedTenants = (rawTenants || []).map((t) => {
      const invStats = invoicesByTenant[t.id] || { count: 0, totalBilled: 0, lastActive: t.created_at };
      const clientCount = clientsCountByTenant[t.id] || 0;
      const quoteCount = quotationsCountByTenant[t.id] || 0;

      // Extract stored subscription from settings or calculate based on created_at
      const settings = (t.settings || {}) as Record<string, any>;
      let sub = settings.subscription;

      if (!sub) {
        const createdMs = new Date(t.created_at).getTime();
        const trialEndMs = createdMs + 7 * 24 * 60 * 60 * 1000;
        const isPastTrial = Date.now() > trialEndMs;

        sub = {
          plan: "trial",
          status: isPastTrial ? "trial_expired" : "trial_active",
          trialStartDate: t.created_at,
          trialEndDate: new Date(trialEndMs).toISOString(),
          gracePeriodEndsAt: new Date(trialEndMs + 48 * 60 * 60 * 1000).toISOString(),
        };
      }

      // Determine engagement score based on real activity
      let engagementScore: "ENGAGED" | "CASUAL" | "DORMANT" = "DORMANT";
      if (invStats.count >= 2 || quoteCount >= 2) {
        engagementScore = "ENGAGED";
      } else if (invStats.count >= 1 || quoteCount >= 1 || clientCount >= 1) {
        engagementScore = "CASUAL";
      }

      return {
        id: t.id,
        businessName: t.business_name,
        slug: t.id.replace(/^tenant-/, ""),
        businessType: "other",
        ownerName: t.owner_name,
        email: t.email,
        phone: t.phone,
        gstin: t.gstin,
        website: t.website,
        address: t.address || { street: "", city: "", state: "", postalCode: "", country: "India" },
        bankDetails: t.bank_details || { bankName: "", accountNumber: "", ifscCode: "", upiId: "" },
        settings: settings,
        subscription: sub,
        stats: {
          invoiceCount: invStats.count,
          totalBilled: invStats.totalBilled,
          clientCount,
          quotationCount: quoteCount,
          lastActive: invStats.lastActive,
          engagementScore,
        },
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      };
    });

    return NextResponse.json({
      success: true,
      tenants: formattedTenants,
      totalRealTenants: formattedTenants.length,
      totalRealInvoices: (invoices || []).length,
      totalRealBilledRevenue: (invoices || []).reduce((acc, inv) => acc + Number(inv.total_amount || 0), 0),
    });
  } catch (err: any) {
    console.error("Admin tenants API error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAdminSession(request);
    if (!auth.valid) {
      return NextResponse.json({ error: "Unauthorized. Admin session required." }, { status: 401 });
    }

    const { tenantId, action, additionalDays, plan } = await request.json();
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

    // Fetch existing tenant record
    const { data: tenant, error: fetchErr } = await supabase
      .from("tenants")
      .select("settings")
      .eq("id", tenantId)
      .single();

    if (fetchErr || !tenant) {
      return NextResponse.json({ error: "Tenant not found in database." }, { status: 404 });
    }

    const existingSettings = (tenant.settings || {}) as Record<string, any>;
    let currentSub = existingSettings.subscription || {
      plan: "trial",
      status: "trial_active",
      trialStartDate: new Date().toISOString(),
      trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    if (action === "extend_trial") {
      const days = Number(additionalDays) || 7;
      const currentEnd = currentSub.trialEndDate ? new Date(currentSub.trialEndDate).getTime() : Date.now();
      const newEnd = new Date(Math.max(Date.now(), currentEnd) + days * 24 * 60 * 60 * 1000).toISOString();

      currentSub = {
        ...currentSub,
        plan: "trial",
        status: "trial_active",
        trialEndDate: newEnd,
      };
    } else if (action === "set_pro") {
      currentSub = {
        plan: plan || "pro_monthly",
        status: "active",
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }

    const updatedSettings = {
      ...existingSettings,
      subscription: currentSub,
    };

    const { error: updateErr } = await supabase
      .from("tenants")
      .update({
        settings: updatedSettings,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tenantId);

    if (updateErr) {
      return NextResponse.json({ error: "Failed to update tenant in Supabase." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      tenantId,
      subscription: currentSub,
      message: `Tenant ${tenantId} subscription updated successfully in Supabase.`,
    });
  } catch (err: any) {
    console.error("Admin update subscription error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAdminSession(request);
    if (!auth.valid) {
      return NextResponse.json({ error: "Unauthorized. Admin session required." }, { status: 401 });
    }

    const { tenantId } = await request.json();
    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required." }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://butxutqhbhscbihunnwr.supabase.co";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!serviceRoleKey) {
      return NextResponse.json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY environment variable." }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 1. Get tenant details first (for email matching if needed)
    const { data: tenant } = await supabase
      .from("tenants")
      .select("email, owner_name")
      .eq("id", tenantId)
      .single();

    // 2. Delete tenant from Supabase DB (cascades to clients, invoices, quotes, services, payments)
    const { error: delErr } = await supabase
      .from("tenants")
      .delete()
      .eq("id", tenantId);

    if (delErr) {
      console.error("Failed to delete tenant from Supabase:", delErr);
      return NextResponse.json({ error: "Failed to delete tenant from database: " + delErr.message }, { status: 500 });
    }

    // 3. Look up and delete any corresponding auth user
    try {
      const { data: usersData } = await supabase.auth.admin.listUsers();
      if (usersData?.users) {
        for (const user of usersData.users) {
          const appMetaTenant = user.app_metadata?.tenant_id;
          const userMetaTenant = user.user_metadata?.tenant_id;
          const userEmail = user.email?.toLowerCase();
          const tenantEmail = tenant?.email?.toLowerCase();

          if (
            appMetaTenant === tenantId ||
            userMetaTenant === tenantId ||
            (tenantEmail && userEmail === tenantEmail)
          ) {
            await supabase.auth.admin.deleteUser(user.id);
            console.log(`Deleted auth user ${user.id} (${user.email}) for tenant ${tenantId}`);
          }
        }
      }
    } catch (authErr) {
      console.warn("Could not delete associated auth user:", authErr);
    }

    return NextResponse.json({
      success: true,
      tenantId,
      message: `Tenant ${tenantId} and all associated data permanently deleted.`,
    });
  } catch (err: any) {
    console.error("Admin delete tenant error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
