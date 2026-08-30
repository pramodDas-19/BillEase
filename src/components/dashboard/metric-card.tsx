import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: "default" | "emerald" | "amber" | "rose" | "indigo";
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
}: MetricCardProps) {
  const iconBgStyles = {
    default: "bg-slate-100 text-slate-700",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    indigo: "bg-indigo-50 text-indigo-600",
  };

  return (
    <Card className="hover:border-slate-300/80 transition-all shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className={cn("rounded-xl p-2.5", iconBgStyles[variant])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3">
        <h4 className="text-2xl font-bold tracking-tight text-slate-900">{value}</h4>
        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        {trend && (
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span
              className={cn(
                "font-semibold",
                trend.isPositive ? "text-emerald-600" : "text-rose-600"
              )}
            >
              {trend.isPositive ? "+" : ""}{trend.value}
            </span>
            <span className="text-slate-400">vs last month</span>
          </div>
        )}
      </div>
    </Card>
  );
}
