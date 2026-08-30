import { NextResponse } from "next/server";
import { MOCK_INVOICES } from "@/mock/invoices.mock";

export async function GET() {
  return NextResponse.json({ success: true, data: MOCK_INVOICES });
}
