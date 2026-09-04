"use client";

import React, { useState } from "react";
import { useTenant } from "@/hooks/use-tenant";
import { cn } from "@/lib/utils";
import {
  Building2,
  Hash,
  FileCheck,
  Bell,
  Save,
  QrCode,
  CheckCircle2,
  Phone,
  Mail,
  Smartphone,
  CreditCard,
  Sparkles,
  Info,
  Upload,
  Trash2,
  Image as ImageIcon,
  FileSignature,
} from "lucide-react";

export default function SettingsPage() {
  const { currentTenant, updateTenantProfile, updateTenantSettings } = useTenant();
  const [activeTab, setActiveTab] = useState<
    "profile" | "numbering" | "bank" | "tax" | "reminders"
  >("profile");

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form states initialized clean
  const [businessName, setBusinessName] = useState(currentTenant?.businessName || "");
  const [ownerName, setOwnerName] = useState(currentTenant?.ownerName || "");
  const [phone, setPhone] = useState(currentTenant?.phone || "");
  const [email, setEmail] = useState(currentTenant?.email || "");
  const [gstin, setGstin] = useState(currentTenant?.gstin || "");
  const [address, setAddress] = useState(currentTenant?.address?.street || "");
  const [logoUrl, setLogoUrl] = useState(currentTenant?.logoUrl || currentTenant?.settings?.logoUrl || "");
  const [signatureUrl, setSignatureUrl] = useState(currentTenant?.signatureUrl || currentTenant?.settings?.signatureUrl || "");

  // Numbering states
  const [quotePrefix, setQuotePrefix] = useState(currentTenant?.settings?.quotationNumbering?.prefix || "QT-");
  const [quoteNext, setQuoteNext] = useState(currentTenant?.settings?.quotationNumbering?.nextNumber || 1001);
  const [invPrefix, setInvPrefix] = useState(currentTenant?.settings?.invoiceNumbering?.prefix || "INV-");
  const [invNext, setInvNext] = useState(currentTenant?.settings?.invoiceNumbering?.nextNumber || 1001);

  // Bank & UPI states
  const [bankName, setBankName] = useState(currentTenant?.bankDetails?.bankName || "");
  const [accountNumber, setAccountNumber] = useState(currentTenant?.bankDetails?.accountNumber || "");
  const [ifscCode, setIfscCode] = useState(currentTenant?.bankDetails?.ifscCode || "");
  const [upiId, setUpiId] = useState(currentTenant?.bankDetails?.upiId || "");
  const [reminderTemplate, setReminderTemplate] = useState(
    "Hello {client_name}, this is a friendly reminder from {business_name} regarding pending invoice #{invoice_num} for {balance_due}. Kindly arrange for settlement at your earliest convenience. Thank you!"
  );

  // Sync form inputs when currentTenant loads or updates
  React.useEffect(() => {
    if (currentTenant) {
      setBusinessName(currentTenant.businessName || "");
      setOwnerName(currentTenant.ownerName || "");
      setPhone(currentTenant.phone || "");
      setEmail(currentTenant.email || "");
      setGstin(currentTenant.gstin || "");
      setAddress(currentTenant.address?.street || "");
      setLogoUrl(currentTenant.logoUrl || currentTenant.settings?.logoUrl || "");
      setSignatureUrl(currentTenant.signatureUrl || currentTenant.settings?.signatureUrl || "");
      setQuotePrefix(currentTenant.settings?.quotationNumbering?.prefix || "QT-");
      setQuoteNext(currentTenant.settings?.quotationNumbering?.nextNumber || 1001);
      setInvPrefix(currentTenant.settings?.invoiceNumbering?.prefix || "INV-");
      setInvNext(currentTenant.settings?.invoiceNumbering?.nextNumber || 1001);
      setBankName(currentTenant.bankDetails?.bankName || "");
      setAccountNumber(currentTenant.bankDetails?.accountNumber || "");
      setIfscCode(currentTenant.bankDetails?.ifscCode || "");
      setUpiId(currentTenant.bankDetails?.upiId || "");
    }
  }, [currentTenant]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Logo image size must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setLogoUrl(evt.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Signature image size must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setSignatureUrl(evt.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateTenantProfile({
      businessName,
      ownerName,
      phone,
      email,
      gstin,
      logoUrl,
      signatureUrl,
      address: {
        ...currentTenant.address,
        street: address,
      },
      bankDetails: {
        accountName: businessName,
        accountNumber,
        ifscCode,
        bankName,
        upiId,
      },
    });

    await updateTenantSettings({
      quotationNumbering: {
        ...currentTenant.settings.quotationNumbering,
        prefix: quotePrefix,
        nextNumber: Number(quoteNext),
      },
      invoiceNumbering: {
        ...currentTenant.settings.invoiceNumbering,
        prefix: invPrefix,
        nextNumber: Number(invNext),
      },
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };



  const navTabs = [
    { id: "profile", label: "Business Profile & Branding", Icon: Building2 },
    { id: "numbering", label: "Document Numbering", Icon: Hash },
    { id: "bank", label: "Bank & UPI QR Setup", Icon: QrCode },
    { id: "tax", label: "GST & Tax Rules", Icon: FileCheck },
    { id: "reminders", label: "WhatsApp Reminder Template", Icon: Bell },
  ];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
            <span>Business Settings</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Configure studio details, UPI payment QR codes, document numbering, and automated reminder templates.
          </p>
        </div>

        {savedSuccess && (
          <div className="clay-tag inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold animate-in fade-in-50">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Settings Saved Successfully!</span>
          </div>
        )}
      </div>

      {/* 2-Column Settings Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Mobile Horizontal Pill Track (Hidden on desktop) */}
        <div className="md:hidden flex overflow-x-auto no-scrollbar gap-1.5 p-1 rounded-2xl bg-slate-100/90 border border-slate-200/80 -mx-1 px-1">
          {navTabs.map((tab) => {
            const Icon = tab.Icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                  isActive
                    ? "clay-pill-active text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Icon
                  className={cn(
                    "h-3.5 w-3.5",
                    isActive ? "text-emerald-700" : "text-slate-400"
                  )}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Desktop Left 1 Col: Settings Category Navigation Sidebar (Hidden on mobile) */}
        <div className="hidden md:block clay-card p-3 space-y-1.5">
          {navTabs.map((tab) => {
            const Icon = tab.Icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold text-left transition-all cursor-pointer",
                  isActive
                    ? "clay-pill-active text-slate-900 shadow-xs"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-emerald-700" : "text-slate-400"
                  )}
                />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>


        {/* Right 2 Cols: Active Setting Configuration Card */}
        <div className="md:col-span-2">
          <form onSubmit={handleSave} className="clay-card p-6 sm:p-8 space-y-6">
            {/* TAB 1: Business Profile & Branding */}
            {activeTab === "profile" && (
              <div className="space-y-6 animate-in fade-in-50">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900">
                    Business Profile & Branding
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Official business details printed on top of all quotations, invoices, and receipts.
                  </p>
                </div>

                {/* Brand Assets: Logo & Authorized Signature */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
                    <span className="clay-tag px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Document Branding
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      Business Logo & Authorized Digital Signature
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Business Logo Dropzone */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <ImageIcon className="h-3.5 w-3.5 text-slate-500" />
                          <span>Business Logo</span>
                        </label>
                        <span className="text-[10px] text-slate-400 font-medium">PNG, JPG, SVG</span>
                      </div>

                      {logoUrl ? (
                        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
                          <div className="h-16 w-20 shrink-0 bg-slate-50 rounded-lg border border-slate-100 p-1 flex items-center justify-center overflow-hidden">
                            <img
                              src={logoUrl}
                              alt="Business Logo"
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <p className="text-xs font-bold text-slate-800 truncate">Logo Uploaded</p>
                            <div className="flex items-center gap-2">
                              <label className="cursor-pointer text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline">
                                <span>Change</span>
                                <input
                                  type="file"
                                  accept="image/png, image/jpeg, image/webp, image/svg+xml"
                                  onChange={handleLogoUpload}
                                  className="hidden"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => setLogoUrl("")}
                                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-white cursor-pointer transition-colors group text-center">
                          <Upload className="h-5 w-5 text-slate-400 group-hover:text-emerald-600 mb-1" />
                          <span className="text-xs font-bold text-slate-700 group-hover:text-emerald-700">
                            Upload Business Logo
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">Recommended max height 60px</span>
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/webp, image/svg+xml"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {/* Authorized Signature Dropzone */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <FileSignature className="h-3.5 w-3.5 text-slate-500" />
                          <span>Authorized Signature</span>
                        </label>
                        <span className="text-[10px] text-slate-400 font-medium">Transparent PNG</span>
                      </div>

                      {signatureUrl ? (
                        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
                          <div className="h-16 w-24 shrink-0 bg-slate-50 rounded-lg border border-slate-100 p-1 flex items-center justify-center overflow-hidden">
                            <img
                              src={signatureUrl}
                              alt="Authorized Signature"
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <p className="text-xs font-bold text-slate-800 truncate">Signature Uploaded</p>
                            <div className="flex items-center gap-2">
                              <label className="cursor-pointer text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline">
                                <span>Change</span>
                                <input
                                  type="file"
                                  accept="image/png, image/jpeg, image/webp"
                                  onChange={handleSignatureUpload}
                                  className="hidden"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => setSignatureUrl("")}
                                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-white cursor-pointer transition-colors group text-center">
                          <FileSignature className="h-5 w-5 text-slate-400 group-hover:text-emerald-600 mb-1" />
                          <span className="text-xs font-bold text-slate-700 group-hover:text-emerald-700">
                            Upload Signature / Stamp
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">Appears above Authorized Signatory</span>
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
                            onChange={handleSignatureUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Business / Studio Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Owner / Authorized Signatory <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Phone / WhatsApp Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                    <span>Business GSTIN</span>
                    <span className="text-[10px] text-slate-400 font-medium lowercase">optional</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 27AAACS1429B1Z5 (Leave blank if unregistered)"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm font-semibold text-slate-900 uppercase tracking-wider focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Official Studio / Workshop Address
                  </label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: Document Numbering */}
            {activeTab === "numbering" && (
              <div className="space-y-6 animate-in fade-in-50">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900">
                    Custom Document Numbering Sequences
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Define custom prefixes and automated sequence numbers for quotations and tax invoices.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Quotations Sequence */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="clay-tag px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        Quotations
                      </span>
                      <span className="text-xs font-bold text-slate-900">Quotation Format</span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500">Prefix</label>
                        <input
                          type="text"
                          value={quotePrefix}
                          onChange={(e) => setQuotePrefix(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500">Next Number</label>
                        <input
                          type="number"
                          value={quoteNext}
                          onChange={(e) => setQuoteNext(parseInt(e.target.value) || 0)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 mt-1"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium pt-1">
                        Preview: <span className="font-bold text-slate-900">{quotePrefix}{quoteNext}</span>
                      </p>
                    </div>
                  </div>

                  {/* Invoices Sequence */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="clay-tag px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Invoices
                      </span>
                      <span className="text-xs font-bold text-slate-900">Tax Invoice Format</span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500">Prefix</label>
                        <input
                          type="text"
                          value={invPrefix}
                          onChange={(e) => setInvPrefix(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500">Next Number</label>
                        <input
                          type="number"
                          value={invNext}
                          onChange={(e) => setInvNext(parseInt(e.target.value) || 0)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 mt-1"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium pt-1">
                        Preview: <span className="font-bold text-slate-900">{invPrefix}{invNext}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Bank & UPI QR Setup */}
            {activeTab === "bank" && (
              <div className="space-y-6 animate-in fade-in-50">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900">
                    Bank Account & Dynamic UPI QR Code
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    This UPI ID and Bank Account will be automatically printed on customer invoices for instant payments.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        UPI ID / VPA <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. royalevents@okhdfcbank"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Account Number
                        </label>
                        <input
                          type="text"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          IFSC Code
                        </label>
                        <input
                          type="text"
                          value={ifscCode}
                          onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-semibold text-slate-900 uppercase focus:bg-white focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Live UPI QR Code Card */}
                  <div className="clay-card p-5 text-center bg-gradient-to-br from-emerald-50/40 via-white to-teal-50/20 flex flex-col items-center justify-center space-y-3">
                    <span className="clay-tag px-2.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Live Invoice QR Preview
                    </span>
                    <div className="h-32 w-32 bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex items-center justify-center">
                      <QrCode className="h-24 w-24 text-slate-900" />
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      <span>UPI: </span>
                      <span className="text-emerald-700 font-mono">{upiId}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium max-w-xs">
                      Customers will scan this QR to pay directly from Google Pay, PhonePe, or Paytm.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: GST & Tax Rules */}
            {activeTab === "tax" && (
              <div className="space-y-6 animate-in fade-in-50">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900">
                    GST & Tax Invoicing Rules
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    GST calculations are 100% optional. Businesses can operate with or without tax rules enabled.
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked={currentTenant.settings.enableGstByDefault}
                      className="rounded text-emerald-600 h-4 w-4 mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Enable GST by Default on New Quotations & Invoices
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                        When checked, a default 18% GST calculation is pre-selected (you can still toggle it off anytime).
                      </span>
                    </div>
                  </label>

                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Standard Default Terms & Conditions
                    </label>
                    <textarea
                      rows={4}
                      defaultValue={currentTenant.settings.defaultTermsAndConditions}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none font-medium"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: WhatsApp Reminder Templates */}
            {activeTab === "reminders" && (
              <div className="space-y-6 animate-in fade-in-50">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900">
                    1-Click WhatsApp Reminder Template
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Customize the message sent when you click &ldquo;Send Reminder&rdquo; on overdue clients or dashboard alerts.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      WhatsApp Message Template
                    </label>
                    <textarea
                      rows={4}
                      value={reminderTemplate}
                      onChange={(e) => setReminderTemplate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none font-medium leading-relaxed"
                    />
                  </div>

                  {/* Available Dynamic Tags */}
                  <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-bold text-slate-500">
                    <span>Available Dynamic Tags:</span>
                    {["{client_name}", "{business_name}", "{invoice_num}", "{balance_due}"].map((tag) => (
                      <span
                        key={tag}
                        className="clay-tag px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200/80 cursor-pointer"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Live Template Message Preview */}
                  <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-teal-800">
                      Live Customer Preview
                    </span>
                    <p className="text-xs text-teal-950 font-medium leading-relaxed">
                      &ldquo;Hello <strong>Rahul Sharma</strong>, this is a friendly reminder from{" "}
                      <strong>Royal Events</strong> regarding pending invoice <strong>#INV-1024</strong> for{" "}
                      <strong>₹60,000</strong>. Kindly arrange for settlement at your earliest convenience. Thank you!&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
              <button
                type="submit"
                className="clay-btn-emerald inline-flex items-center gap-2 h-11 px-6 font-bold text-xs sm:text-sm rounded-2xl cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Save Settings Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
