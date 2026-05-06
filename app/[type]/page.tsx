import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import HinatazakaPortal from "../../hinatazaka-portal"
import {
  buildPortalInitialState,
  filterContentItems,
  getMemberNames,
  getPortalPageHeading,
  getPortalPageSummary,
  getPublicPathForType,
  getTypeLabel,
  isValidContentType,
} from "@/lib/portal"
import { DEFAULT_OG_IMAGE, SITE_NAME, getAbsoluteUrl, toJsonLd } from "@/lib/seo"
import { buildCollectionPageStructuredData } from "@/lib/structured-data"

type TypePageProps = {
  params: Promise<{ type: string }>
  searchParams: Promise<{ type?: string; members?: string; q?: string; page?: string }>
}

const DEPRECATED_ADDED_PATHS = new Set(["added", "new"])

export async function generateMetadata({ params, searchParams }: TypePageProps): Promise<Metadata> {
  const { type } = await params
  const resolvedSearchParams = await searchParams
  const initialState = buildPortalInitialState({ type }, resolvedSearchParams)
  const typeLabel = getTypeLabel(type)
  const memberLabels = getMemberNames(initialState.selectedMembers)
  const conditions: string[] = []

  if (type === "almost-over" && initialState.selectedType !== "all") {
    conditions.push(getTypeLabel(initialState.selectedType))
  }
  if (memberLabels.length > 0) {
    conditions.push(memberLabels.join(" / "))
  }
  if (initialState.searchQuery) {
    conditions.push(`「${initialState.searchQuery}」`)
  }

  const title = conditions.length > 0
    ? `${typeLabel}一覧 ${conditions.join(" / ")} | ${SITE_NAME}`
    : `${typeLabel}一覧 | ${SITE_NAME}`
  const description = type === "almost-over"
    ? conditions.length > 0
      ? `公開サンプルの配信終了が近いコンテンツを ${conditions.join(" / ")} で絞り込んで確認できます。`
      : "公開サンプルの配信終了が近いコンテンツを、YouTube や TVer の体裁で一覧表示します。"
    : initialState.selectedType === "all"
      ? "架空メンバーのサンプルコンテンツを一覧で確認できるデモページです。YouTube、TVer、音声、コラムを模したデータを横断表示します。"
      : `公開サンプルの${typeLabel}を一覧で確認できるデモページです。メンバー名やキーワードでも絞り込めます。`
  const canonicalPath = getPublicPathForType(type)
  const hasQueryFilters = Boolean(initialState.searchQuery)
    || Boolean(resolvedSearchParams.page && resolvedSearchParams.page !== "1")
    || (type === "almost-over" && (initialState.selectedType !== "all" || initialState.selectedMembers.length > 0))

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    robots: hasQueryFilters
      ? {
          index: false,
          follow: true,
        }
      : {
          index: true,
          follow: true,
        },
    openGraph: {
      title,
      description,
      url: getAbsoluteUrl(canonicalPath),
      siteName: SITE_NAME,
      locale: "ja_JP",
      type: "website",
      images: [getAbsoluteUrl(DEFAULT_OG_IMAGE)],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [getAbsoluteUrl(DEFAULT_OG_IMAGE)],
    },
  }
}

export default async function TypePage({ params, searchParams }: TypePageProps) {
  const { type } = await params
  const resolvedSearchParams = await searchParams

  if (DEPRECATED_ADDED_PATHS.has(type)) {
    redirect("/all")
  }

  if (type !== "almost-over" && !isValidContentType(type)) {
    notFound()
  }

  const initialState = buildPortalInitialState({ type }, resolvedSearchParams)
  const pageHeading = getPortalPageHeading(initialState)
  const pageSummary = getPortalPageSummary(initialState)
  const canonicalPath = getPublicPathForType(type)
  const itemList = filterContentItems({
    type: initialState.selectedType,
    memberIds: initialState.selectedMembers,
    query: initialState.searchQuery,
    onlyAlmostOver: type === "almost-over",
  })

  const structuredData = buildCollectionPageStructuredData({
    canonicalPath,
    pageHeading,
    pageSummary,
    items: itemList,
    breadcrumbItems: type === "almost-over"
      ? [
          { name: "ホーム", item: getAbsoluteUrl("/almost-over") },
          { name: "まもなく配信終了", item: getAbsoluteUrl(canonicalPath) },
        ]
      : [
          { name: "ホーム", item: getAbsoluteUrl("/almost-over") },
          { name: "メンバーで探す", item: getAbsoluteUrl("/all") },
          { name: getTypeLabel(type), item: getAbsoluteUrl(canonicalPath) },
        ],
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(structuredData) }}
      />
      <HinatazakaPortal initialState={initialState} />
    </>
  )
}
