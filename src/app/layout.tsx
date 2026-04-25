import React from "react";
import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import PwaRegister from "@/components/PwaRegister";
import CookieBanner from "@/components/DarkKitchen/CookieBanner";
import { GoogleAnalytics } from '@next/third-parties/google';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: 'swap',
});

// Senior Implementation: Advanced Metadata for SEO & Social Sharing
export const metadata: Metadata = {
  title: {
    default: "Brasa Clandestina | Parrilla Artesanal & Delivery",
    template: "%s | Brasa Clandestina"
  },
  description: "La mejor brasa artesanal de San Pedro Sula. Cortes premium, hamburguesas de autor y delivery ultra-rápido. ¡Pide ahora por WhatsApp!",
  keywords: ["brasa clandestina", "parrilla sula", "delivery san pedro sula", "hamburguesas sula", "dark kitchen honduras"],
  authors: [{ name: "Brasa Clandestina" }],
  creator: "Brasa Clandestina",
  openGraph: {
    type: "website",
    locale: "es_HN",
    url: "https://brasaclandestina.com",
    siteName: "Brasa Clandestina",
    title: "Brasa Clandestina | Parrilla Artesanal & Delivery",
    description: "Sabor a leña directo a tu puerta. San Pedro Sula.",
    images: [
      {
        url: "/og-image.jpg", // Asegúrate de tener esta imagen en public/
        width: 1200,
        height: 630,
        alt: "Brasa Clandestina - Parrilla Artesanal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Brasa Clandestina | Parrilla Artesanal",
    description: "Delivery de cortes premium y hamburguesas.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#111111",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  // Restaurant Schema Markup (JSON-LD)
  const restaurantJsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": "Brasa Clandestina",
    "description": "Dark kitchen de parrilla artesanal con delivery en San Pedro Sula.",
    "url": "https://brasaclandestina.com",
    "telephone": "+50499999999",
    "servesCuisine": "Parrilla, BBQ, Hamburguesas",
    "priceRange": "$$",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "San Pedro Sula",
      "addressCountry": "HN"
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Thursday", "Friday", "Saturday"],
        "opens": "18:30",
        "closes": "21:30"
      }
    ]
  };

  return (
    <html lang="es">
      <head>
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self' https: wss:; img-src 'self' https: data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd) }}
        />
      </head>
      <body className={`${inter.variable} ${playfair.variable} antialiased`}>
        <PwaRegister />
        {children}
        <CookieBanner />
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ""} />
      </body>
    </html>
  );
}
