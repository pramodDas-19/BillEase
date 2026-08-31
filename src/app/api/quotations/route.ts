import { NextResponse } from "next/server";
import { QuotationService } from "@/services/quotation.service";

export async function GET() {
  const data = await QuotationService.getQuotations();
  return NextResponse.json({ success: true, data });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const created = await QuotationService.createQuotation(body);
    return NextResponse.json({ success: true, data: created });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
