import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Alakary — Menú Digital y Pedidos Online",
    short_name: "Alakary",
    description: "Pedí online en Alakary. Menú digital actualizado, pizzas artesanales y delivery rápido.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f9fa",
    theme_color: "#FF6B00",
    icons: [
      {
        src: "/assets/images/logo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/assets/images/logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
