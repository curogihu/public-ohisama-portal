import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Calendar, Check, Copy, Share2 } from "lucide-react"
import { memo, useCallback, useState } from "react"
import type { Content } from "../types/member"
import { members } from "../data/members"
import { cn } from "../lib/utils"

interface ContentCardProps {
  content: Content
  nowMs?: number | null
}

const YOUTUBE_CATEGORY_MEMBER_IDS = new Set(["youtube-movie", "youtube-shorts", "youtube-live", "tver"])
const SHARE_HASHTAG_EXCLUDE_MEMBER_IDS = new Set(["new", "almost-over"])
const MEMBER_BY_ID = new Map(members.map((member) => [member.id, member]))

const getDisplayMemberName = (memberId: string, memberName: string) => {
  return memberId.toLowerCase().includes("tver") ? "TVer" : memberName
}

const buildMemberHashtags = (memberIds: string[]) => {
  const seenMemberIds = new Set<string>()

  return memberIds
    .map((memberId) => {
      if (SHARE_HASHTAG_EXCLUDE_MEMBER_IDS.has(memberId)) return null
      if (seenMemberIds.has(memberId)) return null

      const member = MEMBER_BY_ID.get(memberId)
      if (!member) return null

      seenMemberIds.add(memberId)
      return `#${getDisplayMemberName(member.id, member.name)}`
    })
    .filter((hashtag): hashtag is string => hashtag !== null)
    .join(" ")
}

const toSafeHttpUrl = (value: string | undefined) => {
  if (!value) return null

  try {
    const url = new URL(value)
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString()
    }
    return null
  } catch {
    return null
  }
}

const toSafeImageUrl = (value: string | undefined) => {
  if (!value) return null

  if (value.startsWith("/")) {
    return value
  }

  try {
    const url = new URL(value)
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString()
    }
    return null
  } catch {
    return null
  }
}

