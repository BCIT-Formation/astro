// Root layout: SEO/PWA metadata and the AppProvider (locale + theme) wrapper.
import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/contexts/app";

export const metadata: Metadata = {
  title: "✨ AstroVision — Prévisions Astrologiques IA",
  description: "Découvrez votre destinée à travers les astres. Prévisions personnalisées basées sur votre signe solaire, ascendant, signe lunaire et l'alignement des planètes, propulsées par l'IA.",
  keywords: "astrologie, horoscope, signe zodiacal, ascendant, planètes, prévisions, IA",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AstroVision",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "theme-color":            "#0a0015",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        {/*
          Synchronous inline script: applies saved theme before first paint
          to prevent a flash of the wrong theme on page load.
        */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var t = localStorage.getItem('av-theme');
            if (t === 'light') document.documentElement.setAttribute('data-theme','light');
          } catch(e) {}
        ` }} />
      </head>
      <body className="min-h-screen antialiased" style={{ background: "var(--background)", color: "var(--text-primary)" }}>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
