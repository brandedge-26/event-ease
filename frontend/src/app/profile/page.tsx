import { headers } from "next/headers";
import { getVendor } from "@/lib/vendorData";
import PublicProfile from "./PublicProfile";

export default async function ProfilePage() {
  const h    = await headers();
  const slug = h.get("x-vendor-slug") ?? "royalbanquet";
  const vendor = getVendor(slug);
  return <PublicProfile vendor={vendor} vendorId="" />;
}
