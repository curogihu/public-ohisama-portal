"use client"
import Link from "next/link"

import { useEffect, useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Search, Filter, Menu } from "lucide-react"
import { ContentCard } from "./components/content-card"
import { MemberFilter } from "./components/member-filter"
import lastCheckedData from "./data/content.last_checked_date.json"
import { ThemeToggle } from "@/components/theme-toggle"
import { FavoriteMemberSettings } from "@/components/favorite-member-settings"
import { loadFavoriteMemberIds, saveFavoriteMemberIds } from "@/lib/favorite-members"
import {
  CONTENT_TYPE_OPTIONS,
  DEMO_REFERENCE_TIME,
  expiryDayOffset,
  DEFAULT_VIEW_MODE,
  LEGACY_SEARCH_PATH,
  MAX_QUERY_LENGTH,
  MEMBER_SEGMENT,
  VALID_CONTENT_TYPES,
  filterContentItems,
  getPortalPageHeading,
  getPortalPageSummary,
  parseMemberIds,
  parsePageNumber,
  sanitizeQuery,
  type ContentType,
  type PortalInitialState,
  type ViewMode,
} from "@/lib/portal"

const LATEST_UPDATE_TIME = lastCheckedData.updated

type HinatazakaPortalProps = {
  initialState?: PortalInitialState
}

// Demo dates use the explicit JSON reference time in both server and browser.
const formatGroupEndDate = (endDate: Date, _groupType: string): string =>
  `${new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(endDate)} までに配信終了`

