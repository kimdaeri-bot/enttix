import React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Enttix - Premium Entertainment Ticket Marketplace",
  description: "Premium Sports Ticket Official Marketplace. No hidden fees, 100% authentic guarantee.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Impact.com site verification — requires value attr (not content) */}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {React.createElement('meta', { name: 'impact-site-verification', value: '150533bd-6316-4554-9df8-5633b41308f6' } as any)}
      </head>
      <body className="antialiased min-h-screen bg-[#F5F7FA]">
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
