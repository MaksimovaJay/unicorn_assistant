import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Unicorn Assistant",
    short_name: "Unicorn",
    description: "Рабочее пространство",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#FEF3F3",
    theme_color: "#F996A5",
    orientation: "portrait",
    icons: [
      {
        src: "/icon_web.png",
        sizes: "any",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };
}
