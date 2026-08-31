import { NextResponse } from "next/server";
import { PaymentService } from "@/services/payment.service";

export async function GET() {
  const data = await PaymentService.getPayments();
  return NextResponse.json({ success: true, data });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const created = await PaymentService.recordPayment(body);
    return NextResponse.json({ success: true, data: created });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
