import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const auth = await verifyAdminSession(request);

  if (!auth.valid) {
    return NextResponse.json(
      { authenticated: false, error: auth.error || "Unauthorized" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      email: auth.email,
      role: "super_admin",
    },
  });
}
