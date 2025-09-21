import type { MetadataRoute } from "next";
import { addBasePath } from "@/lib/paths";

// Ensure static generation for static HTML export
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lily’s Books",
    short_name: "Lily’s Books",
    description: "Official author site and store",
    start_url: addBasePath("/"),
    scope: addBasePath("/"),
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111111",
    icons: [
      {
        src: addBasePath("/icons/web-app-manifest-192x192.png"),
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: addBasePath("/icons/web-app-manifest-512x512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
