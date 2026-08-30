import { NextResponse } from "next/server";
import { MOCK_QUOTATIONS } from "@/mock/quotations.mock";

export async function GET() {
  return NextResponse.json({ success: true, data: MOCK_QUOTATIONS });
}
