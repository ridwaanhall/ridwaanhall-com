import type { MetadataRoute } from "next";

/**
 * The web app manifest.
 *
 * A port of templates/site.webmanifest, which Django rendered through a view so
 * its `{% static %}` tags would resolve. Served at `/manifest.webmanifest`,
 * which the root layout points at.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ridwan Halim",
    short_name: "ridwaanhall",
    start_url: "/",
    display: "standalone",
    theme_color: "#000000",
    background_color: "#000000",
    icons: [
      { src: "/favicon/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/favicon/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
