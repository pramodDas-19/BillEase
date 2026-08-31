import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TenantProvider } from "@/context/tenant-context";
import { PwaInstallPrompt } from "@/components/layout/pwa-install-prompt";

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "BillEase - Modern Multi-Tenant Billing & Invoicing SaaS",
  description:
    "Production-ready Quotation, Invoicing, Payment Tracking and Client Management platform for event planners, printing businesses, and creative studios.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: ["/icon.png"],
    apple: [{ url: "/icon.png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BillEase",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased selection:bg-emerald-100 selection:text-emerald-900">
        <TenantProvider>
          {children}
          <PwaInstallPrompt />
        </TenantProvider>
      </body>
    </html>
  );
}
