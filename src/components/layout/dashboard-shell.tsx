"use client";

import React, { useState, createContext, useContext } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { cn } from "@/lib/utils";

interface LayoutContextType {
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  isMobileNavOpen: boolean;
  setIsMobileNavOpen: (open: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function useLayoutState() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayoutState must be used within DashboardShell");
  }
  return context;
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <LayoutContext.Provider
      value={{
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        isMobileNavOpen,
        setIsMobileNavOpen,
      }}
    >
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 antialiased font-sans">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Wrapper */}
        <div
          className={cn(
            "flex flex-col min-h-screen transition-all duration-300 ease-in-out",
            isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
          )}
        >
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </LayoutContext.Provider>
  );
}
