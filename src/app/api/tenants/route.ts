import { NextResponse } from "next/server";
import { TenantService } from "@/services/tenant.service";

export async function GET() {
  const tenants = await TenantService.getAllTenants();
  return NextResponse.json({ success: true, data: tenants });
}
