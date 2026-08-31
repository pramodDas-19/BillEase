import { NextResponse } from "next/server";
import { InvoiceService } from "@/services/invoice.service";

export async function GET() {
  const data = await InvoiceService.getInvoices();
  return NextResponse.json({ success: true, data });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const created = await InvoiceService.createInvoice(body);
    return NextResponse.json({ success: true, data: created });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
