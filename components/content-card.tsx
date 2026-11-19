import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Calendar } from "lucide-react"
import { memo } from "react"
import membersData from "../data/members.json"
import type { Content, Member } from "../types/member"
import { cn } from "../lib/utils"

interface ContentCardProps {
  content: Content
  nowMs?: number | null
}

const YOUTUBE_CATEGORY_MEMBER_IDS = new Set(["youtube-movie", "youtube-shorts", "youtube-live", "tver"])
const members: Member[] = membersData
const MEMBER_BY_ID = new Map(members.map((member) => [member.id, member]))
const getDisplayMemberName = (_memberId: string, memberName: string) => memberName

const toSafeHttpUrl = (value: string | undefined) => {
  if (!value) return null

  try {
    const url = new URL(value)
    if (url.protocol === "https:" && url.hostname === "example.com") {
      return url.toString()
    }
    return null
  } catch {
    return null
  }
}

const toSafeImageUrl = (value: string | undefined) => {
  if (!value) return null

  return value === "/placeholder.svg" ? value : null
}

function ContentCardComponent({ content }: ContentCardProps) {
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

    if (normalizedPlatform.includes("radiko")) {
      return "Radikoで聴く"
    }

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
      {content.expiresAt && (
        <p className="px-3 pb-3 text-xs text-muted-foreground sm:px-4">
          終了日時: {new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", dateStyle: "short", timeStyle: "short" }).format(new Date(content.expiresAt))} JST
        </p>
      )}
      <CardFooter className="p-3 pt-0 sm:p-4 sm:pt-0">
        {safeContentUrl ? (
          <div className="w-full space-y-2">

            <Button asChild className="w-full h-11 sm:h-10 text-sm" size="default">
              <a href={safeContentUrl} target="_blank" rel="noopener noreferrer">
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
