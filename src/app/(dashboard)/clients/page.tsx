"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";

import { ClientService } from "@/services/client.service";
import { InvoiceService } from "@/services/invoice.service";
import { ClientEditDialog } from "@/components/clients/client-edit-dialog";
import { Client, Invoice } from "@/types";
import { getWhatsAppReminderUrl } from "@/lib/whatsapp";
import { useTenant } from "@/hooks/use-tenant";

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
  Edit3,
} from "lucide-react";

export default function ClientsPage() {
  const { currentTenant } = useTenant();
  const [clientsList, setClientsList] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Centralized Edit Client Dialog State
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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
            (inv) => inv.clientId === client.id
          );
          const computedTotalBilled = clientInvoices.reduce(
            (acc, inv) => acc + (inv.totalAmount || 0),
            0
          );
          const computedTotalPaid = clientInvoices.reduce(
            (acc, inv) => acc + (inv.paidAmount || 0),
            0
          );
          const computedBalanceDue = Math.max(0, computedTotalBilled - computedTotalPaid);

          return {
            ...client,
            totalBilled: clientInvoices.length > 0 ? computedTotalBilled : (client.totalBilled || 0),
            totalPaid: clientInvoices.length > 0 ? computedTotalPaid : (client.totalPaid || 0),
            balanceDue: clientInvoices.length > 0 ? computedBalanceDue : (client.balanceDue || 0),
          };
        });

        setClientsList(enrichedClients);
      } catch (err) {
        console.error("Failed to load clients data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleDeleteClient = async (id: string, name: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete client "${name}"? This action cannot be undone.`
      )
    ) {
      setClientsList((prev) => prev.filter((c) => c.id !== id));
      await ClientService.deleteClient(id);
    }
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setIsEditDialogOpen(true);
  };

  const handleClientUpdated = (updated: Client) => {
    setClientsList((prev) =>
      prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
    );
  };

  // Metrics computation
  const totalClients = clientsList.length;
  const overdueClients = clientsList.filter((c) => (c.balanceDue || 0) > 0);
  const totalReceivables = clientsList.reduce((acc, c) => acc + (c.balanceDue || 0), 0);

  // Search & filter logic
  const filteredClients = useMemo(() => {
    return clientsList.filter((client) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        client.name.toLowerCase().includes(query) ||
        (client.companyName && client.companyName.toLowerCase().includes(query)) ||
        (client.phone && client.phone.includes(query)) ||
        (client.email && client.email.toLowerCase().includes(query)) ||
        (client.gstin && client.gstin.toLowerCase().includes(query));

      let matchesFilter = true;
      if (selectedFilter === "due") {
        matchesFilter = (client.balanceDue || 0) > 0;
      } else if (selectedFilter === "clear") {
        matchesFilter = (client.balanceDue || 0) === 0;
      }

      return matchesSearch && matchesFilter;
    });
  }, [clientsList, searchQuery, selectedFilter]);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
            <span>Clients & Contacts</span>
            <span className="clay-badge bg-blue-50 text-blue-700 border border-blue-200/80">
              {totalClients} Clients
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Manage your client directory, payment history, billing ledger, and direct WhatsApp reminders.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/clients/new">
            <button className="clay-btn-primary inline-flex items-center gap-2 h-11 px-5 font-bold text-xs sm:text-sm rounded-2xl cursor-pointer">
              <UserPlus className="h-4 w-4 text-emerald-400" />
              <span>Add New Client</span>
            </button>
          </Link>
        </div>
      </div>

      {/* 3 Quick Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        {/* Total Directory */}
        <div className="clay-card p-5 bg-gradient-to-br from-slate-50/80 via-white to-blue-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Clients
            </span>
            <div className="clay-icon-squircle p-2.5 bg-blue-50 text-blue-700 border border-blue-200/80">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-[28px] font-bold text-slate-900">
              {totalClients}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Active directory entries
            </p>
          </div>
        </div>

        {/* Clients with Dues (Amber) */}
        <div className="clay-card p-5 bg-gradient-to-br from-amber-50/40 via-white to-orange-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
              Pending Settlements
            </span>
            <div className="clay-icon-squircle p-2.5 bg-amber-50 text-amber-700 border border-amber-200/80">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-[28px] font-bold text-amber-800">
              {overdueClients.length} Clients
            </h3>
            <p className="text-[11px] text-amber-700 font-medium mt-1">
              Have unpaid invoice balances
            </p>
          </div>
        </div>

        {/* Total Outstanding Receivables (Rose/Amber) */}
        <div className="clay-card p-5 bg-gradient-to-br from-rose-50/30 via-white to-pink-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
              Total Receivables
            </span>
            <div className="clay-icon-squircle p-2.5 bg-rose-50 text-rose-700 border border-rose-200/80">
              <ReceiptText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-[28px] font-bold text-slate-900">
              {formatCurrency(totalReceivables, "INR")}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Total balance awaiting collection
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar, Filter Tabs & View Toggle */}
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills & View Switcher */}
        <div className="flex items-center justify-between md:justify-end gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "all", label: "All Clients" },
              { id: "due", label: `Pending Dues (${overdueClients.length})` },
              { id: "clear", label: "Zero Balance" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id)}
                className={cn(
                  "clay-tag px-3 py-1 text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                  selectedFilter === tab.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* View Toggle */}
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

      {/* Clients Content */}
      {filteredClients.length === 0 ? (
        /* Empty State */
        <div className="clay-card p-12 text-center flex flex-col items-center justify-center">
          <div className="clay-icon-squircle p-4 bg-blue-50 text-blue-600 border border-blue-200/60 mb-4">
            <Users className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {searchQuery ? "No matching clients found" : "Your Client Directory is Empty"}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm font-medium">
            {searchQuery
              ? `No clients found matching "${searchQuery}". Try searching by phone or name.`
              : "Add your clients and business contacts to easily issue invoices, generate quotes, and track balances."}
          </p>
          {!searchQuery && (
            <Link href="/clients/new" className="mt-5">
              <button className="clay-btn-primary inline-flex items-center gap-2 h-10 px-4 text-xs font-bold rounded-xl cursor-pointer">
                <UserPlus className="h-4 w-4 text-emerald-400" />
                <span>Add Your First Client</span>
              </button>
            </Link>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* ============================================================ */
        /* GRID VIEW: Card layout with claymorphism and ledger metrics  */
        /* ============================================================ */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map((client) => {
            const hasDue = (client.balanceDue || 0) > 0;
            const cleanPhone = client.phone ? client.phone.replace(/\D/g, "") : "";

            return (
              <div
                key={client.id}
                className="clay-card p-5 flex flex-col justify-between hover:border-blue-300/80 transition-all duration-200 group relative"
              >
                <div>
                  {/* Top Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="clay-icon-squircle p-2 bg-blue-50 text-blue-700 border border-blue-200/80 shrink-0">
                        <Users className="h-4 w-4" />
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

                    {/* Direct Contact Actions */}
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

                      {/* Edit Client Button */}
                      <button
                        onClick={() => handleEditClient(client)}
                        title={`Edit ${client.name}`}
                        className="clay-icon-squircle flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-white shadow-2xs transition-colors cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>

                      {/* Delete Client Button */}
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
                    {client.address && (
                      <p className="flex items-center gap-2 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{client.address}</span>
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

                    {(client.segmentTags || []).slice(0, 3).map((tag) => (
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
                          hasDue ? "text-amber-800" : "text-emerald-800"
                        )}
                      >
                        {formatCurrency(client.balanceDue || 0, "INR")}
                      </span>
                    </div>
                  </div>

                  {/* 1-Click Billing Actions */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <Link
                      href={`/quotations/new?clientId=${client.id}`}
                      className="clay-tag flex items-center justify-center gap-1 py-1.5 text-[11px] font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 transition-colors"
                    >
                      <FileText className="h-3 w-3 text-blue-600" />
                      <span>+ Quote</span>
                    </Link>

                    <Link
                      href={`/invoices/new?clientId=${client.id}`}
                      className="clay-tag flex items-center justify-center gap-1 py-1.5 text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors"
                    >
                      <ReceiptText className="h-3 w-3 text-emerald-600" />
                      <span>+ Invoice</span>
                    </Link>

                    <Link
                      href={`/clients/${client.id}`}
                      className="clay-tag flex items-center justify-center gap-1 py-1.5 text-[11px] font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 transition-colors"
                    >
                      <span>Ledger</span>
                      <ArrowUpRight className="h-3 w-3 text-slate-400" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ============================================================ */
        /* TABLE VIEW: Compact dense view for client directory          */
        /* ============================================================ */
        <div className="clay-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Client / Company</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">GSTIN</th>
                  <th className="py-3.5 px-4 text-right">Total Billed</th>
                  <th className="py-3.5 px-4 text-right">Balance Due</th>
                  <th className="py-3.5 px-4 text-center">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.map((client) => {
                  const hasDue = (client.balanceDue || 0) > 0;
                  const cleanPhone = client.phone ? client.phone.replace(/\D/g, "") : "";

                  return (
                    <tr key={client.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/clients/${client.id}`}
                          className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors block"
                        >
                          {client.name}
                        </Link>
                        {client.companyName && (
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                            {client.companyName}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {client.phone}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {client.gstin || "-"}
                      </td>

                      <td className="py-3.5 px-4 text-right font-semibold text-slate-700">
                        {formatCurrency(client.totalBilled || 0, "INR")}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={cn(
                            "font-extrabold text-sm",
                            hasDue ? "text-amber-800" : "text-emerald-800"
                          )}
                        >
                          {formatCurrency(client.balanceDue || 0, "INR")}
                        </span>
                      </td>

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
                          {hasDue && (
                            <a
                              href={getWhatsAppReminderUrl({
                                clientPhone: client.phone,
                                clientName: client.name,
                                balanceDue: client.balanceDue || 0,
                                businessName: currentTenant?.businessName,
                                currency: currentTenant?.settings?.defaultCurrency || "INR",
                                customTemplate: currentTenant?.settings?.whatsappReminderTemplate,
                              })}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`Send WhatsApp Reminder`}
                              className="clay-icon-squircle p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white transition-colors"
                            >
                              <BellRing className="h-3 w-3" />
                            </a>
                          )}


                          {/* Edit Client */}
                          <button
                            onClick={() => handleEditClient(client)}
                            title={`Edit ${client.name}`}
                            className="clay-icon-squircle p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-900 hover:text-white transition-colors cursor-pointer"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>

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

      {/* Single Centralized Edit Client Dialog Modal */}
      <ClientEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        client={editingClient}
        onClientUpdated={handleClientUpdated}
      />
    </div>
  );
}
