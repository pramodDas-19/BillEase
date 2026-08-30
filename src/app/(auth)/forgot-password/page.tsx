import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Reset your password</h2>
        <p className="text-xs text-slate-500">
          Enter your registered email and we&apos;ll send you a password reset link
        </p>
      </div>

      <form className="space-y-4">
        <Input label="Email Address" type="email" placeholder="owner@business.com" required />
        <Button type="submit" className="w-full">
          Send Reset Link
        </Button>
      </form>

      <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
        Remember your password?{" "}
        <Link href="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
