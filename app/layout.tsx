import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { DEFAULT_OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, getAbsoluteUrl, getSiteJsonLd, getSiteUrl, toJsonLd } from "@/lib/seo"

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  manifest: "/manifest.webmanifest",
  keywords: ["日向坂46", "おひさま", "YouTube", "TVer", "ラジオ", "コラム", "動画一覧", "配信終了"],
  category: "entertainment",
  other: {
    "google-adsense-account": "ca-pub-2272063808695793",
  },
  verification: {
    google: "pzDJ2JdleA9ozPd2fL8LFq1sxWsmlPrnrSWXyTwHl9I",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: getSiteUrl(),
    siteName: SITE_NAME,
    locale: "ja_JP",
    type: "website",
    images: [
      {
        url: getAbsoluteUrl(DEFAULT_OG_IMAGE),
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [getAbsoluteUrl(DEFAULT_OG_IMAGE)],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: toJsonLd(getSiteJsonLd()) }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
