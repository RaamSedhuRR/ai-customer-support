import { cn } from "@/lib/utils"
import type { Status } from "@/lib/types"

const STYLES: Record<Status, string> = {
  answered:
    "bg-emerald-500/10 text-emerald-700 ring-emerald-600/20 dark:text-emerald-400 dark:ring-emerald-400/25",
  processed:
    "bg-emerald-500/10 text-emerald-700 ring-emerald-600/20 dark:text-emerald-400 dark:ring-emerald-400/25",
  escalated:
    "bg-amber-500/10 text-amber-800 ring-amber-600/25 dark:text-amber-300 dark:ring-amber-400/25",
  open: "bg-sky-500/10 text-sky-700 ring-sky-600/20 dark:text-sky-300 dark:ring-sky-400/25",
  processing: "bg-sky-500/10 text-sky-700 ring-sky-600/20 dark:text-sky-300 dark:ring-sky-400/25",
  failed: "bg-red-500/10 text-red-700 ring-red-600/20 dark:text-red-400 dark:ring-red-400/25",
  skipped: "bg-muted text-muted-foreground ring-border",
}

const DOTS: Record<Status, string> = {
  answered: "bg-emerald-500",
  processed: "bg-emerald-500",
  escalated: "bg-amber-500",
  open: "bg-sky-500",
  processing: "bg-sky-500 animate-pulse",
  failed: "bg-red-500",
  skipped: "bg-muted-foreground/60",
}

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset whitespace-nowrap",
        STYLES[status] ?? STYLES.skipped,
        className
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", DOTS[status] ?? DOTS.skipped)} />
      {status}
    </span>
  )
}
