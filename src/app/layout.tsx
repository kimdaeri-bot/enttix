import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Enttix - Premium Entertainment Ticket Marketplace",
  description: "Premium Sports Ticket Official Marketplace. No hidden fees, 100% authentic guarantee.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#F5F7FA]">
        {children}
      </body>
    </html>
  );
}
