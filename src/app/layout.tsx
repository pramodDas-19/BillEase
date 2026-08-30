import type { Metadata } from "next";
import "./globals.css";
import { TenantProvider } from "@/context/tenant-context";

export const metadata: Metadata = {
  title: "BillEase - Modern Multi-Tenant Billing & Invoicing SaaS",
  description:
    "Production-ready Quotation, Invoicing, Payment Tracking and Client Management platform for event planners, printing businesses, and creative studios.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased selection:bg-emerald-100 selection:text-emerald-900">
        <TenantProvider>{children}</TenantProvider>
      </body>
    </html>
  );
}
