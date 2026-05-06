import type { MetadataRoute } from "next"
import {
  VALID_CONTENT_TYPES,
  VALID_MEMBER_IDS,
  filterContentItems,
  getPublicPathForType,
  getPublicPathForTypeMember,
} from "@/lib/portal"
import { getAbsoluteUrl } from "@/lib/seo"

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = new Map<string, MetadataRoute.Sitemap[number]>()
  const now = new Date()

  const addRoute = (path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]) => {
    routes.set(path, {
      url: getAbsoluteUrl(path),
      lastModified: now,
      changeFrequency,
      priority,
    })
  }

  addRoute("/almost-over", 1, "hourly")
  addRoute("/all", 0.9, "hourly")

  for (const type of VALID_CONTENT_TYPES) {
    addRoute(getPublicPathForType(type), type === "all" ? 0.9 : 0.8, "hourly")

    for (const memberId of VALID_MEMBER_IDS) {
      if (filterContentItems({ type, memberIds: [memberId] }).length === 0) {
        continue
      }

      addRoute(getPublicPathForTypeMember(type, memberId), 0.7, "daily")
    }
  }

  return Array.from(routes.values())
}