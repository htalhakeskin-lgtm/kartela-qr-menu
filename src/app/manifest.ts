import type { MetadataRoute } from "next";

import { platformDefaults } from "@/config/platform-defaults";

/** Web manifest of the platform host (Z-19). Each venue has its own, scoped to its domain (D-13). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: platformDefaults.name,
    short_name: platformDefaults.name,
    description: platformDefaults.seo.defaultDescription,
    lang: "tr",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f7f5",
    theme_color: "#f7f7f5",
    icons: [{ src: "/kartela-icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
