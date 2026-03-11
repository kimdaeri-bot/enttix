import React from "react";
import "./globals.css";

// Root layout — html/body shell only
// Locale-specific providers are in [locale]/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <head>
        {/* Impact.com site verification */}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {React.createElement('meta', { name: 'impact-site-verification', value: '150533bd-6316-4554-9df8-5633b41308f6' } as any)}
        {/* LTD 위젯 CDN preconnect — 속도 개선 */}
        <link rel="preconnect" href="https://finale-cdn.uk" />
        <link rel="preconnect" href="https://calendar.finale-cdn.uk" />
        <link rel="preconnect" href="https://spdp.londontheatredirect.com" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
