import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";

export default function NewClientPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/clients" className="text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add New Client</h1>
          <p className="text-xs text-slate-500">
            Create a contact profile for quotations and invoicing.
          </p>
        </div>
      </div>

      <Card>
        <form className="space-y-4" action="/clients">
          <Input label="Client / Contact Name *" placeholder="e.g. Rahul Sharma" required />
          <Input label="Company Name (Optional)" placeholder="e.g. Acme Corporation Pvt Ltd" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Phone / WhatsApp Number *" placeholder="+91 98765 43210" required />
            <Input label="Email Address (Optional)" type="email" placeholder="client@domain.com" />
          </div>

          <Input
            label="GSTIN (OPTIONAL)"
            placeholder="e.g. 07AAAAA0000A1Z5 (Leave blank if unregistered)"
          />

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Billing Address</label>
            <textarea
              rows={3}
              placeholder="Street address, city, state, pincode..."
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Link href="/clients">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit">Save Client</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
