"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
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
  ArrowRight,
  Command,
} from "lucide-react";

export function HeaderSearch() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Load data when opened
  useEffect(() => {
    if (isOpen) {
      Promise.all([
        InvoiceService.getInvoices(),
        QuotationService.getQuotations(),
        ClientService.getClients(),
        CatalogService.getServices(),
      ]).then(([invs, quotes, cls, srvs]) => {
        setInvoices(invs || []);
        setQuotations(quotes || []);
        setClients(cls || []);
        setServices(srvs || []);
      });
    }
  }, [isOpen]);

  // Quick navigation shortcuts
  const quickActions = useMemo(
    () => [
      {
        title: "Create Invoice",
        path: "/invoices/new",
        icon: ReceiptText,
        color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      },
      {
        title: "Create Quotation",
        path: "/quotations/new",
        icon: FileText,
        color: "text-blue-700 bg-blue-50 border-blue-200",
      },
      {
        title: "Record Payment",
        path: "/payments/record",
        icon: CreditCard,
        color: "text-amber-700 bg-amber-50 border-amber-200",
      },
      {
        title: "Add Client",
        path: "/clients/new",
        icon: Users,
        color: "text-purple-700 bg-purple-50 border-purple-200",
      },
    ],
    []
  );

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
          (i.clientPhone && i.clientPhone.includes(q))
      )
      .slice(0, 3);
  }, [q, invoices]);

  const matchingQuotations = useMemo(() => {
    if (!q) return [];
    return quotations
      .filter(
        (quote) =>
          quote.quotationNumber.toLowerCase().includes(q) ||
          quote.clientName.toLowerCase().includes(q) ||
          (quote.clientPhone && quote.clientPhone.includes(q))
      )
      .slice(0, 3);
  }, [q, quotations]);

  const matchingClients = useMemo(() => {
    if (!q) return [];
    return clients
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.companyName && c.companyName.toLowerCase().includes(q)) ||
          (c.phone && c.phone.includes(q))
      )
      .slice(0, 3);
  }, [q, clients]);

  const matchingServices = useMemo(() => {
    if (!q) return [];
    return services
      .filter((s) => s.name.toLowerCase().includes(q))
      .slice(0, 3);
  }, [q, services]);

  const hasMatches =
    matchingActions.length > 0 ||
    matchingInvoices.length > 0 ||
    matchingQuotations.length > 0 ||
    matchingClients.length > 0 ||
    matchingServices.length > 0;

  const handleSelect = (path: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(path);
  };

  return (
    <div className="relative" ref={searchContainerRef}>
      {/* Mobile Search Icon Toggle (Compact 36px icon on mobile) */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className="clay-icon-squircle p-2 text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200/70 cursor-pointer sm:hidden flex items-center justify-center"
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
      </button>

      {/* Desktop Search Input Bar in Header */}
      <div
        className={`hidden sm:flex items-center gap-2 rounded-2xl border px-3 py-1.5 transition-all duration-200 ${
          isOpen
            ? "w-72 lg:w-80 border-emerald-500 bg-white shadow-md ring-2 ring-emerald-500/20"
            : "w-56 lg:w-64 border-slate-200/90 bg-slate-50/80 hover:bg-white hover:border-slate-300 shadow-2xs"
        }`}
      >
        <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search or jump to..."
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          className="w-full bg-transparent text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="text-xs text-slate-400 hover:text-slate-700 shrink-0"
          >
            <X className="h-3 w-3" />
          </button>
        ) : (
          <div className="flex items-center gap-0.5 rounded-lg border border-slate-200/90 bg-white px-1.5 py-0.5 text-[10px] font-extrabold text-slate-500 shadow-2xs shrink-0">
            <Command className="h-2.5 w-2.5" />
            <span>K</span>
          </div>
        )}
      </div>

      {/* Clean Dropdown Attached Underneath Header */}
      {isOpen && (
        <div className="fixed sm:absolute top-18 sm:top-full left-4 sm:left-auto right-4 sm:right-0 mt-1 sm:mt-2 w-[calc(100vw-2rem)] sm:w-96 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xl z-50 space-y-3 animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Mobile Dedicated Search Input Field */}
          <div className="sm:hidden flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
            <Search className="h-4 w-4 text-emerald-600 shrink-0" />
            <input
              type="text"
              placeholder="Type to search anything..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full bg-transparent text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-slate-400 p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Actions */}
          {matchingActions.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 block">
                {q ? "Actions" : "Quick Actions"}
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {matchingActions.map((act) => {
                  const Icon = act.icon;
                  return (
                    <button
                      key={act.path}
                      onClick={() => handleSelect(act.path)}
                      className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50 border border-slate-100 hover:border-slate-200 text-left transition-all cursor-pointer"
                    >
                      <div className={`p-1 rounded-lg border shrink-0 ${act.color}`}>
                        <Icon className="h-3 w-3" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {act.title}
                      </span>
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
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {matchingInvoices.map((inv) => (
                  <button
                    key={inv.id}
                    onClick={() => handleSelect(`/invoices/${inv.id}`)}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 text-left transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <ReceiptText className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <div className="truncate">
                        <span className="text-xs font-bold text-slate-900">
                          #{inv.invoiceNumber}
                        </span>
                        <span className="text-xs text-slate-500 ml-1 truncate">
                          ({inv.clientName})
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-slate-900 shrink-0">
                      {formatCurrency(inv.totalAmount, inv.currency)}
                    </span>
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
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {matchingQuotations.map((quote) => (
                  <button
                    key={quote.id}
                    onClick={() => handleSelect(`/quotations/${quote.id}`)}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 text-left transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      <div className="truncate">
                        <span className="text-xs font-bold text-slate-900">
                          #{quote.quotationNumber}
                        </span>
                        <span className="text-xs text-slate-500 ml-1 truncate">
                          ({quote.clientName})
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
                Clients
              </span>
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {matchingClients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => handleSelect(`/clients/${client.id}`)}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 text-left transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Users className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {client.name}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-semibold shrink-0">
                      {client.phone}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matching Services */}
          {matchingServices.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 block">
                Services
              </span>
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {matchingServices.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleSelect(`/services`)}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 text-left transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Package className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {service.name}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 shrink-0">
                      {formatCurrency(service.rate ?? service.defaultRate ?? 0, "INR")}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty Search */}
          {q && !hasMatches && (
            <div className="py-4 text-center text-xs text-slate-400 font-medium">
              No matching records found for &quot;{query}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
