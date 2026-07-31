import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

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

export const metadata: Metadata = {
  title: "Event Ease",
  description: "Pakistan's first Event Business Operating System",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sohne.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
