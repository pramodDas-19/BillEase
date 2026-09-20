import React from "react";
import {
  DashboardHeader,
  GettingStartedChecklist,
  SummaryCards,
  RevenueChart,
  PaymentAttention,
  RecentQuotationsCard,
  RecentInvoicesCard,
} from "@/components/dashboard";
import dynamic from "next/dynamic";

const WelcomeModal = dynamic(
  () => import("@/components/onboarding/welcome-modal").then((mod) => mod.WelcomeModal),
  { ssr: false }
);

export default function DashboardPage() {
  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      {/* 0. Day-1 Welcome Modal */}
      <WelcomeModal />

      {/* 1. Greeting & Primary Action Bar */}
      <DashboardHeader />

      {/* 1.5 Getting Started 4-Step Checklist */}
      <GettingStartedChecklist />

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
