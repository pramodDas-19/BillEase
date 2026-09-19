import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, getClientIp, logAdminAudit } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  logAdminAudit("LOGOUT", { ip });

  const response = NextResponse.json({ success: true, message: "Logged out successfully" });

  // Expire the signed admin token cookie
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  // Also expire any legacy cookie if lingering in the browser
  response.cookies.set({
    name: "billease_admin_session",
    value: "",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}
