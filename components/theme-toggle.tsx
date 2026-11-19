"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ThemeToggleProps = {
  className?: string
  showLabel?: boolean
}

export function ThemeToggle({ className, showLabel = true }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => setMounted(true), [])

  const isDark = mounted && theme === "dark"
  const nextThemeLabel = isDark ? "通常モード" : "ダークモード"

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={!mounted}
      aria-label={`${nextThemeLabel}に切り替え`}
      title={`${nextThemeLabel}に切り替え`}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "h-9 rounded-full border-sky-100 bg-white/80 px-3 text-slate-600 shadow-sm backdrop-blur transition-colors",
        "hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700",
        "dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-sky-700 dark:hover:bg-slate-800 dark:hover:text-sky-300",
        className,
      )}
    >
      {isDark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
      {showLabel ? <span className="hidden sm:inline">{isDark ? "通常" : "ダーク"}</span> : null}
    </Button>
  )
}
