import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Everything under these paths requires sign-in anyway - no value
        // in a crawler indexing pages it'll just get redirected away from.
        disallow: [
          "/dashboard",
          "/chat",
          "/chapters",
          "/leaderboard",
          "/progress",
          "/sandbox",
          "/exam",
          "/achievements",
          "/projects",
          "/interview",
          "/admin",
          "/onboarding",
          "/api",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
