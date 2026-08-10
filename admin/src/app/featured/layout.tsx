import type { Metadata } from "next";
export const metadata: Metadata = { title: "Featured Listings" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
