import type { Content } from "@/types/member"
import { getMemberName } from "@/lib/portal"
import { getAbsoluteUrl, getSiteUrl } from "@/lib/seo"

function parseDateString(value: string | undefined): string | undefined {
  if (!value) {
    return undefined
  }

  const trimmed = value.trim()
  const matched = trimmed.match(/^(\d{4})\/(\d{2})\/(\d{2})$/)
  if (!matched) {
    const parsed = new Date(trimmed)
    if (Number.isNaN(parsed.getTime())) {
      return undefined
    }
    return parsed.toISOString().slice(0, 10)
  }

  const [, year, month, day] = matched
  return `${year}-${month}-${day}`
}

function toHttpUrl(value: string | undefined): string | undefined {
  if (!value) {
    return undefined
  }

  try {
    const resolved = new URL(value.trim(), `${getSiteUrl()}/`)
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
      return undefined
    }
    return resolved.toString()
  } catch {
    return undefined
  }
}

function getThumbnailUrl(content: Content): string {
  if (
    content.thumbnail &&
    content.thumbnail !== "Y" &&
    content.thumbnail !== "T" &&
    !content.thumbnail.startsWith("/placeholder")
  ) {
    const thumbnailUrl = toHttpUrl(content.thumbnail)
    if (thumbnailUrl) {
      return thumbnailUrl
    }
  }

  return getAbsoluteUrl("/logo.png")
}

function getYoutubeVideoId(url: string): string | undefined {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, "")

    if (host === "youtu.be") {
      const shortId = parsed.pathname.replace(/^\//, "").split("/")[0]
      return shortId || undefined
    }

    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v") ?? undefined
      }

      if (parsed.pathname.startsWith("/shorts/") || parsed.pathname.startsWith("/embed/")) {
        const segments = parsed.pathname.split("/")
        return segments[2] || undefined
      }
    }

    return undefined
  } catch {
    return undefined
  }
}

function getEmbedUrl(content: Content): string | undefined {
  if (content.platform === "YouTube") {
    const videoId = getYoutubeVideoId(content.url)
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`
    }
  }
  return undefined
}

function getContentUrl(content: Content): string | undefined {
  return toHttpUrl(content.url)
}

function getVideoAccessFields(content: Content): { embedUrl?: string; contentUrl?: string } {
  const safeContentUrl = getContentUrl(content) ?? getSiteUrl()

  if (content.platform === "YouTube") {
    const embedUrl = getEmbedUrl(content)
    // If we cannot build embedUrl, keep a valid fallback URL to satisfy VideoObject requirements.
    if (!embedUrl) {
      return { contentUrl: safeContentUrl }
    }
    return { embedUrl }
  }

  return { contentUrl: safeContentUrl }
}

function getContentSchemaType(content: Content): "VideoObject" | "AudioObject" | "Article" | "CreativeWork" {
  if (content.type === "audio") {
    return "AudioObject"
  }

  if (content.type === "column") {
    return "Article"
  }

  if (content.type === "movie" || content.type === "tver") {
    return "VideoObject"
  }

  return "CreativeWork"
}

function buildDescription(content: Content, memberNames: string[]): string {
  if (content.description.trim()) {
    return content.description
  }

  if (memberNames.length > 0) {
    return `${memberNames.join("、")}に関連する${content.platform}のコンテンツです。`
  }

  return `${content.platform}で公開されているコンテンツです。`
}

export function toSchemaThing(content: Content) {
  const memberNames = content.members
    .filter((memberId) => memberId !== "almost-over")
    .map((memberId) => getMemberName(memberId))

  const schemaType = getContentSchemaType(content)
  const contentUrl = getContentUrl(content) ?? getSiteUrl()
  const publishDate = parseDateString(content.publishDate)
  const uploadDate = publishDate ?? new Date().toISOString().slice(0, 10)
  const videoAccessFields = getVideoAccessFields(content)

  return {
    "@type": schemaType,
    "@id": `${contentUrl}#content`,
    url: contentUrl,
    name: content.title,
    description: buildDescription(content, memberNames),
    datePublished: publishDate,
    ...(schemaType === "VideoObject" ? { uploadDate } : {}),
    ...(schemaType === "VideoObject" ? videoAccessFields : {}),
    thumbnailUrl: getThumbnailUrl(content),
    inLanguage: "ja-JP",
    isAccessibleForFree: true,
    publisher: {
      "@type": "Organization",
      name: content.platform,
    },
    creator: memberNames.length > 0
      ? memberNames.map((name) => ({
          "@type": "Person",
          name,
        }))
      : undefined,
    about: memberNames.length > 0
      ? memberNames.map((name) => ({
          "@type": "Person",
          name,
        }))
      : undefined,
    isPartOf: {
      "@id": `${getSiteUrl()}#website`,
    },
  }
}

export function buildCollectionPageStructuredData({
  canonicalPath,
  pageHeading,
  pageSummary,
  breadcrumbItems,
  items,
}: {
  canonicalPath: string
  pageHeading: string
  pageSummary: string
  breadcrumbItems: Array<{ name: string; item: string }>
  items: Content[]
}) {
  const canonicalUrl = getAbsoluteUrl(canonicalPath)
  const topItems = items.slice(0, 12)

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: pageHeading,
        description: pageSummary,
        inLanguage: "ja-JP",
        isPartOf: {
          "@id": `${getSiteUrl()}#website`,
        },
        breadcrumb: {
          "@id": `${canonicalUrl}#breadcrumb`,
        },
        mainEntity: {
          "@id": `${canonicalUrl}#itemlist`,
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumb`,
        itemListElement: breadcrumbItems.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: item.item,
        })),
      },
      {
        "@type": "ItemList",
        "@id": `${canonicalUrl}#itemlist`,
        itemListOrder: "https://schema.org/ItemListUnordered",
        numberOfItems: items.length,
        itemListElement: topItems.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@id": `${item.url}#content`,
          },
        })),
      },
      ...topItems.map((item) => toSchemaThing(item)),
    ],
  }
}
