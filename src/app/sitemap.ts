import type { MetadataRoute } from "next";
import { concepts } from "@/content/concepts";
import { lessons } from "@/content/lessons";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl;
  return [
    { url: base, priority: 1 },
    { url: `${base}/learn/`, priority: 0.9 },
    { url: `${base}/architect/`, priority: 0.9 },
    { url: `${base}/about/methodology/`, priority: 0.6 },
    ...lessons.map((lesson) => ({ url: `${base}/learn/${lesson.slug}/`, priority: 0.8 })),
    ...concepts.map((concept) => ({ url: `${base}/concepts/${concept.slug}/`, priority: 0.5 })),
  ];
}
