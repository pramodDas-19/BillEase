"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
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
} from "lucide-react";

export default function NewClientPage() {
  const router = useRouter();

  // Form State
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gstin, setGstin] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("Maharashtra");
  const [address, setAddress] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>(["Corporate Event"]);
  const [customTagInput, setCustomTagInput] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);

  const availableTags = [
    "Corporate Event",
    "Wedding Planner",
    "Printing",
    "Flex Banners",
    "VIP",
    "Exhibition",
  ];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags((prev) => [...prev, trimmed]);
      setCustomTagInput("");
      setIsAddingTag(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, persists via ClientService / API
    router.push("/clients");
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

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} className="clay-card p-6 sm:p-8 space-y-6">
        {/* Client Name & Company Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Contact / Client Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>Company / Brand Name</span>
              <span className="text-[10px] text-slate-400 font-medium lowercase">optional</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Sharma Tech Solutions Pvt Ltd"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Phone & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Phone / WhatsApp <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>Email Address</span>
              <span className="text-[10px] text-slate-400 font-medium lowercase">optional</span>
            </label>
            <div className="relative">
              <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="client@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* GSTIN & Tax Details (100% Optional) */}
        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
            <span>Client GSTIN</span>
            <span className="text-[10px] text-slate-400 font-medium lowercase">
              100% optional (leave blank for retail/individual clients)
            </span>
          </label>
          <input
            type="text"
            placeholder="e.g. 27AAACS1429B1Z5"
            value={gstin}
            onChange={(e) => setGstin(e.target.value.toUpperCase())}
            maxLength={15}
            className="w-full uppercase tracking-wider rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm font-semibold text-slate-900 placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>

        {/* Billing Address (Optional) */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
            <span>Billing / Delivery Address</span>
            <span className="text-[10px] text-slate-400 font-medium lowercase">optional</span>
          </label>
          <textarea
            rows={2}
            placeholder="Street address, city, state, pincode..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
          />
        </div>


        {/* Client Tags / Categories */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
            <span>Tags & Segment</span>
            <span className="text-[10px] text-slate-400 font-medium lowercase">optional</span>
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {availableTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  type="button"
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "clay-tag px-3 py-1 text-xs font-bold transition-all cursor-pointer",
                    isSelected
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70"
                  )}
                >
                  {tag}
                </button>
              );
            })}

            {/* Custom Tag Adder */}
            {!isAddingTag ? (
              <button
                type="button"
                onClick={() => setIsAddingTag(true)}
                className="clay-tag px-3 py-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50/70 border border-emerald-200/70 inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                <span>+ Custom Tag</span>
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  autoFocus
                  placeholder="Tag name"
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomTag();
                    }
                  }}
                  className="rounded-lg border border-emerald-500 px-2 py-1 text-xs font-bold text-slate-900 focus:outline-none"
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
        <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
          <Link href="/clients">
            <button
              type="button"
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </Link>
          <button
            type="submit"
            className="clay-btn-emerald inline-flex items-center gap-2 h-11 px-6 font-bold text-xs sm:text-sm rounded-2xl cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>Save Client Profile</span>
          </button>
        </div>
      </form>
    </div>
  );
}
