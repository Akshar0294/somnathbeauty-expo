import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Soft Shine Cosmetic",
    short_name: "Soft Shine",
    description: "Beauty and makeup products wholesale with curated beauty expos.",
    start_url: "/",
    display: "standalone",
    background_color: "#fcfcfb",
    theme_color: "#b76e79",
    icons: [{ src: "/LOGO.png", sizes: "1254x1254", type: "image/png", purpose: "maskable" }]
  };
}
