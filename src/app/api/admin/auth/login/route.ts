import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { verifySync } from "otplib";
import {
  createAdminSessionToken,
  ADMIN_COOKIE_NAME,
  ADMIN_COOKIE_OPTIONS,
  getClientIp,
  checkAdminRateLimit,
  recordAdminFailedAttempt,
  resetAdminAttempts,
  logAdminAudit,
} from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  // 1. Rate Limiting Check (5 attempts / 15 minutes / IP)
  const rateLimit = checkAdminRateLimit(ip);
  if (!rateLimit.allowed) {
    logAdminAudit("LOGIN_RATE_LIMITED", { ip, retryAfter: rateLimit.retryAfterSeconds });
    return NextResponse.json(
      {
        error: `Too many failed login attempts. Please try again in ${rateLimit.retryAfterSeconds || 900} seconds.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds || 900),
        },
      }
    );
  }

  try {
    const body = await request.json();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";
    const totpCode = (body.totp || body.totpCode || "").toString().trim();

    function cleanEnv(val: string | undefined): string {
      if (!val) return "";
      let s = val.trim();
      if (s.includes("=")) s = s.split("=").slice(1).join("=");
      return s.replace(/^['"]|['"]$/g, "").trim();
    }

    function cleanHash(val: string | undefined): string {
      const s = cleanEnv(val);
      // Unescape any backslashes before dollar signs (e.g. from .env.local escaping)
      return s.split("\\$").join("$");
    }

    const expectedEmail = cleanEnv(process.env.ADMIN_EMAIL).toLowerCase();
    const passwordHash = cleanHash(process.env.ADMIN_PASSWORD_HASH);
    const totpSecret = cleanEnv(process.env.ADMIN_TOTP_SECRET).replace(/\s+/g, "");

    if (!expectedEmail || !passwordHash || !totpSecret) {
      logAdminAudit("SERVER_MISCONFIGURATION", {
        ip,
        error: "Missing ADMIN_EMAIL, ADMIN_PASSWORD_HASH, or ADMIN_TOTP_SECRET",
      });
      return NextResponse.json(
        { error: "Admin authentication is not properly configured on server." },
        { status: 500 }
      );
    }

    // 2. Validate email
    if (!email || email !== expectedEmail) {
      recordAdminFailedAttempt(ip);
      logAdminAudit("LOGIN_FAILED", { ip, email, reason: "Invalid email" });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // 3. Validate password with bcrypt
    const passwordMatches = await bcrypt.compare(password, passwordHash);
    if (!passwordMatches) {
      recordAdminFailedAttempt(ip);
      logAdminAudit("LOGIN_FAILED", { ip, email, reason: "Invalid password" });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // 4. Validate TOTP 2FA code (RFC 6238 with clock-drift window)
    if (!totpCode || !/^\d{6}$/.test(totpCode)) {
      recordAdminFailedAttempt(ip);
      logAdminAudit("LOGIN_FAILED", { ip, email, reason: "Missing or malformed 2FA TOTP code" });
      return NextResponse.json(
        { error: "A valid 6-digit Authenticator 2FA code is required." },
        { status: 401 }
      );
    }

    const nowSec = Math.floor(Date.now() / 1000);
    let isTotpValid = false;
    for (const offset of [0, -30, 30]) {
      const res = verifySync({
        token: totpCode,
        secret: totpSecret,
        epoch: nowSec + offset,
      });
      if (res && res.valid) {
        isTotpValid = true;
        break;
      }
    }

    if (!isTotpValid) {
      recordAdminFailedAttempt(ip);
      logAdminAudit("LOGIN_FAILED", { ip, email, reason: "Invalid 2FA TOTP code" });
      return NextResponse.json(
        { error: "Invalid 2FA code. Please check your authenticator app." },
        { status: 401 }
      );
    }

    // 5. Successful login
    resetAdminAttempts(ip);
    logAdminAudit("LOGIN_SUCCESS", { ip, email });

    const sessionToken = await createAdminSessionToken(email);

    const response = NextResponse.json(
      {
        success: true,
        user: {
          email,
          role: "super_admin",
        },
      },
      { status: 200 }
    );

    // 6. Set cryptographically signed HttpOnly; Secure; SameSite=Strict cookie
    response.cookies.set({
      ...ADMIN_COOKIE_OPTIONS,
      value: sessionToken,
    });

    // Explicitly delete any legacy forgeable cookie
    response.cookies.set({
      name: "billease_admin_session",
      value: "",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });

    return response;
  } catch (err: any) {
    recordAdminFailedAttempt(ip);
    logAdminAudit("LOGIN_EXCEPTION", { ip, error: err?.message });
    return NextResponse.json({ error: "Internal server error during login" }, { status: 500 });
  }
}
