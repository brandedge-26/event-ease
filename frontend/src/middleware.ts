import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const host  = request.headers.get("host") ?? "localhost:3000";
  const hostname = host.split(":")[0]; // strip port
  const parts    = hostname.split(".");

  // royalbanquet.localhost → ["royalbanquet", "localhost"] → slug = "royalbanquet"
  // localhost              → ["localhost"]                  → slug = "default"
  const vendorSlug =
    parts.length >= 2 && parts[0] !== "www" && parts[0] !== "localhost"
      ? parts[0]
      : "default";

  // On subdomain root "/" → rewrite to /profile (public profile page)
  if (vendorSlug !== "default" && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/profile";
    const res = NextResponse.rewrite(url);
    res.headers.set("x-vendor-slug", vendorSlug);
    return res;
  }

  // All other requests — just pass slug header through
  const res = NextResponse.next();
  res.headers.set("x-vendor-slug", vendorSlug);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
