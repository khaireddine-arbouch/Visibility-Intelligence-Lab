import type React from "react"
import type { Metadata, Viewport } from "next"
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ErrorBoundary } from "@/components/error-boundary"
import { SupabaseDataProvider } from "@/lib/data/supabase-data-context"
import "./globals.css"

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: {
    default: "Visibility Intelligence Lab",
    template: "%s | Visibility Intelligence Lab",
  },
  description:
    "Research-grade analytical dashboard for auditing search engine visibility and media power concentration. Analyze structural asymmetries in Google Search results, media ownership patterns, and algorithmic attention distribution.",
  keywords: [
    "search engine visibility",
    "media power concentration",
    "algorithmic bias",
    "media ownership",
    "search engine optimization",
    "media analysis",
    "visibility audit",
    "digital colonialism",
    "platform capitalism",
    "media research",
  ],
  authors: [{ name: "Visibility Intelligence Lab" }],
  creator: "Visibility Intelligence Lab",
  publisher: "Visibility Intelligence Lab",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://visibility-intelligence-lab.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Visibility Intelligence Lab",
    description:
      "Research-grade analytical dashboard for auditing search engine visibility and media power concentration. Analyze structural asymmetries in Google Search results.",
    siteName: "Visibility Intelligence Lab",
    images: [
      {
        url: "/BK logo.png",
        width: 1200,
        height: 630,
        alt: "Visibility Intelligence Lab",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Visibility Intelligence Lab",
    description:
      "Research-grade analytical dashboard for auditing search engine visibility and media power concentration.",
    images: ["/BK logo.png"],
    creator: "@visibilitylab",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      {
        url: "/BK logo.svg",
        type: "image/svg+xml",
      },
      {
        url: "/BK logo.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/BK logo.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: "/BK logo.svg",
  },
  verification: {
    // Add your verification codes here when available
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#141414" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://visibility-intelligence-lab.vercel.app"
  
  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Visibility Intelligence Lab",
    "description": "Research-grade analytical dashboard for auditing search engine visibility and media power concentration",
    "url": siteUrl,
    "applicationCategory": "ResearchApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "creator": {
      "@type": "Individual",
      "name": "Khaireddine Arbouch"
    },
    "featureList": [
      "Search engine visibility analysis",
      "Media power concentration metrics",
      "Ownership mapping",
      "Geopolitical media analysis",
      "Temporal drift tracking",
      "Advertising influence analysis"
    ]
  }

  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} font-sans antialiased`}>
        <ErrorBoundary>
          <SupabaseDataProvider>
            {children}
          </SupabaseDataProvider>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  )
}
