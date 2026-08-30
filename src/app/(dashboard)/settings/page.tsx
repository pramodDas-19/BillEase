"use client";

import React, { useState } from "react";
import { useTenant } from "@/hooks/use-tenant";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Hash, FileCheck, Bell, Save } from "lucide-react";

export default function SettingsPage() {
  const { currentTenant, updateTenantSettings } = useTenant();
  const [activeTab, setActiveTab] = useState<"profile" | "numbering" | "terms" | "reminders">("profile");

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Business Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure business details, GST rules, numbering sequences, and default quotation terms.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === "profile" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          <span>Business Profile</span>
        </button>
        <button
          onClick={() => setActiveTab("numbering")}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === "numbering" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Hash className="h-3.5 w-3.5" />
          <span>Document Numbering</span>
        </button>
        <button
          onClick={() => setActiveTab("terms")}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === "terms" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <FileCheck className="h-3.5 w-3.5" />
          <span>Default Terms</span>
        </button>
        <button
          onClick={() => setActiveTab("reminders")}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === "reminders" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Bell className="h-3.5 w-3.5" />
          <span>Payment Reminders</span>
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <Card className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Company / Studio Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Business Name *" defaultValue={currentTenant.businessName} required />
            <Input label="Owner / Authorized Person *" defaultValue={currentTenant.ownerName} required />
            <Input label="Phone / WhatsApp *" defaultValue={currentTenant.phone} required />
            <Input label="Email Address *" defaultValue={currentTenant.email} required />
            <Input label="Website (Optional)" defaultValue={currentTenant.website || ""} />
            <Input
              label="GSTIN (OPTIONAL)"
              placeholder="e.g. 07AAAAA0000A1Z5 (Leave blank if not registered)"
              defaultValue={currentTenant.gstin || ""}
            />
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="text-xs font-medium text-slate-700">Official Registered Address</label>
            <textarea
              rows={2}
              defaultValue={currentTenant.address?.street}
              placeholder="Street address, city, state..."
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button size="sm" className="gap-1.5">
              <Save className="h-3.5 w-3.5" />
              <span>Save Profile</span>
            </Button>
          </div>
        </Card>
      )}

      {/* Numbering Tab */}
      {activeTab === "numbering" && (
        <Card className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Custom Numbering Sequences</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="rounded-xl border border-slate-100 p-4 bg-slate-50/50 space-y-3">
              <h4 className="font-semibold text-xs text-slate-800">Quotation Numbering</h4>
              <Input
                label="Prefix"
                defaultValue={currentTenant.settings.quotationNumbering.prefix}
              />
              <Input
                label="Next Sequence Number"
                type="number"
                defaultValue={currentTenant.settings.quotationNumbering.nextNumber}
              />
            </div>

            <div className="rounded-xl border border-slate-100 p-4 bg-slate-50/50 space-y-3">
              <h4 className="font-semibold text-xs text-slate-800">Invoice Numbering</h4>
              <Input
                label="Prefix"
                defaultValue={currentTenant.settings.invoiceNumbering.prefix}
              />
              <Input
                label="Next Sequence Number"
                type="number"
                defaultValue={currentTenant.settings.invoiceNumbering.nextNumber}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button size="sm" className="gap-1.5">
              <Save className="h-3.5 w-3.5" />
              <span>Update Numbering</span>
            </Button>
          </div>
        </Card>
      )}

      {/* Terms Tab */}
      {activeTab === "terms" && (
        <Card className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Default Terms & Conditions</h3>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Standard Quotation Terms</label>
            <textarea
              rows={4}
              defaultValue={currentTenant.settings.defaultTermsAndConditions}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button size="sm" className="gap-1.5">
              <Save className="h-3.5 w-3.5" />
              <span>Save Terms</span>
            </Button>
          </div>
        </Card>
      )}

      {/* Reminders Tab */}
      {activeTab === "reminders" && (
        <Card className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Payment Follow-up & Reminders</h3>
          <div className="space-y-3 text-xs text-slate-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded text-emerald-600 h-4 w-4" />
              <span>Send automated reminder 3 days before invoice due date</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded text-emerald-600 h-4 w-4" />
              <span>Send reminder on the invoice due date</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded text-emerald-600 h-4 w-4" />
              <span>Send overdue alert 5 days past due date</span>
            </label>
          </div>
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button size="sm" className="gap-1.5">
              <Save className="h-3.5 w-3.5" />
              <span>Save Reminder Rules</span>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
