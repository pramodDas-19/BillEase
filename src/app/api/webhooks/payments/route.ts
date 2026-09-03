import { NextResponse, type NextRequest } from "next/server";
import { supabase } from "@/lib/supabase/client";
import crypto from "crypto";

/**
 * Secure Webhook Listener for Payment Gateway & Bank Confirmations (Razorpay / Cashfree / Custom Webhooks)
 * POST /api/webhooks/payments
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET;

    // 1. Webhook Authentication & Signature Verification
    const razorpaySignature = request.headers.get("x-razorpay-signature");
    const customSecretHeader = request.headers.get("x-webhook-secret");

    if (webhookSecret) {
      if (razorpaySignature) {
        // Razorpay HMAC SHA256 Signature Verification
        const expectedSignature = crypto
          .createHmac("sha256", webhookSecret)
          .update(rawBody)
          .digest("hex");

        if (expectedSignature !== razorpaySignature) {
          return NextResponse.json(
            { error: "Invalid webhook signature. Unauthorized." },
            { status: 401 }
          );
        }
      } else if (customSecretHeader) {
        // Custom Webhook Shared Secret Verification
        if (customSecretHeader !== webhookSecret) {
          return NextResponse.json(
            { error: "Invalid webhook secret token. Unauthorized." },
            { status: 401 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "Missing webhook authorization header or signature." },
          { status: 401 }
        );
      }
    } else {
      // In development or when secret not configured, warn and require at least a secret token header
      const devSecret = request.headers.get("x-webhook-secret");
      if (!devSecret && process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Payment webhook secret not configured. Requests blocked in production." },
          { status: 403 }
        );
      }
    }

    const body = JSON.parse(rawBody);

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

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid settlement amount in webhook payload." },
        { status: 400 }
      );
    }

    // 2. Idempotency Check: Prevent duplicate payment settlement
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("id, payment_number")
      .eq("transaction_reference", transactionRef)
      .maybeSingle();

    if (existingPayment) {
      return NextResponse.json({
        success: true,
        message: "Payment already processed previously (idempotent).",
        paymentNumber: existingPayment.payment_number,
      });
    }

    // 3. Fetch Target Invoice from PostgreSQL
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

    // 4. Insert Verified Payment Receipt in 'payments' table
    const paymentNum = `PAY-${Date.now().toString().slice(-4)}`;
    const { error: payInsertErr } = await supabase.from("payments").insert([
      {
        id: `pay-${Date.now()}`,
        tenant_id: invoice.tenant_id,
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
        notes: `Verified webhook settlement via ${event}`,
        status: "completed",
      },
    ]);

    if (payInsertErr) {
      console.error("Failed to insert webhook payment receipt:", payInsertErr);
      return NextResponse.json(
        { error: "Database error recording payment receipt." },
        { status: 500 }
      );
    }

    // 5. Auto-Update Invoice Balance & Status in PostgreSQL
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
      return NextResponse.json(
        { error: "Database error updating invoice balance." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verified webhook processed successfully. Invoice auto-reconciled.",
      invoiceNumber: invoice.invoice_number,
      amountSettled: amount,
      newBalanceDue,
      status: newStatus,
      receiptNumber: paymentNum,
    });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json(
      { error: "Internal server error processing webhook." },
      { status: 500 }
    );
  }
}
