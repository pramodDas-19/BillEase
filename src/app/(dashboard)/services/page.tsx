import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MOCK_SERVICES } from "@/mock/services.mock";
import { formatCurrency } from "@/lib/utils";
import { Plus, Package, Sparkles, Printer, Palette } from "lucide-react";

export default function ServicesPage() {
  const categoryIcons: Record<string, React.ElementType> = {
    event: Sparkles,
    printing: Printer,
    design: Palette,
    custom: Package,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Products & Service Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Optional template library for fast quote item insertion. (Never mandatory during quotation creation).
          </p>
        </div>
        <Link href="/services/new">
          <Button size="sm" className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            <span>Add Item / Service</span>
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_SERVICES.map((item) => {
          const Icon = categoryIcons[item.category] || Package;
          return (
            <Card key={item.id} className="hover:border-slate-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{item.name}</h3>
                      <span className="text-[11px] text-slate-400 capitalize">{item.category}</span>
                    </div>
                  </div>
                </div>

                {item.description && (
                  <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Unit: <span className="font-semibold text-slate-700">{item.defaultUnit || "Fixed"}</span>
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {item.defaultRate ? formatCurrency(item.defaultRate, "INR") : "Custom Rate"}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
