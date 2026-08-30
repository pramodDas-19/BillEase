import React from "react";
import { MOCK_FINANCIAL_SUMMARIES } from "@/mock/dashboard.mock";
import { cn } from "@/lib/utils";
import {
  ReceiptText,
  Wallet,
  Hourglass,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";

export function SummaryCards() {
  const iconMap: Record<string, React.ElementType> = {
    "total-invoiced": ReceiptText,
    collected: Wallet,
    outstanding: Hourglass,
    overdue: AlertTriangle,
  };

  const cardConfigs: Record<
    string,
    {
      bgGradient: string;
      iconBg: string;
      iconColor: string;
      tagBg: string;
      tagText: string;
      tagLabel: string;
      contextText: string;
    }
  > = {
    "total-invoiced": {
      bgGradient: "from-slate-50/80 via-white to-blue-50/20",
      iconBg: "bg-slate-100 text-slate-700 border border-slate-200/80",
      iconColor: "text-slate-700",
      tagBg: "bg-emerald-50/90 border border-emerald-200/80",
      tagText: "text-emerald-700",
      tagLabel: "↑ 12.4%",
      contextText: "28 invoices this month",
    },
    collected: {
      bgGradient: "from-emerald-50/30 via-white to-teal-50/20",
      iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-200/80",
      iconColor: "text-emerald-600",
      tagBg: "bg-emerald-50/90 border border-emerald-200/80",
      tagText: "text-emerald-700",
      tagLabel: "↑ 8.2%",
      contextText: "22 settlements received",
    },
    outstanding: {
      bgGradient: "from-amber-50/30 via-white to-orange-50/20",
      iconBg: "bg-amber-50 text-amber-600 border border-amber-200/80",
      iconColor: "text-amber-600",
      tagBg: "bg-amber-50/90 border border-amber-200/80",
      tagText: "text-amber-700",
      tagLabel: "6 pending",
      contextText: "Awaiting client settlement",
    },
    overdue: {
      bgGradient: "from-rose-50/30 via-white to-red-50/20",
      iconBg: "bg-rose-50 text-rose-600 border border-rose-200/80",
      iconColor: "text-rose-600",
      tagBg: "bg-rose-50/90 border border-rose-200/80",
      tagText: "text-rose-700",
      tagLabel: "3 overdue",
      contextText: "Action & reminder required",
    },
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {MOCK_FINANCIAL_SUMMARIES.map((metric) => {
        const Icon = iconMap[metric.id] || ReceiptText;
        const config = cardConfigs[metric.id] || cardConfigs["total-invoiced"];

        return (
          <div
            key={metric.id}
            className={cn(
              "clay-card p-5 sm:p-6 relative overflow-hidden flex flex-col justify-between group",
              `bg-gradient-to-br ${config.bgGradient}`
            )}
          >
            {/* Top row: Label & Clean Finance-Accurate Icon Squircle */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {metric.title}
              </span>
              <div
                className={cn(
                  "clay-icon-squircle p-2.5 shrink-0 transition-transform duration-200 group-hover:scale-105",
                  config.iconBg
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
            </div>

            {/* Middle: Large Crisp Financial Amount */}
            <div className="my-3">
              <h3 className="text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900">
                {metric.formattedAmount}
              </h3>
            </div>

            {/* Bottom: Clean Clay Tag + Context */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span
                className={cn(
                  "clay-tag inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold shrink-0",
                  config.tagBg,
                  config.tagText
                )}
              >
                {config.tagLabel}
              </span>
              <span className="text-[11px] text-slate-500 font-medium truncate">
                {config.contextText}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
