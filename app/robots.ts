import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://kiosco-app-steel.vercel.app";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/panel", "/api/", "/sign-in", "/sign-up"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
