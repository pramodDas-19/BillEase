import React from "react";
import {
  DashboardHeader,
  SummaryCards,
  RevenueChart,
  PaymentAttention,
  RecentQuotationsCard,
  RecentInvoicesCard,
} from "@/components/dashboard";

export default function DashboardPage() {
  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      {/* 1. Greeting & Primary Action Bar */}
      <DashboardHeader />

      {/* 2. Four Primary Financial Summary Cards */}
      <SummaryCards />

      {/* 3. Dominant Analytical Section: Revenue Chart + Payment Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 flex flex-col">
          <RevenueChart />
        </div>
        <div className="lg:col-span-5 flex flex-col">
          <PaymentAttention />
        </div>
      </div>

      {/* 4. Recent Operations: Recent Quotations + Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentQuotationsCard />
        <RecentInvoicesCard />
      </div>
    </div>
  );
}
