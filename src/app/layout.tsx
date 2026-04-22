import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter", 
});

import "./globals.css";

import PwaRegister from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: "Brasa Clandestina — Menú Digital",
  description: "Pide desde nuestra carta digital. Hamburguesas artesanales, alitas y más. ¡Ordena ahora! 🍔🔥",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Brasa",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },

  // Open Graph — usado por WhatsApp, Facebook, Telegram, LinkedIn
  openGraph: {
    title: "Brasa Clandestina 🔥",
    description: "Pide desde nuestra carta digital. Hamburguesas artesanales, alitas y más. ¡Ordena ahora!",
    url: "https://brasaclandestina.com",
    siteName: "Brasa Clandestina",
    images: [
      {
        url: "https://brasaclandestina.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Brasa Clandestina — Menú Digital",
      },
    ],
    locale: "es_HN",
    type: "website",
  },

  // Twitter / X Card
  twitter: {
    card: "summary_large_image",
    title: "Brasa Clandestina 🔥",
    description: "Pide desde nuestra carta digital. Hamburguesas artesanales, alitas y más.",
    images: ["https://brasaclandestina.com/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} antialiased`}>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
