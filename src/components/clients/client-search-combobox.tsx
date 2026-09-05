"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Client } from "@/types";
import { Search, ChevronDown, Check, X, Star, Clock, User, Building2, Phone } from "lucide-react";

interface ClientSearchComboboxProps {
  clients: Client[];
  selectedClientId?: string;
  onSelectClient: (client: Client) => void;
  onClear?: () => void;
  placeholder?: string;
  label?: string;
  badge?: React.ReactNode;
}

export function ClientSearchCombobox({
  clients,
  selectedClientId,
  onSelectClient,
  onClear,
  placeholder = "-- Search or Choose Existing Client --",
  label = "Client Selection",
  badge,
}: ClientSearchComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Identify currently selected client
  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  // Top / Frequent repeat clients:
  // Only classify as "Top Client" if they actually have repeat business (2+ orders)
  const topClients = useMemo(() => {
    const withRepeatActivity = [...clients]
      .filter((c) => (c.invoicesCount || 0) + (c.quotationsCount || 0) >= 2)
      .sort((a, b) => {
        const aActivity = (a.invoicesCount || 0) + (a.quotationsCount || 0);
        const bActivity = (b.invoicesCount || 0) + (b.quotationsCount || 0);
        if (bActivity !== aActivity) return bActivity - aActivity;
        return (b.totalBilled || 0) - (a.totalBilled || 0);
      });

    return withRepeatActivity.slice(0, 4);
  }, [clients]);

  // Recent clients:
  // Sort by updatedAt or createdAt descending, excluding ones already in topClients
  const recentClients = useMemo(() => {
    const topIds = new Set(topClients.map((c) => c.id));
    return [...clients]
      .filter((c) => !topIds.has(c.id))
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 4);
  }, [clients, topClients]);

  // Quick-pick suggestions (top 3 clients for 1-click pills):
  // Prefer top repeat clients if any exist; otherwise show the most recent clients
  const quickPillClients = useMemo(() => {
    if (topClients.length > 0) return topClients.slice(0, 3);
    if (recentClients.length > 0) return recentClients.slice(0, 3);
    return clients.slice(0, 3);
  }, [topClients, recentClients, clients]);

  // Filtered clients based on search query
  const filteredClients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return clients;

    return clients.filter((c) => {
      const nameMatch = c.name?.toLowerCase().includes(query);
      const companyMatch = c.companyName?.toLowerCase().includes(query);
      const phoneMatch = c.phone?.replace(/\D/g, "").includes(query.replace(/\D/g, ""));
      const emailMatch = c.email?.toLowerCase().includes(query);
      const gstinMatch = c.gstin?.toLowerCase().includes(query);
      return nameMatch || companyMatch || phoneMatch || emailMatch || gstinMatch;
    });
  }, [clients, searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-focus search input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  const handleSelect = (client: Client) => {
    onSelectClient(client);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClear) onClear();
    setSearchQuery("");
  };

  return (
    <div ref={containerRef} className="space-y-2 relative">
      {label && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {label}
            </label>
            {badge}
          </div>
          {selectedClient && onClear && (
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <X className="h-3 w-3" />
              <span>Clear selection</span>
            </button>
          )}
        </div>
      )}

      {/* Main Trigger Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-[46px] rounded-xl border px-3.5 py-2 flex items-center justify-between gap-2 bg-slate-50/80 hover:bg-white transition-all cursor-pointer shadow-xs ${
          isOpen
            ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-white"
            : "border-slate-200 hover:border-slate-300"
        }`}
      >
        {selectedClient ? (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
              {selectedClient.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="truncate text-left">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 truncate">
                  {selectedClient.name}
                </span>
                {selectedClient.companyName && (
                  <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md truncate">
                    {selectedClient.companyName}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 truncate">
                {selectedClient.phone} {selectedClient.email ? `• ${selectedClient.email}` : ""}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
            <Search className="h-4 w-4 text-slate-400" />
            <span>{placeholder}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
          {selectedClient && onClear && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              title="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180 text-emerald-600" : ""}`}
          />
        </div>
      </div>

      {/* Quick Pick Chips (Top or Recent Clients) */}
      {!selectedClient && quickPillClients.length > 0 && (
        <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mr-1">
            {topClients.length > 0 ? (
              <>
                <Star className="h-3 w-3 text-amber-500 fill-amber-400" />
                <span>Top Repeat:</span>
              </>
            ) : (
              <>
                <Clock className="h-3 w-3 text-sky-500" />
                <span>Recent Clients:</span>
              </>
            )}
          </span>
          {quickPillClients.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleSelect(c)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50/80 hover:bg-emerald-100/90 text-emerald-800 border border-emerald-200/60 transition-all cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>{c.name}</span>
              {c.companyName && (
                <span className="text-[10px] text-emerald-600/80 font-normal">
                  ({c.companyName})
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Search Box inside dropdown */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/80">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type name, company, or phone to filter..."
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 py-2 text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Results List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100/60 p-1">
            {/* If searching: show direct search results */}
            {searchQuery.trim() !== "" ? (
              filteredClients.length > 0 ? (
                <div>
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Search Results ({filteredClients.length})
                  </div>
                  {filteredClients.map((client) => (
                    <ClientRowItem
                      key={client.id}
                      client={client}
                      isSelected={selectedClientId === client.id}
                      onSelect={() => handleSelect(client)}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <User className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">
                    No existing client matching &ldquo;{searchQuery}&rdquo;
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Fill the details in the form below to auto-create this new client!
                  </p>
                </div>
              )
            ) : (
              /* If NOT searching: show categorized sections */
              <div className="space-y-2">
                {/* 1. Top / Repeat Clients */}
                {topClients.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50/70 flex items-center gap-1.5 rounded-lg mx-1 mb-1">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                      <span>Top Clients (Frequent Repeat)</span>
                    </div>
                    {topClients.map((client) => (
                      <ClientRowItem
                        key={`top-${client.id}`}
                        client={client}
                        badge="top"
                        isSelected={selectedClientId === client.id}
                        onSelect={() => handleSelect(client)}
                      />
                    ))}
                  </div>
                )}

                {/* 2. Recent Clients */}
                {recentClients.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50/70 flex items-center gap-1.5 rounded-lg mx-1 mb-1">
                      <Clock className="h-3 w-3 text-sky-600" />
                      <span>Recent Clients</span>
                    </div>
                    {recentClients.map((client) => (
                      <ClientRowItem
                        key={`recent-${client.id}`}
                        client={client}
                        badge="recent"
                        isSelected={selectedClientId === client.id}
                        onSelect={() => handleSelect(client)}
                      />
                    ))}
                  </div>
                )}

                {/* 3. All Clients */}
                <div>
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 mx-1 mb-1">
                    All Clients ({clients.length})
                  </div>
                  {clients.map((client) => (
                    <ClientRowItem
                      key={`all-${client.id}`}
                      client={client}
                      isSelected={selectedClientId === client.id}
                      onSelect={() => handleSelect(client)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponent for each client item row
function ClientRowItem({
  client,
  badge,
  isSelected,
  onSelect,
}: {
  client: Client;
  badge?: "top" | "recent";
  isSelected: boolean;
  onSelect: () => void;
}) {
  const totalBills = (client.invoicesCount || 0) + (client.quotationsCount || 0);

  return (
    <div
      onClick={onSelect}
      className={`px-3 py-2 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors ${
        isSelected
          ? "bg-emerald-50 text-emerald-900 font-bold"
          : "hover:bg-slate-50 text-slate-700"
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="h-7 w-7 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0">
          {client.name.slice(0, 2).toUpperCase()}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
              {client.name}
            </span>
            {client.companyName && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded shrink-0">
                <Building2 className="h-2.5 w-2.5 text-slate-400" />
                {client.companyName}
              </span>
            )}
            {badge === "top" && totalBills > 0 && (
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-100/70 px-1.5 py-0.2 rounded-full shrink-0">
                ⭐ {totalBills} bills
              </span>
            )}
            {badge === "recent" && (
              <span className="text-[9px] font-bold uppercase tracking-wider text-sky-700 bg-sky-100/70 px-1.5 py-0.2 rounded-full shrink-0">
                Recent
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 truncate">
            <span className="flex items-center gap-1">
              <Phone className="h-2.5 w-2.5" />
              {client.phone}
            </span>
            {client.email && <span>• {client.email}</span>}
            {client.gstin && <span>• GST: {client.gstin}</span>}
          </div>
        </div>
      </div>

      {isSelected && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
    </div>
  );
}
