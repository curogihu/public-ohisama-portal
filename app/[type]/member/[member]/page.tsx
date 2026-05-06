import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import HinatazakaPortal from "../../../../hinatazaka-portal"
import {
  buildPortalInitialState,
  filterContentItems,
  getMemberNames,
  getPortalPageHeading,
  getPortalPageSummary,
  getPublicPathForTypeMember,
  getTypeLabel,
  isValidContentType,
} from "@/lib/portal"
import { DEFAULT_OG_IMAGE, SITE_NAME, getAbsoluteUrl, toJsonLd } from "@/lib/seo"
import { buildCollectionPageStructuredData } from "@/lib/structured-data"

type TypeMemberPageProps = {
  params: Promise<{ type: string; member: string }>
  searchParams: Promise<{ q?: string; page?: string }>
}

const DEPRECATED_ADDED_PATHS = new Set(["added", "new"])

export async function generateMetadata({ params, searchParams }: TypeMemberPageProps): Promise<Metadata> {
  const { type, member } = await params
  const resolvedSearchParams = await searchParams
  const initialState = buildPortalInitialState({ type, member }, resolvedSearchParams)
  const typeLabel = getTypeLabel(type)
  const memberLabels = getMemberNames(initialState.selectedMembers)
  const memberLabel = memberLabels.length > 0 ? memberLabels.join(" / ") : "メンバー未指定"
  const title = initialState.searchQuery
    ? `${memberLabel}の${typeLabel}一覧 「${initialState.searchQuery}」 | ${SITE_NAME}`
    : `${memberLabel}の${typeLabel}一覧 | ${SITE_NAME}`
  const description = initialState.searchQuery
    ? `${memberLabel}に関連する${typeLabel}を「${initialState.searchQuery}」で絞り込んで確認できる日向坂46ファンサイトです。`
    : `${memberLabel}に関連する${typeLabel}を一覧で確認できる日向坂46ファンサイトです。`
  const canonicalPath = getPublicPathForTypeMember(type, member)
  const hasQueryFilters = Boolean(initialState.searchQuery)
    || Boolean(resolvedSearchParams.page && resolvedSearchParams.page !== "1")
    || initialState.selectedMembers.length !== 1

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

export default async function TypeMemberPage({ params, searchParams }: TypeMemberPageProps) {
  const { type } = await params
  const { member } = await params
  const resolvedSearchParams = await searchParams

  if (DEPRECATED_ADDED_PATHS.has(type)) {
    redirect("/all")
  }

  if (!isValidContentType(type)) {
    notFound()
  }

  const initialState = buildPortalInitialState({ type, member }, resolvedSearchParams)

  if (initialState.selectedMembers.length === 0) {
    notFound()
  }

  const pageHeading = getPortalPageHeading(initialState)
  const pageSummary = getPortalPageSummary(initialState)
  const canonicalPath = getPublicPathForTypeMember(type, member)
  const itemList = filterContentItems({
    type: initialState.selectedType,
    memberIds: initialState.selectedMembers,
    query: initialState.searchQuery,
  })

  const structuredData = buildCollectionPageStructuredData({
    canonicalPath,
    pageHeading,
    pageSummary,
    items: itemList,
    breadcrumbItems: [
      { name: "ホーム", item: getAbsoluteUrl("/almost-over") },
      { name: "メンバーで探す", item: getAbsoluteUrl("/all") },
      { name: getTypeLabel(type), item: getAbsoluteUrl(`/${type}`) },
      { name: getMemberNames(initialState.selectedMembers).join(" / "), item: getAbsoluteUrl(canonicalPath) },
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