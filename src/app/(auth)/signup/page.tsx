"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthService } from "@/services/auth.service";
import {
  Building2,
  User,
  Phone,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      await AuthService.signUp({
        businessName,
        ownerName,
        phone,
        email,
        password,
      });

      setSuccessMsg("Account created! Redirecting to your new dashboard...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create account. Please check your details.");
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="space-y-2 text-left">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Sparkles className="h-3 w-3" />
          <span>Start Free in 60 Seconds</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Create Business Account
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 font-medium">
          Start managing clients, quotations, invoices, and payments effortlessly.
        </p>
      </div>

      {/* Error / Success Banners */}
      {errorMsg && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 flex items-start gap-2.5 text-rose-300 text-xs font-semibold animate-in shake duration-300">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex items-start gap-2.5 text-emerald-300 text-xs font-semibold animate-in fade-in duration-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Business / Studio Name <span className="text-emerald-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Building2 className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="e.g. Apex Event & Print Studio"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 font-medium focus:border-emerald-500 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Your Name <span className="text-emerald-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="Rahul Sharma"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 font-medium focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              WhatsApp Phone <span className="text-emerald-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone className="h-4 w-4" />
              </div>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 font-medium focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Work Email Address <span className="text-emerald-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="h-4 w-4" />
            </div>
            <input
              type="email"
              placeholder="owner@business.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 font-medium focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Password <span className="text-emerald-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 font-medium focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading || !!successMsg}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 hover:shadow-emerald-900/60 active:scale-[0.99] transition-all cursor-pointer"
          >
            <span>{isLoading ? "Creating account..." : "Create Account"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>

      {/* Sign In Link */}
      <div className="text-center text-xs text-slate-400 pt-2 font-medium">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-4">
          Sign in
        </Link>
      </div>
    </div>
  );
}

