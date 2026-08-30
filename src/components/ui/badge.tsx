import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "danger" | "info" | "outline";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-slate-100 text-slate-800 border border-slate-200/80 shadow-2xs",
    secondary: "bg-slate-50 text-slate-600 border border-slate-200/60",
    success:
      "bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs shadow-emerald-500/10",
    warning:
      "bg-amber-50 text-amber-800 border border-amber-200/80 shadow-2xs shadow-amber-500/10",
    danger:
      "bg-rose-50 text-rose-800 border border-rose-200/80 shadow-2xs shadow-rose-500/10",
    info:
      "bg-blue-50 text-blue-800 border border-blue-200/80 shadow-2xs shadow-blue-500/10",
    outline: "border border-slate-200 text-slate-700 bg-white",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-all",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );

}
