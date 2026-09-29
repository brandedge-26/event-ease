import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import UserAuthProvider from "@/components/UserAuthProvider";

const sohne = localFont({
  src: [
    {
      path: "../../public/fonts/sohne-400-normal (1).woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/sohne-500-normal.woff",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/sohne-700-normal.woff",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-sohne",
});

const SITE_URL = "https://geteventease.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: "%s — Event Ease",
    default:  "Event Ease — Pakistan's #1 Venue & Event Vendor Booking Platform",
  },
  description:
    "Event Ease (getEventEase) is Pakistan's leading platform to discover, compare & book banquet halls, marquees, photographers, decorators, caterers & more. Verified vendors, real reviews, zero commission.",
  keywords: [
    "Event Ease", "EventEase", "Event Eaze", "Eventeaze", "Evantease",
    "GetEventEase", "Get Event Ease", "geteventease.com",
    "event venues Pakistan", "banquet hall booking Pakistan", "marquee booking",
    "wedding venues Pakistan", "event planning Pakistan", "book venue online Pakistan",
    "Karachi banquet halls", "Lahore wedding venues", "Islamabad marquees",
    "list your business Event Ease", "event vendor marketplace Pakistan",
  ],
  authors: [{ name: "Event Ease" }],
  creator: "Event Ease",
  publisher: "Event Ease",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type:        "website",
    locale:      "en_PK",
    url:         SITE_URL,
    siteName:    "Event Ease",
    title:       "Event Ease — Pakistan's #1 Venue & Event Vendor Booking Platform",
    description:
      "Discover, compare & book verified banquet halls, marquees, photographers, decorators & caterers across Pakistan. Real reviews, zero commission.",
    images: [
      {
        url:    "/icons/iconX512.png",
        width:  512,
        height: 512,
        alt:    "Event Ease",
      },
    ],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Event Ease — Pakistan's #1 Venue & Event Vendor Booking Platform",
    description: "Discover, compare & book verified venues and event vendors across Pakistan.",
    images:      ["/icons/iconX512.png"],
  },
  robots: {
    index:  true,
    follow: true,
    googleBot: {
      index:               true,
      follow:              true,
      "max-image-preview": "large",
      "max-snippet":       -1,
    },
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/icons/iconX192.png",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Event Ease",
  },
};

// Structured data: tells Google this one entity is also searched as "Event Eaze",
// "Evantease", "EventEase" etc., so those variant spellings resolve to this brand.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Event Ease",
      alternateName: [
        "EventEase",
        "Event Eaze",
        "Eventeaze",
        "Evantease",
        "Eventease",
        "Get Event Ease",
        "GetEventEase",
      ],
      url: SITE_URL,
      logo: `${SITE_URL}/icons/iconX512.png`,
      description: "Pakistan's #1 venue discovery & event vendor booking platform.",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "Event Ease",
      alternateName: ["EventEase", "Event Eaze", "Evantease", "GetEventEase"],
      url: SITE_URL,
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/venues?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sohne.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AuthProvider>
          <UserAuthProvider>{children}</UserAuthProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
