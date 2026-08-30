import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Welcome back</h2>
        <p className="text-xs text-slate-500">Sign in to your business account</p>
      </div>

      <form className="space-y-4" action="/dashboard">
        <Input
          label="Email Address"
          type="email"
          placeholder="owner@business.com"
          defaultValue="contact@royalevents.com"
          required
        />
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-700">Password</label>
            <Link
              href="/forgot-password"
              className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Forgot password?
            </Link>
          </div>
          <Input type="password" placeholder="••••••••" defaultValue="password123" required />
        </div>

        <Button type="submit" className="w-full">
          Sign In
        </Button>
      </form>

      <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
        Don&apos;t have a business account?{" "}
        <Link href="/signup" className="font-semibold text-emerald-600 hover:text-emerald-700">
          Create Account
        </Link>
      </div>
    </div>
  );
}
