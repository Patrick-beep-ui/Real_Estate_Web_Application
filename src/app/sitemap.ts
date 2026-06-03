import { MetadataRoute } from "next";
import { SITUATIONS } from "@/lib/data/situations";
import { MARKETS } from "@/lib/data/markets";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://tarekkbuyshouses.com";
  
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/markets`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date("2026-04-07"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date("2026-04-07"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/do-not-sell`,
      lastModified: new Date("2026-04-07"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  const situations = Object.keys(SITUATIONS);
  const markets = Object.keys(MARKETS);

  const dynamicPages: MetadataRoute.Sitemap = [];

  for (const situation of situations) {
    for (const market of markets) {
      dynamicPages.push({
        url: `${baseUrl}/${situation}/${market}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      });
    }
  }

  return [...staticPages, ...dynamicPages];
}
