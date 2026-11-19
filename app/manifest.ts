import type { MetadataRoute } from "next"
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/almost-over",
    display: "standalone",
    background_color: "#fff7fb",
    theme_color: "#f43f5e",
    lang: "ja",
    icons: [{ src: "/demo-logo.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  }
}
