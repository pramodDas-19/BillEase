"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ClientService } from "@/services/client.service";
import { InvoiceService } from "@/services/invoice.service";
import { QuotationService } from "@/services/quotation.service";
import { CatalogService } from "@/services/service.service";
import { Client, Invoice, Quotation, ServiceItem } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
  Search,
  X,
  FileText,
  ReceiptText,
  Users,
  Package,
  CreditCard,
  BarChart3,
  Settings,
  Plus,
  ArrowRight,
  Sparkles,
  Command,
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Keyboard shortcut listener (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onClose(); // toggle behavior if managed from outside
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Load searchable data when palette opens
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setIsLoading(true);
      Promise.all([
        InvoiceService.getInvoices(),
        QuotationService.getQuotations(),
        ClientService.getClients(),
        CatalogService.getServices(),
      ])
        .then(([invs, quotes, cls, srvs]) => {
          setInvoices(invs || []);
          setQuotations(quotes || []);
          setClients(cls || []);
          setServices(srvs || []);
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  // Static Quick Jump Actions
  const quickActions = useMemo(
    () => [
      {
        title: "Create New Invoice",
        path: "/invoices/new",
        icon: ReceiptText,
        badge: "Action",
        color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      },
      {
        title: "Create New Quotation",
        path: "/quotations/new",
        icon: FileText,
        badge: "Action",
        color: "text-blue-700 bg-blue-50 border-blue-200",
      },
      {
        title: "Record Payment Receipt",
        path: "/payments/record",
        icon: CreditCard,
        badge: "Action",
        color: "text-amber-700 bg-amber-50 border-amber-200",
      },
      {
        title: "Add New Client",
        path: "/clients/new",
        icon: Users,
        badge: "Action",
        color: "text-purple-700 bg-purple-50 border-purple-200",
      },
      {
        title: "Add Catalog Service",
        path: "/services/new",
        icon: Package,
        badge: "Action",
        color: "text-indigo-700 bg-indigo-50 border-indigo-200",
      },
      {
        title: "Analytics & Reports",
        path: "/reports",
        icon: BarChart3,
        badge: "Page",
        color: "text-slate-700 bg-slate-100 border-slate-200",
      },
      {
        title: "Business Settings",
        path: "/settings",
        icon: Settings,
        badge: "Page",
        color: "text-slate-700 bg-slate-100 border-slate-200",
      },
    ],
    []
  );

  // Search Results
  const q = query.toLowerCase().trim();

  const matchingActions = useMemo(() => {
    if (!q) return quickActions;
    return quickActions.filter((a) => a.title.toLowerCase().includes(q));
  }, [q, quickActions]);

  const matchingInvoices = useMemo(() => {
    if (!q) return [];
    return invoices
      .filter(
        (i) =>
          i.invoiceNumber.toLowerCase().includes(q) ||
          i.clientName.toLowerCase().includes(q) ||
          (i.clientPhone && i.clientPhone.includes(q)) ||
          i.status.toLowerCase().includes(q)
      )
      .slice(0, 4);
  }, [q, invoices]);

  const matchingQuotations = useMemo(() => {
    if (!q) return [];
    return quotations
      .filter(
        (quote) =>
          quote.quotationNumber.toLowerCase().includes(q) ||
          quote.clientName.toLowerCase().includes(q) ||
          (quote.clientPhone && quote.clientPhone.includes(q)) ||
          quote.status.toLowerCase().includes(q)
      )
      .slice(0, 4);
  }, [q, quotations]);

  const matchingClients = useMemo(() => {
    if (!q) return [];
    return clients
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.companyName && c.companyName.toLowerCase().includes(q)) ||
          (c.phone && c.phone.includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q))
      )
      .slice(0, 4);
  }, [q, clients]);

  const matchingServices = useMemo(() => {
    if (!q) return [];
    return services
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.category && s.category.toLowerCase().includes(q))
      )
      .slice(0, 4);
  }, [q, services]);

  const hasResults =
    matchingActions.length > 0 ||
    matchingInvoices.length > 0 ||
    matchingQuotations.length > 0 ||
    matchingClients.length > 0 ||
    matchingServices.length > 0;

  const handleNavigate = (path: string) => {
    onClose();
    router.push(path);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50 duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="clay-card relative z-10 w-full max-w-2xl bg-white rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-200/90 space-y-4 animate-in zoom-in-95 duration-200">
        {/* Search Bar Input */}
        <div className="relative flex items-center border-b border-slate-100 pb-3">
          <Search className="h-5 w-5 text-slate-400 absolute left-2" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command, invoice #, quote #, client name, or service..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent pl-10 pr-10 py-2 text-sm sm:text-base font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="clay-icon-squircle p-1.5 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
          {/* Quick Actions & Navigation */}
          {matchingActions.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 block">
                {q ? "Matching Actions" : "Quick Actions & Navigation"}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {matchingActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.path}
                      onClick={() => handleNavigate(action.path)}
                      className="group w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-1.5 rounded-lg border ${action.color}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors truncate">
                          {action.title}
                        </span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-600 transition-colors shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Matching Invoices */}
          {matchingInvoices.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 block">
                Invoices
              </span>
              <div className="space-y-1">
                {matchingInvoices.map((inv) => (
                  <button
                    key={inv.id}
                    onClick={() => handleNavigate(`/invoices/${inv.id}`)}
                    className="group w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <ReceiptText className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          #{inv.invoiceNumber}
                        </span>
                        <span className="text-xs text-slate-400 mx-1.5">•</span>
                        <span className="text-xs font-medium text-slate-700 truncate">
                          {inv.clientName}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-extrabold text-slate-900 block">
                        {formatCurrency(inv.totalAmount, inv.currency)}
                      </span>
                      <span className="text-[10px] font-bold text-amber-700 uppercase">
                        Due: {formatCurrency(inv.balanceDue, inv.currency)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matching Quotations */}
          {matchingQuotations.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 block">
                Quotations
              </span>
              <div className="space-y-1">
                {matchingQuotations.map((quote) => (
                  <button
                    key={quote.id}
                    onClick={() => handleNavigate(`/quotations/${quote.id}`)}
                    className="group w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                        <FileText className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                          #{quote.quotationNumber}
                        </span>
                        <span className="text-xs text-slate-400 mx-1.5">•</span>
                        <span className="text-xs font-medium text-slate-700 truncate">
                          {quote.clientName}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-slate-900 shrink-0">
                      {formatCurrency(quote.totalAmount, quote.currency)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matching Clients */}
          {matchingClients.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 block">
                Clients & Contacts
              </span>
              <div className="space-y-1">
                {matchingClients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => handleNavigate(`/clients/${client.id}`)}
                    className="group w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
                        <Users className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                          {client.name}
                        </span>
                        {client.companyName && (
                          <span className="text-xs text-slate-400 ml-1.5">
                            ({client.companyName})
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 font-semibold shrink-0">
                      {client.phone}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matching Catalog Services */}
          {matchingServices.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 block">
                Services & Catalog
              </span>
              <div className="space-y-1">
                {matchingServices.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleNavigate(`/services`)}
                    className="group w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <Package className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 transition-colors truncate">
                        {service.name}
                      </span>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-800 shrink-0">
                      {formatCurrency(service.rate ?? service.defaultRate ?? 0, "INR")}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty Search State */}
          {q && !hasResults && (
            <div className="text-center py-8 space-y-1">
              <p className="text-xs font-bold text-slate-700">No results found for &quot;{query}&quot;</p>
              <p className="text-[11px] text-slate-400">
                Try searching with a different term, client name, or invoice number.
              </p>
            </div>
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] text-slate-400 font-medium px-1">
          <div className="flex items-center gap-2">
            <span>Navigation:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600">
              Esc
            </kbd>
            <span>to close</span>
          </div>
          <div className="flex items-center gap-1">
            <span>Shortcut:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600">
              Ctrl + K
            </kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
