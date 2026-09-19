import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession, getClientIp, logAdminAudit } from "@/lib/admin-auth";
import { generateURI } from "otplib";
import qrcode from "qrcode";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const auth = await verifyAdminSession(request);

  if (!auth.valid) {
    logAdminAudit("UNAUTHORIZED_2FA_SETUP_ATTEMPT", { ip });
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const email = process.env.ADMIN_EMAIL || "admin@billease.com";
  const totpSecret = process.env.ADMIN_TOTP_SECRET;

  if (!totpSecret) {
    return NextResponse.json(
      { error: "2FA secret is not configured on server" },
      { status: 500 }
    );
  }

  const otpauthUri = generateURI({
    label: email,
    issuer: "BillEase SuperAdmin",
    secret: totpSecret,
  });

  try {
    const qrDataUrl = await qrcode.toDataURL(otpauthUri);
    return NextResponse.json({
      secret: totpSecret,
      otpauthUri,
      qrCode: qrDataUrl,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to generate QR code", details: err?.message },
      { status: 500 }
    );
  }
}
