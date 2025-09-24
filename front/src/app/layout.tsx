import type { Metadata } from "next";
import "./globals.css";
import { SmoothScroller } from "@/shared/components/ui/SmoothScroller";
import Providers from "@/app/provider";

export const metadata: Metadata = {
  title: {
    template: "%s | checancha",
    default: "checancha",
  },
  description: "Página Oficial del checancha.",
  openGraph: {
    title: "checancha",
    description: "Página Oficial del checancha.",
    url: "https://www.checancha.com.ar",
    siteName: "checancha",
    images: [
      {
        url: "https://checancha.vercel.app/logochecancha.png",
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
    description: "Página Oficial del checancha.",
    images: ["https://checancha.vercel.app/logochecancha.png"],
  },
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
    url: "https://checancha.vercel.app",
    logo: "https://checancha.vercel.app/logochecancha.png",
    address: {
      "@type": "PostalAddress",
      streetAddress: "9 de Julio y San Martín",
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
      <body className={`antialiased`}>
        <SmoothScroller />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
