import { SignJWT, jwtVerify } from "jose";
import { NextRequest } from "next/server";

export const ADMIN_COOKIE_NAME = "billease_admin_token";

export const ADMIN_COOKIE_OPTIONS = {
  name: ADMIN_COOKIE_NAME,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: 12 * 60 * 60, // 12 hours
};

function getSecretKey(): Uint8Array {
  let secret = (process.env.ADMIN_SESSION_SECRET || "").trim();
  if (secret.includes("=")) secret = secret.split("=").slice(1).join("=");
  secret = secret.replace(/^['"]|['"]$/g, "").trim();
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not configured in environment variables");
  }
  return new TextEncoder().encode(secret);
}

export interface AdminTokenPayload {
  role: "super_admin";
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Creates a cryptographically signed JWT for Super-Admin session
 * Valid for 12 hours with HS256 signature.
 */
export async function createAdminSessionToken(email: string): Promise<string> {
  const secretKey = getSecretKey();
  return new SignJWT({ role: "super_admin", email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secretKey);
}

/**
 * Extracts the cookie value from either NextRequest or standard Request headers.
 */
function extractCookieValue(request: Request | NextRequest, name: string): string | null {
  if ("cookies" in request && typeof (request as NextRequest).cookies?.get === "function") {
    const cookie = (request as NextRequest).cookies.get(name);
    return cookie?.value || null;
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));

  return match ? match.slice(name.length + 1) : null;
}

/**
 * Extracts client IP from request headers for auditing and rate limiting.
 */
export function getClientIp(request: Request | NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

export interface AdminSessionVerificationResult {
  valid: boolean;
  email?: string;
  error?: string;
}

/**
 * Structured audit logging for admin security events.
 */
export function logAdminAudit(event: string, details: Record<string, any>) {
  const timestamp = new Date().toISOString();
  console.warn(`[ADMIN_AUDIT][${timestamp}] ${event}:`, JSON.stringify(details));
}

/**
 * Centralized verification helper for Super-Admin session token.
 * Validates cryptographic signature, expiration, and payload integrity.
 */
export async function verifyAdminSession(
  request: Request | NextRequest
): Promise<AdminSessionVerificationResult> {
  const token = extractCookieValue(request, ADMIN_COOKIE_NAME);
  const ip = getClientIp(request);

  if (!token) {
    return { valid: false, error: "Missing admin session token" };
  }

  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });

    if (payload.role !== "super_admin" || !payload.email) {
      logAdminAudit("SESSION_VERIFICATION_FAILED", {
        ip,
        reason: "Invalid payload claims",
      });
      return { valid: false, error: "Invalid admin token payload" };
    }

    return { valid: true, email: payload.email as string };
  } catch (err: any) {
    logAdminAudit("SESSION_VERIFICATION_FAILED", {
      ip,
      reason: err?.message || "Token verification exception",
    });
    return { valid: false, error: err?.message || "Invalid or expired admin session token" };
  }
}

// In-memory sliding window rate limiter: 5 attempts per 15 minutes per IP
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const loginAttempts = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

export function checkAdminRateLimit(ip: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry) {
    return { allowed: true };
  }

  if (now > entry.resetAt) {
    loginAttempts.delete(ip);
    return { allowed: true };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  return { allowed: true };
}

export function recordAdminFailedAttempt(ip: string): void {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
  } else {
    entry.count += 1;
  }
}

export function resetAdminAttempts(ip: string): void {
  loginAttempts.delete(ip);
}
