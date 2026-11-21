import type { MetadataRoute } from "next";
import { BUSINESS } from "@/lib/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BUSINESS.name} · Policy Desk`,
    short_name: "Policy Desk",
    description: "Private policy, renewal and statement tracker.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f1b33",
    theme_color: "#0f1b33",
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
