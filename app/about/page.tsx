import type { Metadata } from "next"
import { DEFAULT_OG_IMAGE, SITE_NAME, getAbsoluteUrl } from "@/lib/seo"

export const metadata: Metadata = {
  title: `About | ${SITE_NAME}`,
  description: "おひさまポータルについての説明、掲載方針、注意事項、お問い合わせ先をまとめたページです。",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: `About | ${SITE_NAME}`,
    description: "おひさまポータルについての説明、掲載方針、注意事項、お問い合わせ先をまとめたページです。",
    url: getAbsoluteUrl("/about"),
    type: "article",
    images: [getAbsoluteUrl(DEFAULT_OG_IMAGE)],
  },
  twitter: {
    card: "summary_large_image",
    title: `About | ${SITE_NAME}`,
    description: "おひさまポータルについての説明、掲載方針、注意事項、お問い合わせ先をまとめたページです。",
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
              本サイト「おひさまポータル」は
              日向坂46および所属事務所とは関係のない
              非公式のファンサイトです。

              YouTube、TVerなどの外部サービスで公開されている動画や番組情報を紹介しています。
            </p>

            <p>
              掲載している動画・配信情報・画像等の権利は
              各配信サービスおよび権利者に帰属します。

              また、リンク先サイトの内容やサービスについて
              本サイトは責任を負いません。
            </p>

            <p>
              掲載内容に問題がある場合は
              お問い合わせよりご連絡ください。
              確認の上、速やかに対応いたします。
            </p>
          </div>

          <div className="mt-8 border-t pt-6">
            <h2 className="text-base font-semibold">お問い合わせ</h2>
            <p className="text-muted-foreground text-sm mt-2">本サイトに関するお問い合わせは</p>
            <p className="text-muted-foreground text-sm">以下のXアカウントのDMまでお願いいたします。</p>
            <p className="text-muted-foreground text-sm mt-1">@hikozuma46</p>
          </div>

          <p className="text-muted-foreground text-xs mt-6">© {new Date().getFullYear()} おひさまポータル</p>
        </section>
      </div>
    </main>
  )
}
