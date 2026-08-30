import { NextResponse } from "next/server";
import { MOCK_PAYMENTS } from "@/mock/payments.mock";

export async function GET() {
  return NextResponse.json({ success: true, data: MOCK_PAYMENTS });
}