export default function HinatazakaPortal({ initialState }: HinatazakaPortalProps) {
  const ITEMS_PER_PAGE = 6
  const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000

  const [selectedType, setSelectedType] = useState<ContentType>(initialState?.selectedType ?? "all")
  const [selectedMembers, setSelectedMembers] = useState<string[]>(initialState?.selectedMembers ?? [])
  const [searchQuery, setSearchQuery] = useState(initialState?.searchQuery ?? "")
  const [showMemberFilter, setShowMemberFilter] = useState(true)
  const [currentPage, setCurrentPage] = useState(initialState?.currentPage ?? 1)
  const [activeViewMode, setActiveViewMode] = useState<ViewMode>(initialState?.activeViewMode ?? DEFAULT_VIEW_MODE)
  const [isHydratedFromUrl, setIsHydratedFromUrl] = useState(Boolean(initialState))
  const nowMs = Date.parse(DEMO_REFERENCE_TIME)
  const [favoriteMemberIds, setFavoriteMemberIds] = useState<string[]>([])
  const [favoritesReady, setFavoritesReady] = useState(false)
  const [onlyFavorites, setOnlyFavorites] = useState(true)

  useEffect(() => {
    setFavoriteMemberIds(loadFavoriteMemberIds())
    setFavoritesReady(true)
  }, [])
  const applyFavorites = (items: ReturnType<typeof filterContentItems>) =>
    onlyFavorites && favoriteMemberIds.length
      ? items.filter((item) => favoriteMemberIds.some((id) => item.members.includes(id)))
      : items

  const filteredContent = useMemo(() => applyFavorites(filterContentItems({
    type: selectedType, memberIds: selectedMembers, query: searchQuery,
  })), [selectedType, selectedMembers, searchQuery, favoriteMemberIds, onlyFavorites])

  const almostOverContent = useMemo(() => applyFavorites(filterContentItems({
    type: selectedType, memberIds: selectedMembers, query: searchQuery, onlyAlmostOver: true,
  })), [selectedType, selectedMembers, searchQuery, favoriteMemberIds, onlyFavorites])

  const almostOverGroups = useMemo(() => {
    const reference = Date.parse(DEMO_REFERENCE_TIME)
    const groups = {
      today: { items: [] as typeof almostOverContent, endDate: new Date(reference) },
      tomorrow: { items: [] as typeof almostOverContent, endDate: new Date(reference + ONE_DAY_IN_MS) },
      twoDays: { items: [] as typeof almostOverContent, endDate: new Date(reference + 2 * ONE_DAY_IN_MS) },
      oneWeek: { items: [] as typeof almostOverContent, endDate: new Date(reference + 7 * ONE_DAY_IN_MS) },
    }
    for (const item of almostOverContent) {
      const day = expiryDayOffset(item)
      if (day === 0) groups.today.items.push(item)
      else if (day === 1) groups.tomorrow.items.push(item)
      else if (day === 2) groups.twoDays.items.push(item)
      else groups.oneWeek.items.push(item)
    }
    return groups
  }, [almostOverContent])

  const totalPages = Math.ceil(filteredContent.length / ITEMS_PER_PAGE)

  const paginatedContent = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return filteredContent.slice(startIndex, endIndex)
  }, [filteredContent, currentPage])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const pathSegments = window.location.pathname.split("/").filter(Boolean)
    const viewParam = params.get("view")
    const typeParam = params.get("type")
    const membersParam = params.get("members")
    const queryParam = params.get("q")
    const pageParam = params.get("page")

    const modeFromPath = pathSegments[0]
    const parsedModeFromPath = modeFromPath === "almost-over"
      ? "almost-over"
      : modeFromPath === LEGACY_SEARCH_PATH || modeFromPath === MEMBER_SEGMENT || VALID_CONTENT_TYPES.includes(modeFromPath as ContentType)
        ? "search"
        : undefined

    const parsedModeFromQuery = viewParam === "almost-over"
      ? "almost-over"
      : viewParam === LEGACY_SEARCH_PATH || viewParam === MEMBER_SEGMENT || viewParam === "search"
        ? "search"
        : undefined

    const activeMode = parsedModeFromPath
      ?? parsedModeFromQuery
      ?? (modeFromPath && VALID_CONTENT_TYPES.includes(modeFromPath as ContentType) && modeFromPath !== "all" ? "search" : DEFAULT_VIEW_MODE)

    setActiveViewMode(activeMode)

    const isLegacyMemberPath = pathSegments[0] === MEMBER_SEGMENT
    const hasMemberSegment = pathSegments[1] === MEMBER_SEGMENT

    const typeFromPath = isLegacyMemberPath
      ? pathSegments[1]
      : pathSegments[0]

    const membersFromPath = isLegacyMemberPath
      ? pathSegments[2]
      : hasMemberSegment
        ? pathSegments[2]
        : pathSegments[1]

    if (typeFromPath && VALID_CONTENT_TYPES.includes(typeFromPath as ContentType)) {
      setSelectedType(typeFromPath as ContentType)
    } else if (typeParam && VALID_CONTENT_TYPES.includes(typeParam as ContentType)) {
      setSelectedType(typeParam as ContentType)
    }

    if (membersFromPath) {
      setSelectedMembers(parseMemberIds(membersFromPath))
    } else if (membersParam) {
      setSelectedMembers(parseMemberIds(membersParam))
    }

    if (queryParam) {
      setSearchQuery(sanitizeQuery(queryParam))
    }

    if (pageParam) {
      setCurrentPage(parsePageNumber(pageParam))
    }

    setIsHydratedFromUrl(true)
  }, [])

  useEffect(() => {
    if (!isHydratedFromUrl) return

    const params = new URLSearchParams()
    let basePath = "/almost-over"

    if (activeViewMode === "search") {
      basePath = selectedMembers.length > 0
        ? `/${selectedType}/${MEMBER_SEGMENT}/${selectedMembers.join(",")}`
        : `/${selectedType}`
    } else {
      if (selectedType !== "all") {
        params.set("type", selectedType)
      }

      if (selectedMembers.length > 0) {
        params.set("members", selectedMembers.join(","))
      }
    }

    if (searchQuery.trim()) {
      params.set("q", searchQuery)
    }

    if (activeViewMode === "search") {
      if (currentPage > 1) {
        params.set("page", currentPage.toString())
      }
    }

    const queryString = params.toString()
    const nextUrl = queryString ? `${basePath}?${queryString}` : basePath
    window.history.replaceState(null, "", nextUrl)
  }, [activeViewMode, selectedType, selectedMembers, searchQuery, currentPage, isHydratedFromUrl])

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1)
    }

    const pages = new Set<number>()
    pages.add(1)
    pages.add(totalPages)

    for (let page = currentPage - 1; page <= currentPage + 1; page++) {
      if (page > 1 && page < totalPages) {
        pages.add(page)
      }
    }

    if (currentPage <= 3) {
      pages.add(2)
      pages.add(3)
      pages.add(4)
    }

    if (currentPage >= totalPages - 2) {
      pages.add(totalPages - 1)
      pages.add(totalPages - 2)
      pages.add(totalPages - 3)
    }

    return Array.from(pages).sort((a, b) => a - b)
  }, [currentPage, totalPages])

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers((prev) => (prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]))
    setCurrentPage(1)
  }

  const handleClearMembers = () => {
    setSelectedMembers([])
    setCurrentPage(1)
  }

  const pageHeading = useMemo(() => {
    return getPortalPageHeading({
      activeViewMode,
      selectedType,
      selectedMembers,
    })
  }, [activeViewMode, selectedMembers, selectedType])

  const pageSummary = useMemo(() => {
    return getPortalPageSummary({
      activeViewMode,
      selectedType,
      selectedMembers,
      searchQuery,
    })
  }, [activeViewMode, searchQuery, selectedMembers, selectedType])

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="bg-card shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="text-center mb-4 sm:mb-6">
              <Link
                href="/almost-over"
                aria-label="まもなく配信終了ページへ移動"
                className="inline-flex items-center justify-center"
              >
                <img src="/demo-logo.svg" alt="" className="mr-3 h-10 w-10" />
                <span className="text-xl font-bold text-foreground">公開サンプルポータル</span>
              </Link>
            <h1 className="mt-3 text-lg font-semibold tracking-tight text-foreground sm:text-2xl">{pageHeading}</h1>
            <p className="text-muted-foreground mt-2 text-xs sm:text-sm">{pageSummary}</p>
            <p className="text-muted-foreground mt-2 text-xs sm:text-sm">デモ基準日時: {LATEST_UPDATE_TIME.replace("T", " ")}（架空データ）</p>
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
            <ThemeToggle />
            <FavoriteMemberSettings favoriteMemberIds={favoriteMemberIds} isReady={favoritesReady} onSave={(ids) => {
              setFavoriteMemberIds(saveFavoriteMemberIds(ids))
              setOnlyFavorites(true)
              setCurrentPage(1)
            }} />
            {favoriteMemberIds.length > 0 && (
              <Button variant="outline" size="sm" aria-pressed={onlyFavorites} onClick={() => {
                setOnlyFavorites((value) => !value)
                setCurrentPage(1)
              }}>{onlyFavorites ? "お気に入りで絞り込み中" : "お気に入りで絞る"}</Button>
            )}
          </div>
          <div className="max-w-3xl mx-auto mb-3 sm:mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-2xl border-2 border-amber-200 bg-amber-50 p-2 shadow-sm">
              <Button
                asChild
                variant="ghost"
                size="lg"
                className={`h-12 sm:h-14 text-sm sm:text-base font-bold tracking-wide border-2 ${
                  activeViewMode === "almost-over"
                    ? "bg-rose-500 text-white border-rose-600 shadow-md hover:bg-rose-500"
                    : "bg-card text-rose-700 border-rose-300 hover:bg-rose-100"
                }`}
              >
                <Link href="/almost-over" className="flex items-center justify-center gap-2">
                  <span>まもなく配信終了</span>
                  <span
                    className={`inline-flex min-w-7 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                      activeViewMode === "almost-over"
                        ? "bg-card/20 text-white"
                        : "bg-rose-100 text-rose-900"
                    }`}
                  >
                    {almostOverContent.length}
                  </span>
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className={`h-12 sm:h-14 text-sm sm:text-base font-bold tracking-wide border-2 ${
                  activeViewMode === "search"
                    ? "bg-sky-500 text-white border-sky-600 shadow-md hover:bg-sky-500"
                    : "bg-card text-sky-700 border-sky-300 hover:bg-sky-100"
                }`}
              >
                <Link href="/all">メンバーで探す</Link>
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          {(activeViewMode === "search" || activeViewMode === "almost-over") && (
            <div className="flex gap-2 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  aria-label="コンテンツを検索"
                  placeholder="番組名、動画タイトルなどで検索..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value.slice(0, MAX_QUERY_LENGTH))
                    setCurrentPage(1)
                  }}
                  className="pl-10"
                />
              </div>
              <Button
                variant={showMemberFilter ? "default" : "outline"}
                onClick={() => setShowMemberFilter(!showMemberFilter)}
              >
                <Filter className="w-4 h-4 mr-2" />
                メンバー
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Member Filter */}
        {(activeViewMode === "search" || activeViewMode === "almost-over") && showMemberFilter && (
          <Card className="mb-4 sm:mb-6">
            <CardContent className="p-3 sm:p-4">
              <MemberFilter
                selectedMembers={selectedMembers}
                selectedType={selectedType}
                contentTypes={CONTENT_TYPE_OPTIONS}
                onMemberToggle={handleMemberToggle}
                onTypeChange={(typeId) => {
                  setSelectedType(typeId as ContentType)
                  setCurrentPage(1)
                }}
                onClearAll={handleClearMembers}
              />
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {activeViewMode === "almost-over" ? (
          almostOverContent.length > 0 ? (
            <section className="space-y-3 sm:space-y-4">
              <Accordion type="multiple" defaultValue={["today", "tomorrow", "two-days", "one-week"]} className="space-y-3 sm:space-y-4">
                <AccordionItem value="today" className="rounded-xl border bg-card px-4">
                  <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                    <span className="flex items-center gap-2">
                      <Menu className="h-4 w-4" />
                      {formatGroupEndDate(almostOverGroups.today.endDate, "today")} ({almostOverGroups.today.items.length}件)
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    {almostOverGroups.today.items.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                        {almostOverGroups.today.items.map((item) => (
                          <ContentCard key={`almost-over-today-${item.id}`} content={item} nowMs={nowMs} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">該当するコンテンツはありません</p>
                    )}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="tomorrow" className="rounded-xl border bg-card px-4">
                  <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                    <span className="flex items-center gap-2">
                      <Menu className="h-4 w-4" />
                      {formatGroupEndDate(almostOverGroups.tomorrow.endDate, "tomorrow")} ({almostOverGroups.tomorrow.items.length}件)
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    {almostOverGroups.tomorrow.items.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                        {almostOverGroups.tomorrow.items.map((item) => (
                          <ContentCard key={`almost-over-tomorrow-${item.id}`} content={item} nowMs={nowMs} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">該当するコンテンツはありません</p>
                    )}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="two-days" className="rounded-xl border bg-card px-4">
                  <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                    <span className="flex items-center gap-2">
                      <Menu className="h-4 w-4" />
                      {formatGroupEndDate(almostOverGroups.twoDays.endDate, "twoDays")} ({almostOverGroups.twoDays.items.length}件)
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    {almostOverGroups.twoDays.items.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                        {almostOverGroups.twoDays.items.map((item) => (
                          <ContentCard key={`almost-over-two-days-${item.id}`} content={item} nowMs={nowMs} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">該当するコンテンツはありません</p>
                    )}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="one-week" className="rounded-xl border bg-card px-4">
                  <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                    <span className="flex items-center gap-2">
                      <Menu className="h-4 w-4" />
                      {formatGroupEndDate(almostOverGroups.oneWeek.endDate, "oneWeek")} ({almostOverGroups.oneWeek.items.length}件)
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    {almostOverGroups.oneWeek.items.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                        {almostOverGroups.oneWeek.items.map((item) => (
                          <ContentCard key={`almost-over-one-week-${item.id}`} content={item} nowMs={nowMs} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">該当するコンテンツはありません</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </section>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-muted-foreground">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">まもなく配信終了のコンテンツはありません</p>
                </div>
              </CardContent>
            </Card>
          )
        ) : filteredContent.length > 0 ? (
          <div className="space-y-6 sm:space-y-10">
            <section className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">検索結果</h2>
                <Badge variant="secondary">{filteredContent.length}件</Badge>
                <Badge variant="outline">{currentPage}/{totalPages}ページ</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {paginatedContent.map((item) => (
                  <ContentCard key={item.id} content={item} nowMs={nowMs} />
                ))}
              </div>
            </section>

            {totalPages > 1 && (
              <div className="overflow-x-auto pb-1">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(event) => {
                        event.preventDefault()
                        handlePageChange(currentPage - 1)
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
                    />
                  </PaginationItem>

                  {pageNumbers.map((page, index) => {
                    const previousPage = pageNumbers[index - 1]
                    const showEllipsis = previousPage && page - previousPage > 1

                    return (
                      <div key={`page-group-${page}`} className="flex items-center">
                        {showEllipsis && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}
                        <PaginationItem>
                          <PaginationLink
                            href="#"
                            isActive={currentPage === page}
                            onClick={(event) => {
                              event.preventDefault()
                              handlePageChange(page)
                            }}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      </div>
                    )
                  })}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(event) => {
                        event.preventDefault()
                        handlePageChange(currentPage + 1)
                      }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              </div>
            )}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">検索結果が見つかりませんでした</p>
                <p className="text-sm">検索条件を変更してもう一度お試しください</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-card border-t mt-12">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8 text-center">
          <p className="text-muted-foreground text-sm">架空データで動作する公開デモです。サイトの説明は About をご確認ください。</p>
          <p className="mt-2">
            <Link href="/about" className="text-sm text-blue-600 hover:underline">
              About
            </Link>
          </p>

          <p className="text-muted-foreground text-xs mt-2">
            © {new Date().getFullYear()} 公開サンプルポータル
          </p>

        </div>
      </footer>
    </div>
  )
}
