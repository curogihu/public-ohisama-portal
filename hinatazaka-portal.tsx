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
import { LATEST_UPDATE_TIME } from "./data/content.last_checked_date"
import { TVER_CONTENT_UPDATED_DATE } from "./data/content.tver.target"
import {
  CONTENT_TYPE_OPTIONS,
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

type HinatazakaPortalProps = {
  initialState?: PortalInitialState
}

const EXPIRY_WITH_DATE_PATTERN = /^(\d{1,2})月(\d{1,2})日\([^)]*\)(\d{1,2}):(\d{2})\s*終了予定/

const parsePublishYear = (publishDate: string) => {
  const matched = publishDate.match(/^(\d{4})\/\d{2}\/\d{2}$/)
  return matched ? Number.parseInt(matched[1], 10) : new Date().getFullYear()
}

const parseAlmostOverEndDateMs = (publishDate: string, description: string) => {
  const matched = description.match(EXPIRY_WITH_DATE_PATTERN)
  if (!matched) return null

  const [, month, day, hour, minute] = matched
  const endDate = new Date(
    parsePublishYear(publishDate),
    Number.parseInt(month, 10) - 1,
    Number.parseInt(day, 10),
    Number.parseInt(hour, 10),
    Number.parseInt(minute, 10),
  )

  return Number.isNaN(endDate.getTime()) ? null : endDate.getTime()
}

const formatGroupEndDate = (endDate: Date, groupType: "today" | "tomorrow" | "twoDays" | "oneWeek"): string => {
  const year = endDate.getFullYear()
  const month = String(endDate.getMonth() + 1).padStart(2, "0")
  const day = String(endDate.getDate()).padStart(2, "0")
  
  if (groupType === "today") {
    return `${year}/${month}/${day} 配信終了`
  } else if (groupType === "tomorrow") {
    return `${year}/${month}/${day} 配信終了`
  } else if (groupType === "twoDays") {
    return `${year}/${month}/${day} 配信終了`
  } else if (groupType === "oneWeek") {
    return `${year}/${month}/${day} までに配信終了`
  }
  
  return ""
}

const parseTverContentUpdateDateMs = (dateStr: string): number => {
  const [year, month, day] = dateStr.split("/").map((n) => Number.parseInt(n, 10))
  return new Date(year, month - 1, day, 0, 0, 0, 0).getTime()
}

