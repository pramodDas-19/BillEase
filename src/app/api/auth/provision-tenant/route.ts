import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://butxutqhbhscbihunnwr.supabase.co";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_-pV2SiWE3RXBHyN63admfg_z8S0yx9c";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: "Server configuration error: missing service role key" },
        { status: 500 }
      );
    }

    // 1. Service-Role Admin Client
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 2. Authenticate caller from Bearer token OR SSR request session cookies
    let user = null;
    const authHeader = request.headers.get("authorization") || "";
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      if (token) {
        const { data: tokenUserData, error: tokenError } = await supabaseAdmin.auth.getUser(token);
        if (!tokenError && tokenUserData?.user) {
          user = tokenUserData.user;
        }
      }
    }

    if (!user) {
      const supabaseSsr = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        },
      });

      const {
        data: { user: ssrUser },
        error: ssrAuthError,
      } = await supabaseSsr.auth.getUser();

      if (!ssrAuthError && ssrUser) {
        user = ssrUser;
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Valid auth session required." },
        { status: 401 }
      );
    }

    // 3. Idempotency Check: if tenant_id is already in app_metadata, verify db record exists
    const existingTenantId = user.app_metadata?.tenant_id;
    if (existingTenantId) {
      const { data: existingRow } = await supabaseAdmin
        .from("tenants")
        .select("id")
        .eq("id", existingTenantId)
        .single();

      if (existingRow?.id) {
        return NextResponse.json({
          success: true,
          tenantId: existingTenantId,
          message: "Tenant already provisioned.",
        });
      }
    }

    // Parse business details from request (never accept tenant_id from client)
    const body = await request.json().catch(() => ({}));
    const businessName = (body.businessName || user.user_metadata?.business_name || "My Business").trim();
    const ownerName = (body.ownerName || user.user_metadata?.owner_name || user.email?.split("@")[0] || "Business Owner").trim();
    const phone = (body.phone || user.user_metadata?.phone || "").trim();

    // 4. Generate tenant_id SERVER-SIDE ONLY
    const cleanSlug = businessName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-") || "workspace";
    const tenantId = `tenant-${cleanSlug}-${Date.now().toString().slice(-4)}`;

    // 5. Create tenant record using service-role
    const { error: tenantInsertErr } = await supabaseAdmin.from("tenants").insert([
      {
        id: tenantId,
        business_name: businessName,
        owner_name: ownerName,
        email: user.email,
        phone: phone,
        address: { street: "", city: "", state: "", postalCode: "" },
        bank_details: { bankName: "HDFC Bank", accountNumber: "", ifscCode: "", upiId: "" },
        settings: {
          defaultCurrency: "INR",
          enableGstByDefault: true,
          defaultTaxRate: 18,
          quotationNumbering: { prefix: "QT-", nextNumber: 1001, digitLength: 4 },
          invoiceNumbering: { prefix: "INV-", nextNumber: 1001, digitLength: 4 },
          defaultQuotationValidityDays: 14,
          defaultInvoiceDueDays: 14,
          defaultTermsAndConditions: "1. 50% advance required to confirm booking.\n2. Balance due within 14 days of invoice.",
          defaultInvoiceNotes: "Thank you for your business!",
        },
      },
    ]);

    if (tenantInsertErr) {
      console.error("Failed to insert tenant record via admin:", tenantInsertErr);
      return NextResponse.json(
        { error: "Failed to create tenant record in database." },
        { status: 500 }
      );
    }

    // 6. Write tenant_id to app_metadata using Admin API (tamper-proof, server-only)
    const { error: updateAdminErr } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        app_metadata: {
          ...user.app_metadata,
          tenant_id: tenantId,
        },
      }
    );

    if (updateAdminErr) {
      console.error("Failed to update user app_metadata:", updateAdminErr);
      return NextResponse.json(
        { error: "Failed to assign tenant to user app_metadata." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tenantId,
      message: "Tenant successfully provisioned in app_metadata.",
    });
  } catch (err: any) {
    console.error("Provision tenant route error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error." },
      { status: 500 }
    );
  }
}
