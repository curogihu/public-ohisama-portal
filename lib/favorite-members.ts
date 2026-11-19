import { FAVORITE_MEMBER_IDS } from "@/lib/portal"

const STORAGE_KEY = "public-sample-favorite-members"

export function normalizeFavoriteMemberIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((id): id is string => typeof id === "string" && FAVORITE_MEMBER_IDS.has(id)))]
}

export function loadFavoriteMemberIds(): string[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null")
    return value?.version === 1 ? normalizeFavoriteMemberIds(value.memberIds) : []
  } catch { return [] }
}

export function saveFavoriteMemberIds(value: unknown): string[] {
  const memberIds = normalizeFavoriteMemberIds(value)
  try {
    if (memberIds.length) window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, memberIds }))
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch { /* Keep in-memory settings when browser storage is unavailable. */ }
  return memberIds
}
