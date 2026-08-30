import React from "react";
import Link from "next/link";
import { APP_CONFIG } from "@/config/app.config";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            B
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            {APP_CONFIG.name}
          </span>
        </Link>
        <p className="mt-1 text-xs text-slate-500">{APP_CONFIG.tagline}</p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/70 sm:rounded-2xl sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}
