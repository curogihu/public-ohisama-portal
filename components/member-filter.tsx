"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Menu, X } from "lucide-react"
import membersData from "../data/members.json"
import type { Member } from "../types/member"

const members: Member[] = membersData

const NON_MEMBER_FILTER_IDS = new Set([
  "youtube-movie",
  "youtube-shorts",
  "youtube-live",
  "tver",
  "new",
  "almost-over",
])

const getDisplayMemberName = (memberId: string, memberName: string) => {
  return memberId.toLowerCase().includes("tver") ? "TVer" : memberName
}

interface MemberFilterProps {
  selectedMembers: string[]
  selectedType: string
  contentTypes: Array<{ id: string; label: string }>
  onMemberToggle: (memberId: string) => void
  onTypeChange: (typeId: string) => void
  onClearAll: () => void
}

export function MemberFilter({
  selectedMembers,
  selectedType,
  contentTypes,
  onMemberToggle,
  onTypeChange,
  onClearAll,
}: MemberFilterProps) {
  const activeMembers = members.filter((m) => m.isActive && !NON_MEMBER_FILTER_IDS.has(m.id))
  const graduatedMembers = members.filter((m) => !m.isActive && !NON_MEMBER_FILTER_IDS.has(m.id))
  return (
    <div className="space-y-4">
      {selectedMembers.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">選択中:</span>
          {selectedMembers.map((memberId) => {
            const member = members.find((m) => m.id === memberId)
            return member ? (
              <Badge key={memberId} variant="default" className="gap-1">
                {`${getDisplayMemberName(member.id, member.name)} (${member.en_name})`}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 hover:bg-transparent"
                  aria-label={`${member.name}の選択を解除`}
                  onClick={() => onMemberToggle(memberId)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            ) : null
          })}
          <Button variant="outline" size="sm" onClick={onClearAll}>
            クリア
          </Button>
        </div>
      )}

      <Accordion type="multiple" className="space-y-3">
        <AccordionItem value="active-members" className="rounded-lg border px-3">
          <AccordionTrigger className="py-3 text-sm font-semibold text-green-700 hover:no-underline">
            <span className="flex items-center gap-2">
              <Menu className="h-4 w-4" />
              現役メンバー
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="overflow-x-auto pb-1">
              <div className="grid grid-flow-col grid-rows-3 auto-cols-max gap-2 sm:flex sm:flex-wrap">
                {activeMembers.map((member) => (
                  <Button
                    key={member.id}
                    variant={selectedMembers.includes(member.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => onMemberToggle(member.id)}
                    className="text-xs whitespace-nowrap"
                  >
                    {getDisplayMemberName(member.id, member.name)}
                  </Button>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="graduated-members" className="rounded-lg border px-3">
          <AccordionTrigger className="py-3 text-sm font-semibold text-gray-600 hover:no-underline">
            <span className="flex items-center gap-2">
              <Menu className="h-4 w-4" />
              卒業メンバー
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="overflow-x-auto pb-1">
              <div className="grid grid-flow-col grid-rows-3 auto-cols-max gap-2 sm:flex sm:flex-wrap">
                {graduatedMembers.map((member) => (
                  <Button
                    key={member.id}
                    variant={selectedMembers.includes(member.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => onMemberToggle(member.id)}
                    className="text-xs whitespace-nowrap"
                  >
                    {getDisplayMemberName(member.id, member.name)}
                  </Button>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="content-types" className="rounded-lg border px-3">
          <AccordionTrigger className="py-3 text-sm font-semibold text-sky-700 hover:no-underline">
            <span className="flex items-center gap-2">
              <Menu className="h-4 w-4" />
              コンテンツ種別
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-wrap gap-2">
              {contentTypes.map((type) => (
                <Button
                  key={type.id}
                  variant={selectedType === type.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => onTypeChange(type.id)}
                  className="text-xs"
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>


    </div>
  )
}
