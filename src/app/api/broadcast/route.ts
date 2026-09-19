import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://butxutqhbhscbihunnwr.supabase.co";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!serviceRoleKey) {
      return NextResponse.json({ success: true, broadcast: null });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: systemRow, error } = await supabase
      .from("tenants")
      .select("settings")
      .eq("id", "system-platform-config")
      .single();

    if (error || !systemRow) {
      return NextResponse.json({ success: true, broadcast: null });
    }

    const settings = (systemRow.settings || {}) as Record<string, any>;
    const broadcast = settings.broadcast;

    if (!broadcast || broadcast.active === false) {
      return NextResponse.json({ success: true, broadcast: null });
    }

    return NextResponse.json({
      success: true,
      broadcast: {
        id: broadcast.id,
        message: broadcast.message,
        type: broadcast.type || "info",
        publishedAt: broadcast.publishedAt,
      },
    });
  } catch (err: any) {
    console.error("Public broadcast fetch error:", err);
    return NextResponse.json({ success: false, broadcast: null }, { status: 500 });
  }
}
