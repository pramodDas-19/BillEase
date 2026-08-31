"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthService } from "@/services/auth.service";
import {
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please re-enter.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      await AuthService.updatePassword(password);
      setSuccessMsg("Password updated successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 1400);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update password. Please request a new recovery link.");
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="space-y-2 text-left">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <ShieldCheck className="h-3 w-3" />
          <span>Set New Password</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Create New Password
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 font-medium">
          Choose a strong password for your business studio account.
        </p>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 flex items-start gap-2.5 text-rose-300 text-xs font-semibold">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex items-start gap-2.5 text-emerald-300 text-xs font-semibold">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
            New Password <span className="text-emerald-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              type="password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 font-medium focus:border-emerald-500 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Confirm New Password <span className="text-emerald-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 font-medium focus:border-emerald-500 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading || !!successMsg}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 hover:shadow-emerald-900/60 active:scale-[0.99] transition-all cursor-pointer"
          >
            <span>{isLoading ? "Updating..." : "Update Password & Sign In"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>

      {/* Back to Login Link */}
      <div className="text-center text-xs text-slate-400 pt-2 font-medium">
        <Link href="/login" className="font-bold text-emerald-400 hover:text-emerald-300">
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
