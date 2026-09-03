import { NextResponse } from "next/server";
import { QuotationService } from "@/services/quotation.service";
import { validateQuotationInput } from "@/lib/server-validations";

export async function GET() {
  const data = await QuotationService.getQuotations();
  return NextResponse.json({ success: true, data });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = validateQuotationInput(body);

    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    const created = await QuotationService.createQuotation(body);
    if (!created) {
      return NextResponse.json(
        { success: false, error: "Failed to persist quotation to database." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

