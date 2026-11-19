import membersData from "@/data/members.json"
import tverData from "@/data/content.tver.target.json"
import youtubeData from "@/data/content.youtube.target.json"
import otherData from "@/data/content.other.target.json"
import demo from "@/data/demo.json"
import type { Content, Member } from "@/types/member"

const members: Member[] = membersData
// JSON imports widen literal types. Check the contract instead of suppressing type errors.
function readContent(items: Array<Omit<Content, "type"> & { type: string }>): Content[] {
  return items.map((item) => {
    const type = item.type
    if (type !== "movie" && type !== "audio" && type !== "tver" && type !== "column") {
      throw new Error("Invalid demo content type")
    }
    return { ...item, type }
  })
}
const tverContent = readContent(tverData.content)
const uploadedYoutubeContent = readContent(youtubeData.content)

export type ContentType =
  | "all"
  | "youtube-movie"
  | "youtube-shorts"
  | "youtube-live"
  | "movie"
  | "audio"
  | "tver"
  | "column"

export type ViewMode = "almost-over" | "search"

export type PortalInitialState = {
  activeViewMode: ViewMode
  selectedType: ContentType
  selectedMembers: string[]
  searchQuery: string
  currentPage: number
}

export const MAX_QUERY_LENGTH = 100
export const MAX_MEMBER_FILTERS = 50
export const MAX_PAGE = 1000
export const DEFAULT_VIEW_MODE: ViewMode = "almost-over"
export const LEGACY_SEARCH_PATH = "search"
export const MEMBER_SEGMENT = "member"

export const VIEW_MODE_PATHS: Record<ViewMode, string> = {
  "almost-over": "almost-over",
  search: "all",
}

export const TYPE_LABEL_MAP: Record<string, string> = {
  all: "全て",
  "youtube-movie": "YouTube動画",
  "youtube-shorts": "YouTubeショート動画",
  "youtube-live": "YouTube配信",
  movie: "動画",
  audio: "音声",
  tver: "TVer",
  column: "コラム",
}

export const CONTENT_TYPE_OPTIONS: Array<{ id: ContentType; label: string }> = [
  { id: "all", label: "全て" },
  { id: "youtube-movie", label: "YouTube動画" },
  { id: "youtube-shorts", label: "YouTubeショート動画" },
  { id: "youtube-live", label: "YouTube配信" },
  { id: "audio", label: "音声" },
  { id: "tver", label: "TVer" },
  { id: "column", label: "コラム" },
]

export const VALID_CONTENT_TYPES: ContentType[] = CONTENT_TYPE_OPTIONS.map((option) => option.id)
export const NON_MEMBER_FILTER_IDS = new Set(["youtube-movie", "youtube-shorts", "youtube-live", "tver"])
export const VALID_MEMBER_IDS = new Set(
  members.filter((member) => !NON_MEMBER_FILTER_IDS.has(member.id)).map((member) => member.id),
)

// Demo-only semantics: explicit timestamps and a fixed clock, independent of production rules.
export const DEMO_REFERENCE_TIME = demo.referenceTime
export const FAVORITE_MEMBER_IDS = VALID_MEMBER_IDS
export const ALL_CONTENT: Content[] = [...tverContent, ...uploadedYoutubeContent, ...readContent(otherData.content)]

export function isAlmostOver(item: Content): boolean {
  if (!item.expiresAt) return false
  const remaining = Date.parse(item.expiresAt) - Date.parse(DEMO_REFERENCE_TIME)
  return remaining >= 0 && remaining <= demo.expiryWindowDays * 86400000
}

export function expiryDayOffset(item: Content): number | null {
  if (!item.expiresAt) return null
  const dateInJapan = (value: string) => new Date(Date.parse(value) + 9 * 3600000).toISOString().slice(0, 10)
  return (Date.parse(dateInJapan(item.expiresAt)) - Date.parse(dateInJapan(DEMO_REFERENCE_TIME))) / 86400000
}

export function isValidContentType(value: string): value is ContentType {
  return VALID_CONTENT_TYPES.includes(value as ContentType)
}

export function getTypeLabel(type: string): string {
  return type === "almost-over" ? "まもなく配信終了" : TYPE_LABEL_MAP[type] ?? type
}

export function getMemberName(memberId: string): string {
  if (memberId.toLowerCase().includes("tver")) {
    return "TVer"
  }

  return members.find((entry) => entry.id === memberId)?.name ?? memberId
}

export function getMemberNames(memberIds: string[]): string[] {
  return memberIds.map((memberId) => getMemberName(memberId)).filter(Boolean)
}

export function sanitizeQuery(value?: string): string {
  return value?.trim().slice(0, MAX_QUERY_LENGTH) ?? ""
}

export function parsePageNumber(value?: string): number {
  const parsedPage = Number.parseInt(value ?? "1", 10)
  if (Number.isNaN(parsedPage) || parsedPage < 1) {
    return 1
  }

  return Math.min(parsedPage, MAX_PAGE)
}

