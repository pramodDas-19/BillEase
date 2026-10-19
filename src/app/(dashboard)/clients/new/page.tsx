"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClientService } from "@/services/client.service";
import { useTenant } from "@/hooks/use-tenant";
import { cn } from "@/lib/utils";
import { validateClient } from "@/validations/client.schema";
import { GST_STATE_CODES } from "@/lib/gst-engine";

import {
  ArrowLeft,
  UserPlus,
  Save,
  Phone,
  Mail,
  Building2,
  MapPin,
  FileCheck2,
  Tag,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function NewClientPage() {
  const router = useRouter();
  const { currentTenant } = useTenant();

  // Form State
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gstin, setGstin] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadExistingTags() {
      try {
        const clients = await ClientService.getClients();
        const tagsSet = new Set<string>();
        clients.forEach((c) => {
          if (c.segmentTags && Array.isArray(c.segmentTags)) {
            c.segmentTags.forEach((t) => tagsSet.add(t));
          }
        });
        setAvailableTags(Array.from(tagsSet));
      } catch (err) {
        console.warn("Could not load existing tags:", err);
      }
    }
    loadExistingTags();
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags((prev) => [...prev, trimmed]);
      if (!availableTags.includes(trimmed)) {
        setAvailableTags((prev) => [...prev, trimmed]);
      }
      setCustomTagInput("");
      setIsAddingTag(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const detectedState = React.useMemo(() => {
    if (gstin && gstin.trim().length >= 2) {
      const code = gstin.trim().substring(0, 2);
      return GST_STATE_CODES[code] ? { code, name: GST_STATE_CODES[code] } : null;
    }
    return null;
  }, [gstin]);

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
      setErrorNotice("Please resolve the highlighted field errors before continuing.");
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const created = await ClientService.createClient({
        tenantId: currentTenant?.id,
        name: name.trim(),
        companyName: companyName.trim() || undefined,
        phone: phone.trim(),
        email: email.trim() || undefined,
        gstin: gstin.trim().toUpperCase() || undefined,
        address: address.trim() || city.trim() || undefined,
        segmentTags: selectedTags,
        totalBilled: 0,
        totalPaid: 0,
        balanceDue: 0,
      });

      if (!created) {
        setErrorNotice("Could not save client to database. Please verify your connection and try again.");
        setIsSubmitting(false);
        return;
      }

      router.push("/clients");
    } catch (err: any) {
      console.error("Failed to create client:", err);
      setErrorNotice(err.message || "Failed to create client");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl animate-in fade-in-50 duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/clients"
            className="clay-icon-squircle p-2 text-slate-500 hover:text-slate-900 bg-slate-50 border border-slate-200/80 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Add New Client
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
              Create a client contact profile for fast quotations, invoices, and payment follow-ups.
            </p>
          </div>
        </div>
      </div>

      {/* Error Alert Banner */}
      {errorNotice && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-50 p-4 flex items-start gap-3 text-rose-800 text-xs font-semibold animate-in fade-in-50">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-rose-900">Could not save client</p>
            <p className="mt-0.5">{errorNotice}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorNotice(null)}
            className="text-rose-500 hover:text-rose-700 text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} className="clay-card p-6 sm:p-8 space-y-6">
        {/* Client Name & Company Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Contact / Client Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Ramesh Patel"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: "" }));
                }}
                required
                className={cn(
                  "w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 shadow-2xs",
                  fieldErrors.name
                    ? "border-rose-500 focus:ring-rose-500/20"
                    : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                )}
              />
            </div>
            {fieldErrors.name && (
              <p className="text-xs text-rose-500 font-semibold mt-1">{fieldErrors.name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>Company / Organization</span>
              <span className="text-[10px] text-slate-400 font-medium lowercase">optional</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Patel Traders Ltd"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 font-semibold placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Phone & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              WhatsApp Phone <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone className="h-4 w-4" />
              </div>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: "" }));
                }}
                required
                className={cn(
                  "w-full rounded-xl border bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 shadow-2xs",
                  fieldErrors.phone
                    ? "border-rose-500 focus:ring-rose-500/20"
                    : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                )}
              />
            </div>
            {fieldErrors.phone && (
              <p className="text-xs text-rose-500 font-semibold mt-1">{fieldErrors.phone}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>Email Address</span>
              <span className="text-[10px] text-slate-400 font-medium lowercase">optional</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                placeholder="client@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
                }}
                className={cn(
                  "w-full rounded-xl border bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 shadow-2xs",
                  fieldErrors.email
                    ? "border-rose-500 focus:ring-rose-500/20"
                    : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                )}
              />
            </div>
            {fieldErrors.email && (
              <p className="text-xs text-rose-500 font-semibold mt-1">{fieldErrors.email}</p>
            )}
          </div>
        </div>

        {/* GSTIN & Billing Address */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>GSTIN Number</span>
              <span className="text-[10px] text-slate-400 font-medium lowercase">optional</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <FileCheck2 className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="27AAAAA0000A1Z5"
                value={gstin}
                onChange={(e) => {
                  setGstin(e.target.value.toUpperCase());
                  if (fieldErrors.gstin) setFieldErrors((prev) => ({ ...prev, gstin: "" }));
                }}
                maxLength={15}
                className={cn(
                  "w-full rounded-xl border bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 shadow-2xs uppercase",
                  fieldErrors.gstin
                    ? "border-rose-500 focus:ring-rose-500/20"
                    : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                )}
              />
            </div>
            {detectedState && (
              <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 w-fit">
                <span>📍 State: {detectedState.name} ({detectedState.code})</span>
              </div>
            )}
            {fieldErrors.gstin && (
              <p className="text-xs text-rose-500 font-semibold mt-1">{fieldErrors.gstin}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>City / Region</span>
              <span className="text-[10px] text-slate-400 font-medium lowercase">optional</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <MapPin className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="e.g. Mumbai, Maharashtra"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 font-semibold placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Full Address */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
            <span>Full Billing Address</span>
            <span className="text-[10px] text-slate-400 font-medium lowercase">optional</span>
          </label>
          <textarea
            rows={2}
            placeholder="Street address, building, suite..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 font-semibold placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs resize-none"
          />
        </div>

        {/* Dynamic User Tags Section */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
            <span>Tags & Segment</span>
            <span className="text-[10px] text-slate-400 font-medium lowercase">optional</span>
          </label>

          <div className="flex items-center gap-2 flex-wrap min-h-[36px]">
            {/* Selected Tags */}
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className="clay-tag px-3 py-1 text-xs font-bold bg-slate-900 text-white shadow-xs inline-flex items-center gap-1.5 rounded-lg"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-slate-400 hover:text-white cursor-pointer ml-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

            {/* Previously used tags that aren't currently selected */}
            {availableTags
              .filter((t) => !selectedTags.includes(t))
              .map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className="clay-tag px-3 py-1 text-xs font-bold bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70 transition-all cursor-pointer rounded-lg"
                >
                  + {tag}
                </button>
              ))}

            {/* Custom Tag Adder */}
            {!isAddingTag ? (
              <button
                type="button"
                onClick={() => setIsAddingTag(true)}
                className="clay-tag px-3 py-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 border border-emerald-200/80 inline-flex items-center gap-1 cursor-pointer rounded-lg"
              >
                <Plus className="h-3 w-3" />
                <span>Add Custom Tag</span>
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. VIP, Wholesale, Regular"
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomTag();
                    }
                  }}
                  className="rounded-lg border border-emerald-500 px-2.5 py-1 text-xs font-bold text-slate-900 focus:outline-none shadow-2xs"
                />
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  className="clay-btn-emerald px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingTag(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 px-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-5 border-t border-slate-100">
          <Link href="/clients" className="w-full sm:w-auto">
            <button
              type="button"
              className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto clay-btn-emerald inline-flex items-center justify-center gap-2 min-h-[44px] px-6 font-bold text-xs sm:text-sm rounded-2xl cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>{isSubmitting ? "Saving Client..." : "Save Client Profile"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
