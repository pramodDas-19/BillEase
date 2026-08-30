import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Set new password</h2>
        <p className="text-xs text-slate-500">Please choose a strong password</p>
      </div>

      <form className="space-y-4" action="/login">
        <Input label="New Password" type="password" placeholder="••••••••" required />
        <Input label="Confirm New Password" type="password" placeholder="••••••••" required />
        <Button type="submit" className="w-full">
          Update Password
        </Button>
      </form>

      <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
        <Link href="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
