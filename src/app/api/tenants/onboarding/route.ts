import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, action } = body;

    if (!tenantId || typeof tenantId !== "string") {
      return NextResponse.json({ error: "Valid tenantId is required" }, { status: 400 });
    }

    if (action !== "dismiss_welcome" && action !== "dismiss_checklist") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://butxutqhbhscbihunnwr.supabase.co";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return NextResponse.json({ error: "Service role key missing" }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Fetch existing tenant record to merge settings safely
    const { data: tenant, error: fetchErr } = await supabaseAdmin
      .from("tenants")
      .select("settings")
      .eq("id", tenantId)
      .single();

    if (fetchErr || !tenant) {
      return NextResponse.json(
        { error: fetchErr?.message || "Tenant not found" },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();
    const existingSettings = tenant.settings || {};
    const updatedSettings = {
      ...existingSettings,
      ...(action === "dismiss_welcome" ? { onboarding_welcome_seen_at: now } : {}),
      ...(action === "dismiss_checklist" ? { onboarding_checklist_dismissed_at: now } : {}),
    };

    const { error: updateErr } = await supabaseAdmin
      .from("tenants")
      .update({ settings: updatedSettings })
      .eq("id", tenantId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      action,
      updatedAt: now,
      settings: updatedSettings,
    });
  } catch (err: any) {
    console.error("Onboarding persistence API error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
