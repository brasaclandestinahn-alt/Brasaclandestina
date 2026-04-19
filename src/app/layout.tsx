import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter", 
});

import "./globals.css";

export const metadata: Metadata = {
  title: "Brasa Clandestina ERP/POS",
  description: "Sistema de gestión, punto de venta y toma de órdenes.",
  manifest: "/manifest.json",
  themeColor: "#f97316",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