export default function HinatazakaPortal({ initialState }: HinatazakaPortalProps) {
  const ITEMS_PER_PAGE = 30
  const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000

  const [selectedType, setSelectedType] = useState<ContentType>(initialState?.selectedType ?? "all")
  const [selectedMembers, setSelectedMembers] = useState<string[]>(initialState?.selectedMembers ?? [])
  const [searchQuery, setSearchQuery] = useState(initialState?.searchQuery ?? "")
  const [showMemberFilter, setShowMemberFilter] = useState(true)
  const [currentPage, setCurrentPage] = useState(initialState?.currentPage ?? 1)
  const [activeViewMode, setActiveViewMode] = useState<ViewMode>(initialState?.activeViewMode ?? DEFAULT_VIEW_MODE)
  const [isHydratedFromUrl, setIsHydratedFromUrl] = useState(Boolean(initialState))
  const [nowMs, setNowMs] = useState<number | null>(null)

  const filteredContent = useMemo(() => {
    return filterContentItems({
      type: selectedType,
      memberIds: selectedMembers,
      query: searchQuery,
    })
  }, [selectedType, selectedMembers, searchQuery])

  const almostOverContent = useMemo(() => {
    const baseNowMs = parseTverContentUpdateDateMs(TVER_CONTENT_UPDATED_DATE)

    return filterContentItems({
      type: selectedType,
      memberIds: selectedMembers,
      query: searchQuery,
    }).filter((item) => {
      if (item.members.includes("almost-over")) {
        return true
      }

      const endDateMs = parseAlmostOverEndDateMs(item.publishDate, item.description)
      if (endDateMs == null) {
        return false
      }

      const remainingMs = endDateMs - baseNowMs
      return remainingMs >= 0 && remainingMs <= ONE_DAY_IN_MS * 7
    })
  }, [selectedType, selectedMembers, searchQuery])

  const almostOverGroups = useMemo(() => {
    const baseNowMs = parseTverContentUpdateDateMs(TVER_CONTENT_UPDATED_DATE)
    const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000

    const groups = {
      today: { items: [] as typeof almostOverContent, endDate: new Date(baseNowMs) },
      tomorrow: { items: [] as typeof almostOverContent, endDate: new Date(baseNowMs + ONE_DAY_IN_MS) },
      twoDays: { items: [] as typeof almostOverContent, endDate: new Date(baseNowMs + 2 * ONE_DAY_IN_MS) },
      oneWeek: { items: [] as typeof almostOverContent, endDate: new Date(baseNowMs + 7 * ONE_DAY_IN_MS) },
    }

    return almostOverContent.reduce(
      (groupsAcc, item) => {
        const endDateMs = parseAlmostOverEndDateMs(item.publishDate, item.description)
        if (endDateMs == null) {
          groupsAcc.twoDays.items.push(item)
          return groupsAcc
        }

        const endDate = new Date(endDateMs)
        const nowDate = new Date(baseNowMs)
        const endDateStart = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime()
        const nowDateStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime()
        const dayDiff = Math.floor((endDateStart - nowDateStart) / ONE_DAY_IN_MS)

        if (dayDiff <= 0) {
          groupsAcc.today.items.push(item)
          return groupsAcc
        }

        if (dayDiff === 1) {
          groupsAcc.tomorrow.items.push(item)
          return groupsAcc
        }

        if (dayDiff === 2) {
          groupsAcc.twoDays.items.push(item)
          return groupsAcc
        }

        if (dayDiff <= 7) {
          groupsAcc.oneWeek.items.push(item)
          return groupsAcc
        }

        groupsAcc.twoDays.items.push(item)
        return groupsAcc
      },
      groups,
    )
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
    setNowMs(Date.now())
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="text-center mb-4 sm:mb-6">
              <Link
                href="/almost-over"
                aria-label="まもなく配信終了ページへ移動"
                className="inline-flex items-center justify-center"
              >
              <img
                src="/header.png"
                alt="公開サンプルポータル"
                  className="mx-auto h-auto w-[min(100%,28rem)]"
              />
              </Link>
            <h1 className="mt-3 text-lg font-semibold tracking-tight text-slate-900 sm:text-2xl">{pageHeading}</h1>
            <p className="text-muted-foreground mt-2 text-xs sm:text-sm">{pageSummary}</p>
            <p className="text-muted-foreground mt-2 text-xs sm:text-sm">更新日時: {LATEST_UPDATE_TIME}</p>
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
                    : "bg-white text-rose-700 border-rose-300 hover:bg-rose-100"
                }`}
              >
                <Link href="/almost-over" className="flex items-center justify-center gap-2">
                  <span>まもなく配信終了</span>
                  <span
                    className={`inline-flex min-w-7 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                      activeViewMode === "almost-over"
                        ? "bg-white/20 text-white"
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
                    : "bg-white text-sky-700 border-sky-300 hover:bg-sky-100"
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
                  placeholder="タイトル、メンバー名で検索..."
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
              <Accordion type="multiple" className="space-y-3 sm:space-y-4">
                <AccordionItem value="today" className="rounded-xl border bg-white px-4">
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

                <AccordionItem value="tomorrow" className="rounded-xl border bg-white px-4">
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

                <AccordionItem value="two-days" className="rounded-xl border bg-white px-4">
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

                <AccordionItem value="one-week" className="rounded-xl border bg-white px-4">
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
      <footer className="bg-white border-t mt-12">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8 text-center">
          <p className="text-muted-foreground text-sm">サイトの説明・注意事項・お問い合わせ先は About をご確認ください。</p>
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
