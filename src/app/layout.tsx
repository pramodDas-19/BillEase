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
  title: "BillEase — Smart Billing & Invoicing",
  description:
    "Fast, compliant quotation, invoicing, payment tracking and GST billing platform for all Indian businesses.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
      { url: "/favicon.ico" },
    ],
    shortcut: ["/icon-192.png"],
    apple: [{ url: "/icon-192.png" }],
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
