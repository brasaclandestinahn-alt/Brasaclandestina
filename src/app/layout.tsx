import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import PwaRegister from "@/components/PwaRegister";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "Brasa Clandestina | Parrilla a Domicilio en San Pedro Sula",
  description: "Brasa artesanal de leña con delivery en San Pedro Sula. Pide por WhatsApp o Rappi. Entrega en 35–45 min. Abierto de Jueves a Sábado de 6:30 a 9:30pm.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Brasa",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "Brasa Clandestina | Parrilla Real a Domicilio",
    description: "Pide la mejor parrilla artesanal de San Pedro Sula directamente a tu puerta.",
    images: ["https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": "Brasa Clandestina",
    "description": "Dark Kitchen de parrilla artesanal a la leña.",
    "hasDeliveryMethod": true,
    "deliveryRadius": "10km",
    "areaServed": ["San Pedro Sula"],
    "openingHours": "Th,Fr,Sa 18:30-21:30",
    "image": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "San Pedro Sula",
      "addressCountry": "HN"
    }
  };

  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-title" content="Brasa" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self' https: wss:; img-src 'self' https: data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" />
        <meta httpEquiv="X-Frame-Options" content="SAMEORIGIN" />
      </head>
      <body className={`${inter.variable} ${playfair.variable} antialiased`}>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
