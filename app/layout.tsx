import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kiosco-update.vercel.app"),
  title: "Alakary | Menú Digital, Pizzas y Delivery Online",
  description:
    "Explorá el menú digital de Alakary. Pedí online pizzas artesanales, empanadas, minutas y bebidas con delivery rápido y promociones exclusivas.",
  applicationName: "Alakary",
  authors: [{ name: "Alakary" }],
  keywords: [
    "Alakary",
    "Menú Digital",
    "Pizzas Artesanales",
    "Empanadas",
    "Delivery Online",
    "Pedidos Online",
    "Comida Rápida",
    "Buenos Aires",
  ],
  alternates: {
    canonical: "https://kiosco-update.vercel.app/",
  },
  icons: {
    icon: "/assets/images/logo.png",
    shortcut: "/assets/images/logo.png",
    apple: "/assets/images/logo.png",
  },
  openGraph: {
    title: "Alakary | Menú Digital, Pizzas y Delivery Online",
    description:
      "Explorá el menú digital de Alakary. Pedí online pizzas artesanales, empanadas, minutas y bebidas con delivery rápido.",
    url: "https://kiosco-update.vercel.app/",
    siteName: "Alakary",
    images: [
      {
        url: "/assets/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Alakary - Menú Digital, Pizzas y Delivery Online",
      },
    ],
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Alakary | Menú Digital, Pizzas y Delivery Online",
    description:
      "Explorá el menú digital de Alakary. Pedí online pizzas artesanales, empanadas y bebidas con delivery rápido.",
    images: ["/assets/images/og-image.jpg"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Alakary",
  },
  category: "food",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FF6B00",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider localization={esES}>
      <html
        lang="es"
        className={`${geistSans.variable} ${geistMono.variable}`}
      >
        <head>
          <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          />
          <link rel="stylesheet" href="/assets/css/bootstrap.min.css" />
          <link rel="stylesheet" href="/assets/css/theme-variables.css" />
          <link rel="stylesheet" href="/assets/css/modern-app.css" />

          {/* Instant Dark Mode Pre-loader */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    var saved = localStorage.getItem('kiosco_theme');
                    var theme = saved ? saved : 'dark';
                    document.documentElement.setAttribute('data-theme', theme);
                  } catch (e) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                  }
                })();
              `,
            }}
          />

          {/* Schema.org Structured Data (JSON-LD) for Local Business & Menu */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@graph": [
                  {
                    "@type": "Restaurant",
                    "@id": "https://kiosco-update.vercel.app/#restaurant",
                    "name": "Alakary",
                    "image": "https://kiosco-update.vercel.app/assets/images/og-image.jpg",
                    "url": "https://kiosco-update.vercel.app/",
                    "telephone": "+5491172570867",
                    "priceRange": "$$",
                    "servesCuisine": ["Comida Rápida", "Pizzas", "Empanadas", "Minutas", "Panchos"],
                    "address": {
                      "@type": "PostalAddress",
                      "streetAddress": "Paderewski 366",
                      "addressLocality": "Buenos Aires",
                      "addressCountry": "AR"
                    },
                    "openingHoursSpecification": [
                      {
                        "@type": "OpeningHoursSpecification",
                        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                        "opens": "11:00",
                        "closes": "14:00"
                      },
                      {
                        "@type": "OpeningHoursSpecification",
                        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                        "opens": "20:00",
                        "closes": "23:59"
                      }
                    ],
                    "hasMenu": "https://kiosco-update.vercel.app/",
                    "potentialAction": {
                      "@type": "OrderAction",
                      "target": {
                        "@type": "EntryPoint",
                        "urlTemplate": "https://kiosco-update.vercel.app/",
                        "inLanguage": "es-AR",
                        "actionPlatform": [
                          "http://schema.org/DesktopWebPlatform",
                          "http://schema.org/MobileWebPlatform"
                        ]
                      },
                      "deliveryMethod": [
                        "http://purl.org/goodrelations/v1#DeliveryModeDirectDownload",
                        "http://purl.org/goodrelations/v1#DeliveryModeOwnFleet"
                      ]
                    }
                  },
                  {
                    "@type": "Menu",
                    "@id": "https://kiosco-update.vercel.app/#menu",
                    "name": "Menú Digital Alakary",
                    "url": "https://kiosco-update.vercel.app/",
                    "mainEntityOfPage": "https://kiosco-update.vercel.app/",
                    "inLanguage": "es-AR"
                  }
                ]
              }),
            }}
          />
        </head>
        <body className="antialiased overflow-x-hidden">
          {/* Google tag (gtag.js) GA4 */}
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-X1RFGB96TT"
            strategy="afterInteractive"
          />
          <Script id="google-analytics-ga4" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-X1RFGB96TT');
            `}
          </Script>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
