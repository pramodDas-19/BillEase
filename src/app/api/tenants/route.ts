import { NextResponse } from "next/server";
import { MOCK_TENANTS } from "@/mock/tenants.mock";

export async function GET() {
  return NextResponse.json({ success: true, data: MOCK_TENANTS });
}
