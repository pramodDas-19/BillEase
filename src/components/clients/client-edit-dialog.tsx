"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Client } from "@/types";
import { ClientService } from "@/services/client.service";
import { Input } from "@/components/ui/input";
import { Edit3, X, Save, User, Tag, Plus, AlertCircle } from "lucide-react";
import { validateClient } from "@/validations/client.schema";
import { GST_STATE_CODES } from "@/lib/gst-engine";
import { cn } from "@/lib/utils";

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
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
      setFieldErrors({});
      setErrorNotice(null);
    }
  }, [client]);

  const detectedState = useMemo(() => {
    if (gstin && gstin.trim().length >= 2) {
      const code = gstin.trim().substring(0, 2);
      return GST_STATE_CODES[code] ? { code, name: GST_STATE_CODES[code] } : null;
    }
    return null;
  }, [gstin]);

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
    setErrorNotice(null);

    const validationErrors = validateClient({
      name,
      companyName,
      phone,
      email,
      gstin,
    });

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setErrorNotice("Please resolve the highlighted field errors before saving.");
      return;
    }

    setFieldErrors({});
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
    } catch (err: any) {
      console.error("Failed to update client:", err);
      setErrorNotice(err?.message || "Failed to update client profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50 duration-200">
      <div className="clay-card relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-5 sm:p-8 shadow-2xl border border-slate-200/90 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="clay-icon-squircle p-2.5 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200">
              <User className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
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

        {/* Global Error Banner */}
        {errorNotice && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-50 p-3 flex items-start gap-2 text-rose-800 text-xs font-semibold">
            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{errorNotice}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Client Name *"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: "" }));
                }}
                required
                className={cn(
                  "rounded-xl font-semibold",
                  fieldErrors.name && "border-rose-500 focus:ring-rose-500/20"
                )}
              />
              {fieldErrors.name && (
                <p className="text-[11px] text-rose-500 font-semibold mt-1">{fieldErrors.name}</p>
              )}
            </div>

            <div>
              <Input
                label="WhatsApp Phone *"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: "" }));
                }}
                required
                className={cn(
                  "rounded-xl font-semibold",
                  fieldErrors.phone && "border-rose-500 focus:ring-rose-500/20"
                )}
              />
              {fieldErrors.phone && (
                <p className="text-[11px] text-rose-500 font-semibold mt-1">{fieldErrors.phone}</p>
              )}
            </div>
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
            <div>
              <Input
                label="Email Address"
                type="email"
                placeholder="client@domain.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
                }}
                className={cn(
                  "rounded-xl font-semibold",
                  fieldErrors.email && "border-rose-500 focus:ring-rose-500/20"
                )}
              />
              {fieldErrors.email && (
                <p className="text-[11px] text-rose-500 font-semibold mt-1">{fieldErrors.email}</p>
              )}
            </div>
          </div>

          {/* Row 3: GSTIN & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Client GSTIN (optional)"
                placeholder="27AAAAA0000A1Z5"
                value={gstin}
                onChange={(e) => {
                  setGstin(e.target.value.toUpperCase());
                  if (fieldErrors.gstin) setFieldErrors((prev) => ({ ...prev, gstin: "" }));
                }}
                maxLength={15}
                className={cn(
                  "rounded-xl font-semibold uppercase",
                  fieldErrors.gstin && "border-rose-500 focus:ring-rose-500/20"
                )}
              />
              {detectedState && (
                <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 w-fit">
                  <span>📍 State: {detectedState.name} ({detectedState.code})</span>
                </div>
              )}
              {fieldErrors.gstin && (
                <p className="text-[11px] text-rose-500 font-semibold mt-1">{fieldErrors.gstin}</p>
              )}
            </div>

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

          {/* Action Buttons (Sticky & full width on mobile) */}
          <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 sticky bottom-0 bg-white pb-1">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto clay-btn-emerald inline-flex items-center justify-center gap-2 px-6 py-2.5 min-h-[44px] rounded-xl text-xs sm:text-sm font-bold text-white shadow-md cursor-pointer"
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
