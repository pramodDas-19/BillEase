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
      return NextResponse.json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY environment variable." }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: systemRow } = await supabase
      .from("tenants")
      .select("settings")
      .eq("id", "system-platform-config")
      .single();

    const settings = (systemRow?.settings || {}) as Record<string, any>;

    return NextResponse.json({
      success: true,
      broadcast: settings.broadcast || null,
      platformConfig: settings.platformConfig || null,
    });
  } catch (err: any) {
    console.error("Admin get broadcast error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminSession(request);
    if (!auth.valid) {
      return NextResponse.json({ error: "Unauthorized. Admin session required." }, { status: 401 });
    }

    const body = await request.json();
    const { action, message, type, platformConfig } = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://butxutqhbhscbihunnwr.supabase.co";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!serviceRoleKey) {
      return NextResponse.json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY environment variable." }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Fetch existing settings
    const { data: existingRow } = await supabase
      .from("tenants")
      .select("settings")
      .eq("id", "system-platform-config")
      .single();

    const existingSettings = (existingRow?.settings || {}) as Record<string, any>;
    let updatedSettings = { ...existingSettings };

    if (action === "update_config" && platformConfig) {
      updatedSettings.platformConfig = platformConfig;
    } else {
      // Default: update broadcast
      if (!message || !message.trim()) {
        return NextResponse.json({ error: "Announcement message is required." }, { status: 400 });
      }

      updatedSettings.broadcast = {
        id: `bcast-${Date.now()}`,
        message: message.trim(),
        type: type || "info",
        active: true,
        publishedAt: new Date().toISOString(),
      };
    }

    const { error: upsertErr } = await supabase.from("tenants").upsert({
      id: "system-platform-config",
      business_name: "BillEase Platform Control",
      owner_name: "Super-Admin",
      email: "admin@billease.com",
      phone: "0000000000",
      settings: updatedSettings,
      updated_at: new Date().toISOString(),
    });

    if (upsertErr) {
      console.error("Failed to save broadcast in Supabase:", upsertErr);
      return NextResponse.json({ error: "Failed to persist to Supabase: " + upsertErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      broadcast: updatedSettings.broadcast || null,
      platformConfig: updatedSettings.platformConfig || null,
      message: "Broadcast saved live in Supabase PostgreSQL.",
    });
  } catch (err: any) {
    console.error("Admin save broadcast error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAdminSession(request);
    if (!auth.valid) {
      return NextResponse.json({ error: "Unauthorized. Admin session required." }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://butxutqhbhscbihunnwr.supabase.co";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!serviceRoleKey) {
      return NextResponse.json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY environment variable." }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: existingRow } = await supabase
      .from("tenants")
      .select("settings")
      .eq("id", "system-platform-config")
      .single();

    const existingSettings = (existingRow?.settings || {}) as Record<string, any>;
    const updatedSettings = {
      ...existingSettings,
      broadcast: null,
    };

    await supabase.from("tenants").upsert({
      id: "system-platform-config",
      business_name: "BillEase Platform Control",
      owner_name: "Super-Admin",
      email: "admin@billease.com",
      phone: "0000000000",
      settings: updatedSettings,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      broadcast: null,
      message: "Broadcast cleared from Supabase PostgreSQL.",
    });
  } catch (err: any) {
    console.error("Admin delete broadcast error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
