import type { MetadataRoute } from "next";

const SITE_URL = "https://geteventease.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/vendor/dashboard",
          "/vendor/general",
          "/vendor/login",
          "/login",
          "/register",
          "/auth",
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
