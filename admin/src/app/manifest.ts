import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Event Ease Admin",
    short_name: "EE Admin",
    description: "Event Ease Admin Dashboard",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#111827",
    theme_color: "#FF3B6B",
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
  };
}
