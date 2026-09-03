import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// In-memory rate limiting map: ip -> [timestamps]
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 req/min per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  validTimestamps.push(now);
  rateLimitMap.set(ip, validTimestamps);
  return false;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "anonymous";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a minute." },
        { status: 429 }
      );
    }

    const { token } = await params;
    if (!token || token.length < 3) {
      return NextResponse.json(
        { error: "Invoice not found or expired." },
        { status: 404 }
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

    // Service role client bypasses RLS safely to query single unguessable token
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 1. Query invoice by public_token (with graceful fallback to id if column not yet migrated)
    let invoice: any = null;
    let isQuotation = false;

    let { data: invData, error: invErr } = await supabaseAdmin
      .from("invoices")
      .select("id, invoice_number, tenant_id, client_name, total_amount, balance_due, paid_amount, status, currency, due_date")
      .eq("public_token", token)
      .maybeSingle();

    if (invErr && invErr.message?.includes("public_token")) {
      const fallback = await supabaseAdmin
        .from("invoices")
        .select("id, invoice_number, tenant_id, client_name, total_amount, balance_due, paid_amount, status, currency, due_date")
        .eq("id", token)
        .maybeSingle();
      invData = fallback.data;
    }

    if (invData) {
      invoice = invData;
    } else {
      // 2. Check if token matches a quotation
      let { data: quoteData, error: quoteErr } = await supabaseAdmin
        .from("quotations")
        .select("id, quotation_number, tenant_id, client_name, total_amount, status, currency, valid_until")
        .eq("public_token", token)
        .maybeSingle();

      if (quoteErr && quoteErr.message?.includes("public_token")) {
        const fallback = await supabaseAdmin
          .from("quotations")
          .select("id, quotation_number, tenant_id, client_name, total_amount, status, currency, valid_until")
          .eq("id", token)
          .maybeSingle();
        quoteData = fallback.data;
      }

      if (quoteData) {
        invoice = quoteData;
        isQuotation = true;
      }
    }

    // Generic 404 response — never leaks internal state
    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found or expired." },
        { status: 404 }
      );
    }

    // 3. Fetch ONLY the necessary public business & bank details for this specific tenant
    let businessName = "BillEase Partner";
    let bankDetails = {
      bankName: "HDFC Bank",
      accountNumber: "",
      ifscCode: "",
      upiId: "",
      accountName: "",
    };

    if (invoice.tenant_id) {
      const { data: tenant } = await supabaseAdmin
        .from("tenants")
        .select("business_name, bank_details")
        .eq("id", invoice.tenant_id)
        .maybeSingle();

      if (tenant) {
        businessName = tenant.business_name || businessName;
        if (tenant.bank_details) {
          bankDetails = {
            bankName: tenant.bank_details.bankName || "",
            accountNumber: tenant.bank_details.accountNumber || "",
            ifscCode: tenant.bank_details.ifscCode || "",
            upiId: tenant.bank_details.upiId || "",
            accountName: tenant.bank_details.accountName || businessName,
          };
        }
      }
    }

    // 4. Return strictly scoped public payment payload
    return NextResponse.json({
      success: true,
      data: {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number || invoice.quotation_number,
        isQuotation,
        clientName: invoice.client_name || "Valued Client",
        totalAmount: Number(invoice.total_amount) || 0,
        balanceDue: isQuotation ? Number(invoice.total_amount) : Number(invoice.balance_due ?? invoice.total_amount),
        paidAmount: isQuotation ? 0 : Number(invoice.paid_amount || 0),
        status: invoice.status,
        currency: invoice.currency || "INR",
        dueDate: invoice.due_date || invoice.valid_until || null,
        businessName,
        bankDetails,
      },
    });
  } catch (err: any) {
    console.error("Public invoice route error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
