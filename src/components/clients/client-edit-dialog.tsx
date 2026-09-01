"use client";

import React, { useState, useEffect } from "react";
import { Client } from "@/types";
import { ClientService } from "@/services/client.service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit3, X, Save, User, Tag, Plus } from "lucide-react";

interface ClientEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onClientUpdated: (updated: Client) => void;
}

export function ClientEditDialog({
  isOpen,
  onClose,
  client,
  onClientUpdated,
}: ClientEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gstin, setGstin] = useState("");
  const [address, setAddress] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");

  useEffect(() => {
    if (client) {
      setName(client.name || "");
      setCompanyName(client.companyName || "");
      setPhone(client.phone || "");
      setEmail(client.email || "");
      setGstin(client.gstin || "");
      setAddress(client.address || "");
      setTags(client.segmentTags || []);
      setNewTagInput("");
    }
  }, [client]);

  if (!isOpen || !client) return null;

  const handleAddTag = () => {
    const trimmed = newTagInput.trim().toUpperCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updated = await ClientService.updateClient(client.id, {
        name: name.trim(),
        companyName: companyName.trim() || undefined,
        phone: phone.trim(),
        email: email.trim() || undefined,
        gstin: gstin.trim().toUpperCase() || undefined,
        address: address.trim() || undefined,
        segmentTags: tags,
      });

      if (updated) {
        onClientUpdated(updated);
        onClose();
      } else {
        onClientUpdated({
          ...client,
          name: name.trim(),
          companyName: companyName.trim() || undefined,
          phone: phone.trim(),
          email: email.trim() || undefined,
          gstin: gstin.trim().toUpperCase() || undefined,
          address: address.trim() || undefined,
          segmentTags: tags,
        });
        onClose();
      }
    } catch (err) {
      console.error("Failed to update client:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50 duration-200">
      <div className="clay-card relative z-10 w-full max-w-xl bg-white rounded-3xl p-7 sm:p-8 shadow-2xl border border-slate-200/90 space-y-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="clay-icon-squircle p-2.5 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200">
              <User className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Edit Client Profile
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Update client contact details, company, GST, and tags.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Client Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-xl font-semibold"
            />
            <Input
              label="WhatsApp Phone *"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="rounded-xl font-semibold"
            />
          </div>

          {/* Row 2: Company & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Company Name"
              placeholder="e.g. Acme Corp"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="rounded-xl font-semibold"
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="client@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl font-semibold"
            />
          </div>

          {/* Row 3: GSTIN & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Client GSTIN (optional)"
              placeholder="27AAAAA0000A1Z5"
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
              className="rounded-xl font-semibold uppercase"
            />
            <Input
              label="Billing Address / City"
              placeholder="Street, City, State"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="rounded-xl font-semibold"
            />
          </div>

          {/* Row 4: Client Segment Tags */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Tag className="h-3 w-3 text-slate-400" />
              <span>Tags</span>
            </label>

            <div className="flex flex-wrap items-center gap-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="clay-tag inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200/80 rounded-lg"
                >
                  <span>{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="text-blue-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </span>
              ))}

              <div className="inline-flex items-center gap-1">
                <input
                  type="text"
                  placeholder="+ Add Tag"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="w-24 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none uppercase"
                />
                {newTagInput && (
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="p-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="clay-btn-emerald inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
