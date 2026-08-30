import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Create your SaaS Account</h2>
        <p className="text-xs text-slate-500">For event planners, print studios & creative agencies</p>
      </div>

      <form className="space-y-3.5" action="/dashboard">
        <Input label="Business / Company Name" placeholder="e.g. Acme Event & Print Studio" required />
        <Input label="Owner / Your Name" placeholder="e.g. John Doe" required />
        <Input label="Email Address" type="email" placeholder="john@example.com" required />
        <Input label="Phone / WhatsApp Number" placeholder="+91 98765 43210" required />
        <Input label="Password" type="password" placeholder="••••••••" required />

        <div className="pt-2">
          <Button type="submit" className="w-full">
            Start Free Trial
          </Button>
        </div>
      </form>

      <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
          Sign In
        </Link>
      </div>
    </div>
  );
}
