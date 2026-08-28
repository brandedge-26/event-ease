import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Event Ease",
    short_name: "Event Ease",
    description: "Pakistan's #1 venue discovery & booking platform",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#FF3B6B",
    categories: ["lifestyle", "travel", "entertainment"],
    icons: [
      {
        src: "/icons/iconX192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/iconX512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    screenshots: [
      {
        src: "/home/hero-bg.jpg",
        sizes: "1280x720",
        type: "image/jpeg",
        // @ts-expect-error — form_factor is valid in spec but not yet in TS types
        form_factor: "wide",
        label: "Event Ease — Discover Venues",
      },
    ],
  };
}
