import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SmoothScroller } from "@/shared/components/ui/SmoothScroller";
import Providers from "@/app/provider";
import GoogleAnalytics from "@/shared/components/GoogleAnalytics";
import { Suspense } from "react";
import { SearchStateInitializer } from "@/shared/components/SearchStateInitializer";
import Script from "next/script";

export const metadata: Metadata = {
  title: {
    template: "%s | checancha",
    default: "checancha",
  },
  description: "Página Oficial de CheCancha.",
  openGraph: {
    title: "checancha",
    description: "Página Oficial de CheCancha.",
    url: "https://www.checancha.com.ar",
    siteName: "checancha",
    images: [
      {
        url: "https://checancha.com/checanchalogo.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "checancha",
    description: "Página Oficial de CheCancha.",
    images: ["https://checancha.com/checanchalogo.png"],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CheCancha",
  },
};

export const viewport: Viewport = {
  themeColor: "#ff4e02", // brand-orange
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsClub",
    name: "checancha",
    url: "https://checancha.com",
    logo: "https://checancha.com/checanchalogo.png",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Independencia 3737",
      addressLocality: "Tostado",
      addressRegion: "Santa Fe",
      postalCode: "3060",
      addressCountry: "AR",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+54-11-54702118",
      contactType: "customer service",
    },
  };

  return (
    <html lang="es">
  <head>
    <link
      href="https://api.fontshare.com/v2/css?f[]=lora@400,401,500,600,601,700,701,1,2&f[]=satoshi@300,301,400,401,500,501,700,701,900,901,1,2&display=swap"
      rel="stylesheet"
    />
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  </head>
  <body className="antialiased">
    <Script
      src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
      strategy="afterInteractive"
      async
    />

    <Suspense>
      <SearchStateInitializer />
    </Suspense>

    <GoogleAnalytics />
    <SmoothScroller />
    <Providers>{children}</Providers>
  </body>
</html>
  );
}
