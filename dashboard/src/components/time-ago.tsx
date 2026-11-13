import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { fullDate, timeAgo } from "@/lib/format"
import { cn } from "@/lib/utils"

export function TimeAgo({ value, className }: { value: string; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <time
          dateTime={value}
          className={cn("whitespace-nowrap text-muted-foreground tabular-nums", className)}
        >
          {timeAgo(value)}
        </time>
      </TooltipTrigger>
      <TooltipContent>{fullDate(value)}</TooltipContent>
    </Tooltip>
  )
}
