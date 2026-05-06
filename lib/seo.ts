export const SITE_NAME = "公開サンプルポータル"
export const SITE_DESCRIPTION = "架空のメンバーとサンプル動画データだけで構成した、Next.js 製の公開サンプルポータルです。"
export const DEFAULT_OG_IMAGE = "/logo.png"

export function getSiteUrl(): string {
  const candidate = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "http://localhost:3000"

  try {
    return new URL(candidate).toString().replace(/\/$/, "")
  } catch {
    return "http://localhost:3000"
  }
}

export function getAbsoluteUrl(path: string = "/"): string {
  return new URL(path, `${getSiteUrl()}/`).toString()
}

export function toJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c")
}

export function getSiteJsonLd() {
  const siteUrl = getSiteUrl()

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}#website`,
        url: siteUrl,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: "ja-JP",
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/all?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}#organization`,
        url: siteUrl,
        name: SITE_NAME,
        logo: {
          "@type": "ImageObject",
          url: getAbsoluteUrl(DEFAULT_OG_IMAGE),
        },
      },
    ],
  }
}