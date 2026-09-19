import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  createAdminSessionToken,
  verifyAdminSession,
  checkAdminRateLimit,
  recordAdminFailedAttempt,
  resetAdminAttempts,
  ADMIN_COOKIE_NAME,
} from "@/lib/admin-auth";
import { POST as adminLoginHandler } from "@/app/api/admin/auth/login/route";
import { GET as adminTenantsHandler } from "@/app/api/admin/tenants/route";
import { generateSync } from "otplib";

// Ensure environment variables are present in test environment
process.env.ADMIN_EMAIL = "admin@billease.com";
process.env.ADMIN_PASSWORD_HASH = "$2b$12$x6tP4f0kvmEIuSylOOLb4eEP7qR4.qTzm/U0u2MgRKRNLLYlZ5SPe";
process.env.ADMIN_TOTP_SECRET = "OGPLY7HLOD5Z3GPS6MZC7HM6WZQVH6JJ";
process.env.ADMIN_SESSION_SECRET = "32dbbef40883cbf76de9905a5d3f139baf5e204d731329cbe7d4f0c8f71099d3";

describe("Admin Authentication & Security Verification", () => {
  const testIp = "192.168.1.100";

  beforeEach(() => {
    resetAdminAttempts(testIp);
    resetAdminAttempts("127.0.0.1");
  });

  it("TEST 1: Forged cookie rejection - billease_admin_session=true MUST return 401", async () => {
    const forgedReq = new NextRequest("http://localhost:3000/api/admin/tenants", {
      headers: {
        cookie: "billease_admin_session=true",
      },
    });

    const res = await adminTenantsHandler(forgedReq);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain("Unauthorized");
  });

  it("TEST 2: Password-only rejection - login without valid TOTP MUST return 401", async () => {
    // Missing TOTP
    const reqNoTotp = new NextRequest("http://localhost:3000/api/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "admin@billease.com",
        password: "SuperAdmin@BillEase2026!",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const resNoTotp = await adminLoginHandler(reqNoTotp);
    expect(resNoTotp.status).toBe(401);
    const bodyNoTotp = await resNoTotp.json();
    expect(bodyNoTotp.error).toMatch(/2FA|Authenticator|code/i);

    // Invalid TOTP
    const reqBadTotp = new NextRequest("http://localhost:3000/api/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "admin@billease.com",
        password: "SuperAdmin@BillEase2026!",
        totp: "000000",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const resBadTotp = await adminLoginHandler(reqBadTotp);
    expect(resBadTotp.status).toBe(401);
    const bodyBadTotp = await resBadTotp.json();
    expect(bodyBadTotp.error).toMatch(/2FA|code/i);
  });

  it("TEST 3: Valid credentials + valid TOTP generates HttpOnly signed JWT session cookie", async () => {
    // Generate valid TOTP token for test
    const validTotp = generateSync({ secret: process.env.ADMIN_TOTP_SECRET! });

    const req = new NextRequest("http://localhost:3000/api/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "admin@billease.com",
        password: "SuperAdmin@BillEase2026!",
        totp: validTotp,
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await adminLoginHandler(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.user.role).toBe("super_admin");

    // Verify Set-Cookie header contains HttpOnly, SameSite=Strict, and JWT token
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeTruthy();
    expect(setCookie).toContain(`${ADMIN_COOKIE_NAME}=`);
    expect(setCookie).toMatch(/httponly/i);
    expect(setCookie).toMatch(/samesite=strict/i);

    // Extract token value
    const match = setCookie!.match(new RegExp(`${ADMIN_COOKIE_NAME}=([^;]+)`));
    const token = match?.[1];
    expect(token).toBeTruthy();
    expect(token).not.toBe("true");

    // Token must be a valid JWT with 3 parts (header.payload.signature)
    const parts = token!.split(".");
    expect(parts.length).toBe(3);

    // Verify token can be verified by verifyAdminSession
    const verifyReq = new NextRequest("http://localhost:3000/api/admin/tenants", {
      headers: {
        cookie: `${ADMIN_COOKIE_NAME}=${token}`,
      },
    });

    const authResult = await verifyAdminSession(verifyReq);
    expect(authResult.valid).toBe(true);
    expect(authResult.email).toBe("admin@billease.com");
  });

  it("TEST 4: Tampered session rejection - tampered JWT in billease_admin_token MUST return 401", async () => {
    const validToken = await createAdminSessionToken("admin@billease.com");
    const tamperedToken = validToken.substring(0, validToken.length - 6) + "XXXXXX";

    const tamperedReq = new NextRequest("http://localhost:3000/api/admin/tenants", {
      headers: {
        cookie: `${ADMIN_COOKIE_NAME}=${tamperedToken}`,
      },
    });

    const res = await adminTenantsHandler(tamperedReq);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain("Unauthorized");

    const authResult = await verifyAdminSession(tamperedReq);
    expect(authResult.valid).toBe(false);
  });

  it("TEST 5: Rate Limiter blocks after 5 failed attempts", () => {
    const ip = "10.0.0.50";
    resetAdminAttempts(ip);

    // Initial state: allowed
    expect(checkAdminRateLimit(ip).allowed).toBe(true);

    // 5 failed attempts
    for (let i = 0; i < 5; i++) {
      recordAdminFailedAttempt(ip);
    }

    // 6th attempt: blocked
    const rateLimit = checkAdminRateLimit(ip);
    expect(rateLimit.allowed).toBe(false);
    expect(rateLimit.retryAfterSeconds).toBeGreaterThan(0);

    // Reset allows again
    resetAdminAttempts(ip);
    expect(checkAdminRateLimit(ip).allowed).toBe(true);
  });
});
