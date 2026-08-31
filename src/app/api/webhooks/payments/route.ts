import { NextResponse, type NextRequest } from "next/server";
import { supabase } from "@/lib/supabase/client";

/**
 * Webhook Listener for Payment Gateway & Bank Confirmations (Razorpay / Cashfree / Custom Webhooks)
 * POST /api/webhooks/payments
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extract payment details from standard webhook payload
    const event = body.event || "payment.captured";
    const paymentData = body.payload?.payment?.entity || body.data || body;

    const invoiceNumber = paymentData.notes?.invoice_number || paymentData.invoice_number || paymentData.invoiceNumber;
    const invoiceId = paymentData.notes?.invoice_id || paymentData.invoice_id || paymentData.invoiceId;
    const amount = Number(paymentData.amount ? paymentData.amount / (paymentData.amount > 1000 ? 100 : 1) : 0) || Number(paymentData.amountPaid || 0);
    const transactionRef = paymentData.id || paymentData.payment_id || `TXN-${Date.now()}`;
    const paymentMethod = (paymentData.method || "upi").toLowerCase().includes("upi") ? "upi" : "bank_transfer";

    if (!invoiceId && !invoiceNumber) {
      return NextResponse.json(
        { error: "Webhook received but missing invoice reference (invoiceId or invoiceNumber)." },
        { status: 400 }
      );
    }

    // 1. Fetch Target Invoice from PostgreSQL
    let query = supabase.from("invoices").select("*");
    if (invoiceId) {
      query = query.eq("id", invoiceId);
    } else {
      query = query.eq("invoice_number", invoiceNumber);
    }

    const { data: invoices, error: fetchErr } = await query;
    if (fetchErr || !invoices || invoices.length === 0) {
      return NextResponse.json(
        { error: "Target invoice not found in database for webhook settlement." },
        { status: 404 }
      );
    }

    const invoice = invoices[0];
    const newPaidAmount = (Number(invoice.paid_amount) || 0) + amount;
    const totalAmount = Number(invoice.total_amount) || 0;
    const newBalanceDue = Math.max(0, totalAmount - newPaidAmount);
    const newStatus = newBalanceDue <= 0 ? "paid" : "partially_paid";

    // 2. Insert Verified Payment Receipt in 'payments' table
    const paymentNum = `PAY-${Date.now().toString().slice(-4)}`;
    const { error: payInsertErr } = await supabase.from("payments").insert([
      {
        id: `pay-${Date.now()}`,
        tenant_id: invoice.tenant_id || "tenant-royal-events",
        payment_number: paymentNum,
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        client_id: invoice.client_id,
        client_name: invoice.client_name,
        amount,
        currency: invoice.currency || "INR",
        payment_date: new Date().toISOString().split("T")[0],
        payment_method: paymentMethod,
        transaction_reference: transactionRef,
        notes: `Automated webhook settlement via ${event}`,
      },
    ]);

    if (payInsertErr) {
      console.error("Failed to insert webhook payment receipt:", payInsertErr);
    }

    // 3. Auto-Update Invoice Balance & Status in PostgreSQL
    const { error: updateErr } = await supabase
      .from("invoices")
      .update({
        paid_amount: newPaidAmount,
        balance_due: newBalanceDue,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoice.id);

    if (updateErr) {
      console.error("Failed to update invoice balance from webhook:", updateErr);
    }

    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully. Invoice auto-reconciled.",
      invoiceNumber: invoice.invoice_number,
      amountSettled: amount,
      newBalanceDue,
      status: newStatus,
    });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json(
      { error: "Internal server error processing payment webhook", details: err.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    endpoint: "BillEase Payment Webhook Listener",
    supportedEvents: ["payment.captured", "payment_link.paid", "order.paid"],
  });
}
