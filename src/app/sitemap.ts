import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

  // Only the genuinely public pages - everything else requires auth, so
  // there's no point (and some downside) listing it for crawlers.
  return [
    { url: baseUrl, changeFrequency: "monthly", priority: 1 },
    { url: `${baseUrl}/sign-up`, changeFrequency: "yearly", priority: 0.8 },
    { url: `${baseUrl}/sign-in`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${baseUrl}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