export function parseMemberIds(value?: string): string[] {
  if (!value) {
    return []
  }

  return Array.from(
    new Set(
      value
        .split(",")
        .map((memberId) => {
          try { return decodeURIComponent(memberId.trim()) } catch { return "" }
        })
        .filter((memberId) => VALID_MEMBER_IDS.has(memberId)),
    ),
  ).slice(0, MAX_MEMBER_FILTERS)
}

export function matchesSelectedType(item: Content, selectedType: ContentType): boolean {
  if (selectedType === "all") {
    return true
  }

  if (selectedType === "youtube-movie") {
    return item.members.includes("youtube-movie")
  }

  if (selectedType === "youtube-shorts") {
    return item.members.includes("youtube-shorts")
  }

  if (selectedType === "youtube-live") {
    return item.members.includes("youtube-live")
  }

  if (selectedType === "tver") {
    return item.members.includes("tver")
  }

  return item.type === selectedType
}

export function filterContentItems({
  type,
  memberIds = [],
  query = "",
  onlyAlmostOver = false,
}: {
  type: ContentType
  memberIds?: string[]
  query?: string
  onlyAlmostOver?: boolean
}): Content[] {
  const normalizedQuery = query.toLowerCase()

  return ALL_CONTENT.filter((item) => {
    if (!matchesSelectedType(item, type)) {
      return false
    }

    if (onlyAlmostOver && !isAlmostOver(item)) {
      return false
    }

    if (memberIds.length > 0 && !memberIds.some((memberId) => item.members.includes(memberId))) {
      return false
    }

    if (!normalizedQuery) {
      return true
    }

    const matchesTitle = item.title.toLowerCase().includes(normalizedQuery)
    const matchesDescription = item.description.toLowerCase().includes(normalizedQuery)
    const matchesMember = item.members.some((memberId) => getMemberName(memberId).toLowerCase().includes(normalizedQuery))

    return matchesTitle || matchesDescription || matchesMember
  })
}

export function buildPortalInitialState(
  route: { type: string; member?: string },
  searchParams: { type?: string; members?: string; q?: string; page?: string },
): PortalInitialState {
  if (route.type === "almost-over") {
    return {
      activeViewMode: "almost-over",
      selectedType: isValidContentType(searchParams.type ?? "") ? searchParams.type as ContentType : "all",
      selectedMembers: parseMemberIds(searchParams.members),
      searchQuery: sanitizeQuery(searchParams.q),
      currentPage: 1,
    }
  }

  return {
    activeViewMode: "search",
    selectedType: isValidContentType(route.type) ? route.type : "all",
    selectedMembers: parseMemberIds(route.member),
    searchQuery: sanitizeQuery(searchParams.q),
    currentPage: parsePageNumber(searchParams.page),
  }
}

export function getPublicPathForType(type: string): string {
  return type === "almost-over" ? "/almost-over" : `/${type}`
}

export function getPublicPathForTypeMember(type: string, member: string): string {
  return `/${type}/${MEMBER_SEGMENT}/${member}`
}

export function getPortalPageHeading({
  activeViewMode,
  selectedType,
  selectedMembers,
}: {
  activeViewMode: ViewMode
  selectedType: ContentType
  selectedMembers: string[]
}): string {
  const memberNames = getMemberNames(selectedMembers)

  if (activeViewMode === "almost-over") {
    return "公開サンプルのまもなく終了するコンテンツ一覧"
  }

  if (memberNames.length > 0) {
    return `${memberNames.join("・")}の${selectedType === "all" ? "出演コンテンツ" : getTypeLabel(selectedType)}一覧`
  }

  if (selectedType === "all") {
    return "サンプルメンバー別コンテンツ一覧"
  }

  return `公開サンプルの${getTypeLabel(selectedType)}一覧`
}

export function getPortalPageSummary({
  activeViewMode,
  selectedType,
  selectedMembers,
  searchQuery,
}: {
  activeViewMode: ViewMode
  selectedType: ContentType
  selectedMembers: string[]
  searchQuery: string
}): string {
  const memberNames = getMemberNames(selectedMembers)
  const filters: string[] = []

  if (selectedType !== "all") {
    filters.push(getTypeLabel(selectedType))
  }

  if (memberNames.length > 0) {
    filters.push(memberNames.join(" / "))
  }

  if (searchQuery) {
    filters.push(`「${searchQuery}」`)
  }

  if (activeViewMode === "almost-over") {
    if (filters.length > 0) {
      return `公開サンプルの配信終了が近いコンテンツを ${filters.join(" / ")} で絞り込んで確認できます。`
    }

    return "公開サンプルの配信終了が近いコンテンツを、YouTube や TVer の体裁でまとめて確認できます。"
  }

  if (memberNames.length > 0) {
    return `${memberNames.join("、")}に関連する${selectedType === "all" ? "動画・番組・コラム" : getTypeLabel(selectedType)}をまとめて確認できます。`
  }

  if (selectedType === "all") {
    return "架空メンバーに関連するサンプル動画・番組・コラム情報をメンバー別に確認できるデモページです。"
  }

  return `公開サンプルの${getTypeLabel(selectedType)}を、メンバー名やキーワードで絞り込みながら探せます。`
}