function ContentCardComponent({ content }: ContentCardProps) {
  const [isCopied, setIsCopied] = useState(false)
  const seenMemberIds = new Set<string>()

  const findUniqueMember = (memberId: string) => {
    if (seenMemberIds.has(memberId)) return null
    const member = MEMBER_BY_ID.get(memberId)
    if (!member) return null
    seenMemberIds.add(memberId)
    return member
  }

  const youtubeCategoryMembers = content.members
    .filter((memberId) => YOUTUBE_CATEGORY_MEMBER_IDS.has(memberId))
    .map((memberId) => findUniqueMember(memberId))
    .filter((member): member is NonNullable<typeof member> => member !== null)

  const regularMembers = content.members
    .filter((memberId) => !YOUTUBE_CATEGORY_MEMBER_IDS.has(memberId))
    .map((memberId) => findUniqueMember(memberId))
    .filter((member): member is NonNullable<typeof member> => member !== null)

  const visibleRegularMembers = regularMembers.slice(0, 5)
  const omittedMemberCount = Math.max(regularMembers.length - visibleRegularMembers.length, 0)
  const displayMembers = [...youtubeCategoryMembers, ...visibleRegularMembers]
  const safeContentUrl = toSafeHttpUrl(content.url)
  const safeThumbnailUrl = toSafeImageUrl(content.thumbnail)
  const displayDescription = content.description
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
  const handleCopyShareUrl = useCallback(async () => {
    if (!safeContentUrl) return

    try {
      await navigator.clipboard.writeText(safeContentUrl)
      setIsCopied(true)
      window.setTimeout(() => setIsCopied(false), 2000)
    } catch {
      window.prompt("このURLをコピーしてください", safeContentUrl)
    }
  }, [safeContentUrl])

  const handleShareToX = useCallback(() => {
    if (!safeContentUrl) return

    const memberHashtags = buildMemberHashtags(content.members)
    const shareText = memberHashtags
      ? `${content.title}\n${safeContentUrl}\n${memberHashtags}`
      : `${content.title}\n${safeContentUrl}`
    const intentUrl = `https://x.com/intent/post?text=${encodeURIComponent(shareText)}`
    window.open(intentUrl, "_blank", "noopener,noreferrer")
  }, [content.members, content.title, safeContentUrl])

  const handleWatchButtonClick = useCallback(() => {
    if (!safeContentUrl || typeof window === "undefined") return

    const gtag = (window as typeof window & {
      gtag?: (command: string, eventName: string, params: Record<string, string>) => void
    }).gtag
    if (typeof gtag !== "function") return

    gtag("event", "watch_button_click", {
      content_id: content.id,
      content_title: content.title,
      content_type: content.type,
      platform: content.platform,
      destination_url: safeContentUrl,
    })
  }, [content.id, content.platform, content.title, content.type, safeContentUrl])

  const getTypeColor = (type: string) => {
    switch (type) {
      case "movie":
        return "bg-red-100 text-red-800"
      case "audio":
        return "bg-green-100 text-green-800"
      case "tver":
        return "bg-blue-100 text-blue-800"
      case "column":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "movie":
        return "Movie"
      case "audio":
        return "Audio"
      case "tver":
        return "TVer"
      case "column":
        return "コラム"
      default:
        return type
    }
  }

  const getWatchButtonLabel = (platform: string) => {
    const normalizedPlatform = platform.toLowerCase()

    if (normalizedPlatform.includes("tver")) {
      return "TVerで見る"
    }

    if (normalizedPlatform.includes("youtube")) {
      return "Youtubeで見る"
    }

    return "視聴する"
  }

  const watchButtonLabel = getWatchButtonLabel(content.platform)

  return (
    <Card data-testid="content-card" className={cn("h-full overflow-hidden hover:shadow-lg transition-shadow flex flex-col")}>
      <CardContent className="p-3 sm:p-4 flex-1 flex flex-col">
        <div className="mb-3 flex items-start gap-3">
          {safeThumbnailUrl && (
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border bg-muted sm:h-16 sm:w-16">
              <img
                src={safeThumbnailUrl}
                alt={`${content.title} のサムネイル`}
                className="h-full w-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(event) => {
                  if (event.currentTarget.src.includes("/placeholder.svg")) return
                  event.currentTarget.src = "/placeholder.svg?height=180&width=320"
                }}
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="mb-2">
              <Badge className={getTypeColor(content.type)}>{getTypeLabel(content.type)}</Badge>
            </div>
            <h3 className="font-semibold text-base sm:text-lg mb-2 line-clamp-2">{content.title}</h3>
          </div>
        </div>
        <p className="mb-3 text-left text-sm leading-snug text-muted-foreground whitespace-pre-line line-clamp-2">
          {displayDescription}
        </p>
        {displayMembers.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {displayMembers.map((member) => (
              <Badge key={member.id} variant="outline" className="text-xs">
                {getDisplayMemberName(member.id, member.name)}
              </Badge>
            ))}
            {omittedMemberCount > 0 && (
              <Badge
                variant="secondary"
                className="text-xs"
                title={`省略中: ${regularMembers.slice(5).map((member) => getDisplayMemberName(member.id, member.name)).join(" / ")}`}
              >
                ほか{omittedMemberCount}人
              </Badge>
            )}
          </div>
        )}
        <div className="mt-auto flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          {content.publishDate}
          <span>•</span>
          <span>{content.platform}</span>
        </div>
      </CardContent>
      <CardFooter className="p-3 pt-0 sm:p-4 sm:pt-0">
        {safeContentUrl ? (
          <div className="w-full space-y-2">
            {/*
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm"
                onClick={handleCopyShareUrl}
              >
                {isCopied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                {isCopied ? "コピーしました" : "URLコピー"}
              </Button>
              <Button type="button" variant="outline" size="sm" className="text-xs sm:text-sm" onClick={handleShareToX}>
                <Share2 className="w-3.5 h-3.5 mr-1" />
                Xで共有
              </Button>
            </div>
            */}
            <Button asChild className="w-full h-11 sm:h-10 text-sm" size="default">
              <a href={safeContentUrl} target="_blank" rel="noopener noreferrer" onClick={handleWatchButtonClick}>
                <ExternalLink className="w-4 h-4 mr-2" />
                {watchButtonLabel}
              </a>
            </Button>
          </div>
        ) : (
          <Button className="w-full h-11 sm:h-10 text-sm" size="default" disabled>
            {watchButtonLabel}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

export const ContentCard = memo(ContentCardComponent)
ContentCard.displayName = "ContentCard"
