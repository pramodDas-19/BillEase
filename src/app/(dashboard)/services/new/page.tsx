import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SERVICE_CATEGORIES, COMMON_UNITS } from "@/constants/service-categories";
import { ArrowLeft } from "lucide-react";

export default function NewServicePage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/services" className="text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add Service or Product</h1>
          <p className="text-xs text-slate-500">
            Save reusable services for event staging, print materials, or design work.
          </p>
        </div>
      </div>

      <Card>
        <form className="space-y-4" action="/services">
          <Input label="Service / Product Name *" placeholder="e.g. Stage Sound & Line Array Setup" required />

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Category</label>
            <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none">
              {SERVICE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Default Rate / Price (₹)" type="number" placeholder="45000" />
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Default Unit</label>
              <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none">
                {COMMON_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Description / Specifications</label>
            <textarea
              rows={3}
              placeholder="Default scope of work, technical specifications..."
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Link href="/services">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit">Save to Library</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
