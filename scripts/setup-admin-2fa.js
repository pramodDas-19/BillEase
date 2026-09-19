const { generateSecret, generateURI, generateSync, verifySync } = require("otplib");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const qrcode = require("qrcode");

async function generateAdminCredentials() {
  const email = process.env.ADMIN_EMAIL || "admin@billease.com";
  const password = process.argv[2] || "SuperAdmin@BillEase2026!";

  // 1. Salted bcrypt hash
  const salt = bcrypt.genSaltSync(12);
  const passwordHash = bcrypt.hashSync(password, salt);

  // 2. Base32 TOTP secret
  const totpSecret = generateSecret();

  // 3. Cryptographic session signing key (64 hex characters / 256-bit)
  const sessionSecret = crypto.randomBytes(32).toString("hex");

  // 4. OTP Auth URI for Authenticator App
  const otpauthUri = generateURI({
    label: email,
    issuer: "BillEase SuperAdmin",
    secret: totpSecret,
  });

  console.log("\n==================================================");
  console.log("🔐 BillEase Super-Admin Security Credentials Setup");
  console.log("==================================================\n");

  console.log("Scan this QR code in Google Authenticator, 1Password, or Authy:\n");
  const qrString = await qrcode.toString(otpauthUri, { type: "terminal", small: true });
  console.log(qrString);

  console.log("\nOR enter this manual key in your Authenticator app:");
  console.log(`Secret Key: ${totpSecret}\n`);

  console.log("Copy and paste these environment variables into your .env.local file:\n");
  console.log(`ADMIN_EMAIL=${email}`);
  console.log(`ADMIN_PASSWORD_HASH=${passwordHash}`);
  console.log(`ADMIN_TOTP_SECRET=${totpSecret}`);
  console.log(`ADMIN_SESSION_SECRET=${sessionSecret}`);
  console.log("\nPassword used for initial hash:", password);
  console.log("Keep this password in a secure password manager!\n");
}

generateAdminCredentials().catch(console.error);
