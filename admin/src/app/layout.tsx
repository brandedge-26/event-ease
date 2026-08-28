import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import AdminShell from "./AdminShell";

const sohne = localFont({
  src: [
    { path: "../../public/fonts/sohne-400-normal (1).woff", weight: "400", style: "normal" },
    { path: "../../public/fonts/sohne-500-normal.woff",     weight: "500", style: "normal" },
    { path: "../../public/fonts/sohne-700-normal.woff",     weight: "700", style: "normal" },
  ],
  variable: "--font-sohne",
});

export const metadata: Metadata = {
  title: {
    template: "%s — Event Ease Admin",
    default:  "Event Ease Admin",
  },
  description: "Event Ease Admin Dashboard",
  icons: {
    icon: "/favicon.svg",
    apple: "/icons/iconX192.png",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "EE Admin",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sohne.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
