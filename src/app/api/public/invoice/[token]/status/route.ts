import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json(
        { error: "Invalid token." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://butxutqhbhscbihunnwr.supabase.co";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: "Internal server error." },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Query invoice status
    let { data: invoice, error: invErr } = await supabaseAdmin
      .from("invoices")
      .select("status, balance_due, paid_amount")
      .eq("public_token", token)
      .maybeSingle();

    if (invErr && invErr.message?.includes("public_token")) {
      const fallback = await supabaseAdmin
        .from("invoices")
        .select("status, balance_due, paid_amount")
        .eq("id", token)
        .maybeSingle();
      invoice = fallback.data;
    }

    if (invoice) {
      return NextResponse.json({
        success: true,
        status: invoice.status,
        balanceDue: Number(invoice.balance_due ?? 0),
        paidAmount: Number(invoice.paid_amount ?? 0),
      });
    }

    // Check quotations if not found in invoices
    let { data: quote, error: quoteErr } = await supabaseAdmin
      .from("quotations")
      .select("status, total_amount")
      .eq("public_token", token)
      .maybeSingle();

    if (quoteErr && quoteErr.message?.includes("public_token")) {
      const fallback = await supabaseAdmin
        .from("quotations")
        .select("status, total_amount")
        .eq("id", token)
        .maybeSingle();
      quote = fallback.data;
    }

    if (quote) {
      return NextResponse.json({
        success: true,
        status: quote.status,
        balanceDue: Number(quote.total_amount ?? 0),
        paidAmount: 0,
      });
    }

    return NextResponse.json(
      { error: "Invoice not found." },
      { status: 404 }
    );
  } catch (err: any) {
    console.error("Invoice status route error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
