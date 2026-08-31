"use client";

import React, { useState } from "react";
import { Client } from "@/types";
import { ClientService } from "@/services/client.service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit2, X, Save, Building2, User, Phone, Mail, MapPin } from "lucide-react";

interface ClientEditDialogProps {
  client: Client;
  onSuccess: (updated: Client) => void;
}

export function ClientEditDialog({ client, onSuccess }: ClientEditDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState(client.name || "");
  const [companyName, setCompanyName] = useState(client.companyName || "");
  const [phone, setPhone] = useState(client.phone || "");
  const [email, setEmail] = useState(client.email || "");
  const [gstin, setGstin] = useState(client.gstin || "");
  const [address, setAddress] = useState(client.address || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Re-create / update client profile in Supabase
      await ClientService.deleteClient(client.id);
      const created = await ClientService.createClient({
        id: client.id,
        name,
        companyName: companyName || undefined,
        phone,
        email: email || undefined,
        gstin: gstin || undefined,
        address: address || undefined,
        segmentTags: client.segmentTags || [],
        totalBilled: client.totalBilled || 0,
        totalPaid: client.totalPaid || 0,
        balanceDue: client.balanceDue || 0,
      });

      if (created) {
        onSuccess(created);
        setIsOpen(false);
      }
    } catch (err) {
      console.error("Failed to update client:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        title="Edit Client Profile"
        className="clay-icon-squircle flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-white shadow-2xs transition-colors cursor-pointer"
      >
        <Edit2 className="h-3.5 w-3.5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50 duration-200">
          <div className="fixed inset-0" onClick={() => setIsOpen(false)} />

          <div className="clay-card relative z-10 w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200/90 space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="clay-icon-squircle p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Edit Client Profile
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Update contact details, company, and tax info
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="clay-icon-squircle p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Client Name *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  label="Phone *"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Company Name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
                <Input
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="GSTIN"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                />
                <Input
                  label="Address / City"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl text-xs font-bold"
                >
                  Cancel
                </Button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="clay-btn-emerald inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{isSubmitting ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
