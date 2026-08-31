"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";

import { ClientService } from "@/services/client.service";
import { InvoiceService } from "@/services/invoice.service";
import { Client, Invoice } from "@/types";
import { cn, formatCurrency } from "@/lib/utils";
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  Building2,
  MapPin,
  FileText,
  ReceiptText,
  ArrowUpRight,
  MessageSquare,
  LayoutGrid,
  List,
  CheckCircle2,
  Clock,
  Filter,
  Trash2,
  BellRing,
} from "lucide-react";

export default function ClientsPage() {
  const [clientsList, setClientsList] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [clientsData, invoicesData] = await Promise.all([
          ClientService.getClients(),
          InvoiceService.getInvoices(),
        ]);

        const enrichedClients = (clientsData || []).map((client) => {
          const clientInvoices = (invoicesData || []).filter(
            (inv) => inv.clientId === client.id || inv.clientName === client.name
          );
          const totalBilled = clientInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
          const balanceDue = clientInvoices.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);

          return {
            ...client,
            totalBilled: totalBilled || client.totalBilled || 0,
            balanceDue: balanceDue !== undefined ? balanceDue : client.balanceDue || 0,
          };
        });

        setClientsList(enrichedClients);
      } catch (err) {
        console.error("Failed to load clients and invoices:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);


  // Metrics computation
  const totalClients = clientsList.length;
  const totalBilled = clientsList.reduce((acc, c) => acc + (c.totalBilled || 0), 0);
  const totalOutstanding = clientsList.reduce((acc, c) => acc + (c.balanceDue || 0), 0);

  const handleDeleteClient = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete client "${name}"?`)) {
      setClientsList((prev) => prev.filter((c) => c.id !== id));
      await ClientService.deleteClient(id);
    }
  };


  // Filter and search logic
  const filteredClients = useMemo(() => {
    return clientsList.filter((client) => {
      // Search match
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        client.name.toLowerCase().includes(query) ||
        (client.companyName && client.companyName.toLowerCase().includes(query)) ||
        client.phone.includes(query) ||
        (client.email && client.email.toLowerCase().includes(query)) ||
        (client.gstin && client.gstin.toLowerCase().includes(query)) ||
        (client.address && client.address.toLowerCase().includes(query)) ||
        (client.city && client.city.toLowerCase().includes(query));

      // Financial status filter
      let matchesFilter = true;
      if (selectedFilter === "due") {
        matchesFilter = (client.balanceDue || 0) > 0;
      } else if (selectedFilter === "settled") {
        matchesFilter = (client.balanceDue || 0) === 0;
      }

      return matchesSearch && matchesFilter;
    });
  }, [clientsList, searchQuery, selectedFilter]);


  const filterOptions = [
    { id: "all", label: "All Clients" },
    { id: "has_balance", label: "With Balance Due" },
    { id: "settled", label: "Settled" },
  ];


  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
            <span>Clients & Directory</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Manage your client contacts, GST details, billing ledger, and transaction pipeline.
          </p>
        </div>

        <Link href="/clients/new">
          <button className="clay-btn-primary inline-flex items-center gap-2 h-11 px-5 font-bold text-xs sm:text-sm rounded-2xl cursor-pointer">
            <UserPlus className="h-4 w-4 text-emerald-400" />
            <span>Add New Client</span>
          </button>
        </Link>
      </div>

      {/* 3 Quick Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        {/* Total Clients */}
        <div className="clay-card p-5 bg-gradient-to-br from-slate-50/80 via-white to-blue-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Clients
            </span>
            <div className="clay-icon-squircle p-2.5 bg-slate-100 text-slate-700 border border-slate-200/80">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-[28px] font-bold text-slate-900">
              {totalClients}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Active client accounts
            </p>
          </div>
        </div>

        {/* Total Lifetime Invoiced */}
        <div className="clay-card p-5 bg-gradient-to-br from-emerald-50/30 via-white to-teal-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Invoiced
            </span>
            <div className="clay-icon-squircle p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-200/80">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-[28px] font-bold text-slate-900">
              {formatCurrency(totalBilled, "INR")}
            </h3>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">
              Cumulative lifetime billed
            </p>
          </div>
        </div>

        {/* Total Outstanding Receivables */}
        <div className="clay-card p-5 bg-gradient-to-br from-amber-50/30 via-white to-orange-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Outstanding Receivables
            </span>
            <div className="clay-icon-squircle p-2.5 bg-amber-50 text-amber-600 border border-amber-200/80">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-[28px] font-bold text-amber-700">
              {formatCurrency(totalOutstanding, "INR")}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Awaiting client settlement
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar, Filter Chips & View Mode Switcher */}
      <div className="clay-card p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search clients by name, company, phone, GSTIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200/80 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills & View Mode */}
        <div className="flex items-center justify-between md:justify-end gap-3 flex-wrap">
          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {filterOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelectedFilter(opt.id)}
                className={cn(
                  "clay-tag px-3 py-1 text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                  selectedFilter === opt.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle: Grid vs Table */}
          <div className="hidden sm:flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200/60 shadow-inner shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              title="Grid View"
              className={cn(
                "p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                viewMode === "grid"
                  ? "clay-pill-active text-slate-900"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              title="Table View"
              className={cn(
                "p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                viewMode === "table"
                  ? "clay-pill-active text-slate-900"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Client List Content */}
      {filteredClients.length === 0 ? (
        /* Empty State */
        <div className="clay-card p-12 text-center">
          <div className="clay-icon-squircle mx-auto h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No clients found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            We couldn&apos;t find any clients matching &ldquo;{searchQuery}&rdquo;. Try checking the spelling or resetting the filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedFilter("all");
            }}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors"
          >
            Clear Search & Filters
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* ============================================================ */
        /* GRID VIEW: Tactile Neo-Clay Client Cards                     */
        /* ============================================================ */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map((client) => {
            const cleanPhone = client.phone.replace(/[^0-9]/g, "");

            return (
              <div
                key={client.id}
                className="clay-card p-5 flex flex-col justify-between group hover:border-slate-300 transition-all"
              >
                <div>
                  {/* Card Header: Avatar Initial + Name & Direct Communication Buttons */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="clay-icon-squircle h-10 w-10 rounded-2xl bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {client.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/clients/${client.id}`}
                          className="text-sm font-bold text-slate-900 hover:text-emerald-700 transition-colors truncate block"
                        >
                          {client.name}
                        </Link>
                        {client.companyName && (
                          <p className="text-xs text-slate-500 font-medium truncate flex items-center gap-1 mt-0.5">
                            <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate">{client.companyName}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Direct Contact Actions (Call, WhatsApp & Delete) */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Green Call Button */}
                      <a
                        href={`tel:${client.phone}`}
                        title={`Call ${client.name} (${client.phone})`}
                        className="clay-icon-squircle flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 shadow-2xs transition-all cursor-pointer"
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </a>

                      {/* WhatsApp Button */}
                      <a
                        href={`https://wa.me/${cleanPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`WhatsApp ${client.name}`}
                        className="clay-icon-squircle flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-600 hover:text-white hover:border-teal-600 shadow-2xs transition-all cursor-pointer"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </a>

                      {/* Delete Client Button (Red Claymorphism) */}
                      <button
                        onClick={() => handleDeleteClient(client.id, client.name)}
                        title={`Delete ${client.name}`}
                        className="clay-icon-squircle flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 shadow-2xs transition-all cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>


                  </div>

                  {/* Contact Info & Location */}
                  <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                    <p className="flex items-center gap-2 font-medium">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{client.phone}</span>
                    </p>
                    {client.email && (
                      <p className="flex items-center gap-2 font-medium truncate">
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </p>
                    )}
                    {(client.city || client.state || client.address) && (
                      <p className="flex items-center gap-2 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {[client.address, client.city, client.state].filter(Boolean).join(", ")}
                        </span>
                      </p>
                    )}

                  </div>

                  {/* GSTIN Badge & Category Tags */}
                  <div className="mt-3.5 flex items-center gap-1.5 flex-wrap">
                    {client.gstin ? (
                      <span className="clay-tag inline-flex items-center px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80">
                        GST: {client.gstin}
                      </span>
                    ) : (
                      <span className="clay-tag inline-flex items-center px-2 py-0.5 text-[10px] font-semibold bg-slate-50 text-slate-400 border border-slate-200/60">
                        Unregistered Consumer
                      </span>
                    )}

                    {(client.segmentTags || client.tags || []).slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="clay-tag inline-flex items-center px-2 py-0.5 text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200/60"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Financial Metrics & Quick Actions */}
                <div className="mt-5 pt-3.5 border-t border-slate-100">
                  {/* Financial Summary */}
                  <div className="flex items-center justify-between text-xs mb-3">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400">
                        Total Billed
                      </span>
                      <span className="text-sm font-extrabold text-slate-900">
                        {formatCurrency(client.totalBilled || 0, "INR")}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="block text-[10px] uppercase font-bold text-slate-400">
                        Balance Due
                      </span>
                      <span
                        className={cn(
                          "text-sm font-extrabold",
                          (client.balanceDue || 0) > 0 ? "text-amber-700" : "text-emerald-700"
                        )}
                      >
                        {(client.balanceDue || 0) > 0 ? formatCurrency(client.balanceDue || 0, "INR") : "Settled"}
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Links */}
                  <div className="grid grid-cols-2 gap-2">
                    {(client.balanceDue || 0) > 0 ? (
                      /* Overdue Client: Show Send Reminder + Invoice */
                      <>
                        <a
                          href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                            `Hello ${client.name}, this is a friendly reminder regarding your outstanding balance of ${formatCurrency(client.balanceDue || 0, "INR")}. Kindly arrange for settlement at your convenience. Thank you!`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="clay-tag flex items-center justify-center gap-1.5 py-2 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs transition-all cursor-pointer"
                        >
                          <BellRing className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
                          <span>Remind</span>
                        </a>


                        <Link
                          href={`/invoices/new?clientId=${client.id}`}
                          className="clay-tag flex items-center justify-center gap-1.5 py-2 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors"
                        >
                          <ReceiptText className="h-3.5 w-3.5 text-emerald-600" />
                          <span>+ Invoice</span>
                        </Link>
                      </>
                    ) : (
                      /* Settled Client: Show Quote + Invoice */
                      <>
                        <Link
                          href={`/quotations/new?clientId=${client.id}`}
                          className="clay-tag flex items-center justify-center gap-1.5 py-2 text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 transition-colors"
                        >
                          <FileText className="h-3.5 w-3.5 text-blue-600" />
                          <span>+ Quote</span>
                        </Link>

                        <Link
                          href={`/invoices/new?clientId=${client.id}`}
                          className="clay-tag flex items-center justify-center gap-1.5 py-2 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors"
                        >
                          <ReceiptText className="h-3.5 w-3.5 text-emerald-600" />
                          <span>+ Invoice</span>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      ) : (
        /* ============================================================ */
        /* TABLE VIEW: Compact dense view for large client lists       */
        /* ============================================================ */
        <div className="clay-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Client / Company</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Location & GST</th>
                  <th className="py-3.5 px-4 text-right">Total Invoiced</th>
                  <th className="py-3.5 px-4 text-right">Balance Due</th>
                  <th className="py-3.5 px-4 text-center">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.map((client) => {
                  const cleanPhone = client.phone.replace(/[^0-9]/g, "");

                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Name & Company */}
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/clients/${client.id}`}
                          className="font-bold text-slate-900 hover:text-emerald-700 text-sm block"
                        >
                          {client.name}
                        </Link>
                        {client.companyName && (
                          <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                            {client.companyName}
                          </span>
                        )}
                      </td>

                      {/* Phone & Email */}
                      <td className="py-3.5 px-4 space-y-0.5 font-medium">
                        <p className="text-slate-800">{client.phone}</p>
                        {client.email && (
                          <p className="text-slate-400 text-[11px] truncate">{client.email}</p>
                        )}
                      </td>

                      {/* Location & GSTIN */}
                      <td className="py-3.5 px-4 space-y-1">
                        <p className="text-slate-700 font-semibold">
                          {client.city}, {client.state}
                        </p>
                        {client.gstin ? (
                          <span className="clay-tag inline-block px-1.5 py-0.2 text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200/80">
                            {client.gstin}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Unregistered</span>
                        )}
                      </td>

                      {/* Total Invoiced */}
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 text-sm">
                        {formatCurrency(client.totalBilled || 0, "INR")}
                      </td>

                      {/* Balance Due */}
                      <td className="py-3.5 px-4 text-right font-extrabold text-sm">
                        <span
                          className={
                            (client.balanceDue || 0) > 0 ? "text-amber-700" : "text-emerald-700"
                          }
                        >
                          {(client.balanceDue || 0) > 0 ? formatCurrency(client.balanceDue || 0, "INR") : "Settled"}
                        </span>
                      </td>

                      {/* Quick Communication & Billing Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <a
                            href={`tel:${client.phone}`}
                            title={`Call ${client.name}`}
                            className="clay-icon-squircle p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors"
                          >
                            <Phone className="h-3 w-3" />
                          </a>
                          <a
                            href={`https://wa.me/${cleanPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`WhatsApp ${client.name}`}
                            className="clay-icon-squircle p-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white transition-colors"
                          >
                            <MessageSquare className="h-3 w-3" />
                          </a>
                          {/* WhatsApp Reminder for Overdue Clients */}
                          {(client.balanceDue || 0) > 0 && (
                            <a
                              href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                                `Hello ${client.name}, this is a friendly reminder regarding your outstanding balance of ${formatCurrency(client.balanceDue || 0, "INR")}. Kindly arrange for settlement at your convenience. Thank you!`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`Send WhatsApp Reminder`}
                              className="clay-icon-squircle p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white transition-colors"
                            >
                              <BellRing className="h-3 w-3" />
                            </a>
                          )}

                          <Link
                            href={`/invoices/new?clientId=${client.id}`}
                            title="Create Invoice"
                            className="clay-icon-squircle p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-900 hover:text-white transition-colors"
                          >
                            <ReceiptText className="h-3 w-3" />
                          </Link>

                          <Link
                            href={`/clients/${client.id}`}
                            title="View Client Ledger"
                            className="clay-icon-squircle p-1.5 rounded-lg bg-slate-50 text-slate-500 hover:text-slate-900 transition-colors"
                          >
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                          <button
                            onClick={() => handleDeleteClient(client.id, client.name)}
                            title={`Delete ${client.name}`}
                            className="clay-icon-squircle p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>


                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
