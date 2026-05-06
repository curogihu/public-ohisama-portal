import type { Metadata } from "next"
import { DEFAULT_OG_IMAGE, SITE_NAME, getAbsoluteUrl } from "@/lib/seo"

export const metadata: Metadata = {
  title: `About | ${SITE_NAME}`,
  description: "公開サンプルポータルの説明、掲載方針、注意事項をまとめたページです。",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: `About | ${SITE_NAME}`,
    description: "公開サンプルポータルの説明、掲載方針、注意事項をまとめたページです。",
    url: getAbsoluteUrl("/about"),
    type: "article",
    images: [getAbsoluteUrl(DEFAULT_OG_IMAGE)],
  },
  twitter: {
    card: "summary_large_image",
    title: `About | ${SITE_NAME}`,
    description: "公開サンプルポータルの説明、掲載方針、注意事項をまとめたページです。",
    images: [getAbsoluteUrl(DEFAULT_OG_IMAGE)],
  },
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <section className="bg-white border rounded-lg p-6 md:p-8 shadow-sm">
          <h1 className="text-2xl font-bold mb-6">About</h1>

          <div className="space-y-4 text-sm md:text-base text-muted-foreground leading-relaxed">
            <p>
              本サイト「公開サンプルポータル」は、公開用に調整したデモアプリです。
              掲載しているメンバー名、番組名、説明文、更新日時はすべてサンプルとして作成した架空データです。
            </p>

            <p>
              外部リンクには example.com を利用しており、実在する動画・番組・人物データは参照していません。
              このリポジトリは画面構成、絞り込み、SEO設定などの実装例を共有する目的で公開しています。
            </p>

            <p>
              問い合わせ先や運用窓口は設定していません。
              必要に応じて利用者の環境に合わせて文言やデータを差し替えて利用してください。
            </p>
          </div>

          <p className="text-muted-foreground text-xs mt-6">© {new Date().getFullYear()} 公開サンプルポータル</p>
        </section>
      </div>
    </main>
  )
}
