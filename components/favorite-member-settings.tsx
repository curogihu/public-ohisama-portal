"use client"

import { useMemo, useState } from "react"
import { Check, GraduationCap, Heart, ShieldCheck, UsersRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import membersData from "@/data/members.json"
import { FAVORITE_MEMBER_IDS } from "@/lib/portal"
import { cn } from "@/lib/utils"

type FavoriteMemberSettingsProps = {
  favoriteMemberIds: string[]
  isReady: boolean
  onSave: (memberIds: string[]) => void
}

const selectableMembers = membersData.filter((member) => FAVORITE_MEMBER_IDS.has(member.id))

export function FavoriteMemberSettings({ favoriteMemberIds, isReady, onSave }: FavoriteMemberSettingsProps) {
  const [open, setOpen] = useState(false)
  const [draftMemberIds, setDraftMemberIds] = useState<string[]>([])
  const activeMembers = useMemo(() => selectableMembers.filter((member) => member.isActive), [])
  const graduatedMembers = useMemo(() => selectableMembers.filter((member) => !member.isActive), [])

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) setDraftMemberIds(favoriteMemberIds)
    setOpen(nextOpen)
  }

  const toggleMember = (memberId: string) => {
    setDraftMemberIds((current) =>
      current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId],
    )
  }

  const handleSave = () => {
    onSave(draftMemberIds)
    setOpen(false)
  }

  const renderMemberButtons = (members: typeof selectableMembers) => (
    <div className="flex flex-wrap gap-2">
      {members.map((member) => {
        const selected = draftMemberIds.includes(member.id)
        return (
          <Button
            key={member.id}
            type="button"
            variant="outline"
            size="sm"
            aria-pressed={selected}
            onClick={() => toggleMember(member.id)}
            className={cn(
              "h-9 rounded-full px-3 text-xs",
              selected
                ? "border-rose-500 bg-rose-500 text-white hover:bg-rose-600 hover:text-white dark:border-rose-400 dark:bg-rose-500 dark:hover:bg-rose-400"
                : "border-slate-200 bg-white text-slate-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-rose-800 dark:hover:bg-rose-950 dark:hover:text-rose-300",
            )}
          >
            {selected ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
            {member.name}
          </Button>
        )
      })}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={!isReady}
          className="h-10 rounded-full border-rose-200 bg-white/80 px-4 text-sm font-semibold text-rose-700 shadow-sm backdrop-blur hover:border-rose-300 hover:bg-rose-50 dark:border-rose-900 dark:bg-slate-900/80 dark:text-rose-300 dark:hover:bg-rose-950"
        >
          <Heart className={cn("h-4 w-4", favoriteMemberIds.length > 0 && "fill-current")} aria-hidden="true" />
          {favoriteMemberIds.length > 0 ? `推しメン ${favoriteMemberIds.length}人` : "推しメンを設定"}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[calc(100dvh_-_1.5rem)] w-[calc(100%_-_1.5rem)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-[1.5rem] border-slate-200 bg-white p-0 dark:border-slate-700 dark:bg-slate-950 sm:max-h-[88dvh] sm:max-w-2xl">
        <DialogHeader className="border-b border-slate-100 px-5 pb-4 pt-6 pr-12 dark:border-slate-800 sm:px-6">
          <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Heart className="h-5 w-5 text-rose-500" aria-hidden="true" />
            推しメン設定
          </DialogTitle>
          <DialogDescription>
            1人以上選ぶと、選んだメンバーに関連するコンテンツだけを表示します。
          </DialogDescription>
        </DialogHeader>

        <div
          data-testid="favorite-member-scroll-area"
          className="min-h-0 overflow-y-auto overscroll-contain px-5 py-1 sm:px-6"
        >
          <div className="space-y-5 py-4">
            <section aria-labelledby="favorite-active-members">
              <h3 id="favorite-active-members" className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                <UsersRound className="h-4 w-4 text-sky-500" aria-hidden="true" />
                現役メンバー
              </h3>
              {renderMemberButtons(activeMembers)}
            </section>

            <section aria-labelledby="favorite-graduated-members" className="border-t border-slate-100 pt-5 dark:border-slate-800">
              <h3 id="favorite-graduated-members" className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                <GraduationCap className="h-4 w-4 text-violet-500" aria-hidden="true" />
                卒業メンバー
              </h3>
              {renderMemberButtons(graduatedMembers)}
            </section>
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/80 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/70 sm:px-6">
          <p className="mb-4 flex items-start gap-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
            設定はこのブラウザ内だけに保存され、サーバーやURLには送信されません。
          </p>
          <DialogFooter className="gap-2 sm:space-x-0">
            <Button type="button" variant="outline" onClick={() => setDraftMemberIds([])} className="rounded-xl">
              すべて解除
            </Button>
            <Button type="button" onClick={handleSave} className="rounded-xl bg-rose-500 text-white hover:bg-rose-600 dark:bg-rose-500 dark:hover:bg-rose-400">
              {draftMemberIds.length > 0 ? `${draftMemberIds.length}人を保存` : "全メンバー表示に戻す"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
