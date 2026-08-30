import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MOCK_CLIENTS } from "@/mock/clients.mock";
import { Plus, UserPlus, Phone, Mail, Building2, ChevronRight } from "lucide-react";

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Clients</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your client directory, quotation history, and billing ledger.
          </p>
        </div>
        <Link href="/clients/new">
          <Button size="sm" className="gap-1.5 text-xs">
            <UserPlus className="h-3.5 w-3.5" />
            <span>Add Client</span>
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_CLIENTS.map((client) => (
          <Link key={client.id} href={`/clients/${client.id}`}>
            <Card className="hover:border-slate-300 transition-all cursor-pointer h-full flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{client.name}</h3>
                    {client.companyName && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3 w-3 text-slate-400" />
                        {client.companyName}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>

                <div className="mt-4 space-y-1 text-xs text-slate-600">
                  <p className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{client.phone}</span>
                  </p>
                  {client.email && (
                    <p className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span className="truncate">{client.email}</span>
                    </p>
                  )}
                </div>
              </div>

              {client.tags && client.tags.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-1">
                  {client.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
