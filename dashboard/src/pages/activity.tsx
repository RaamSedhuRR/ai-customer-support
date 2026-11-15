import { useMemo, useState } from "react"
import { ActivityIcon, CheckIcon, ChevronRightIcon, CopyIcon, SearchIcon } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/app-shell"
import { EmptyState, ErrorState, TableSkeleton } from "@/components/states"
import { StatusBadge } from "@/components/status-badge"
import { TimeAgo } from "@/components/time-ago"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { api } from "@/lib/api"
import { duration, humanize, shortId } from "@/lib/format"
import { isProcessedResult, MAX_ATTEMPTS, type SupportEvent } from "@/lib/types"
import { useApi } from "@/lib/use-api"
import { cn } from "@/lib/utils"

const STATUSES = ["processed", "skipped", "failed", "processing"] as const

export function ActivityPage() {
  const events = useApi(api.events)
  const [status, setStatus] = useState("all")
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const all = useMemo(() => events.data ?? [], [events.data])
  const visible = status === "all" ? all : all.filter((e) => e.status === status)

  const toggle = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <>
      <PageHeader
        title="Activity"
        description="Every email the bot picked up, and what it did with it."
        actions={
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-44 bg-background" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {humanize(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {events.error && !events.data ? (
        <ErrorState error={events.error} onRetry={events.reload} />
      ) : events.loading ? (
        <TableSkeleton columns={5} rows={8} />
      ) : visible.length === 0 ? (
        status === "all" ? (
          <EmptyState
            icon={ActivityIcon}
            title="No activity yet"
            description="Emails show up here as soon as the bot picks them up from the inbox."
          />
        ) : (
          <EmptyState
            icon={SearchIcon}
            title={`No ${status} emails`}
            action={
              <Button variant="outline" size="sm" onClick={() => setStatus("all")}>
                Show all
              </Button>
            }
          />
        )
      ) : (
        <div className="overflow-hidden rounded-xl border bg-background">
          <div className="hidden grid-cols-[2rem_minmax(0,1.4fr)_7.5rem_6rem_6rem_7rem] gap-3 border-b px-4 py-2.5 text-xs font-medium text-muted-foreground md:grid">
            <span />
            <span>Email</span>
            <span>Status</span>
            <span>Attempts</span>
            <span>Duration</span>
            <span className="text-right">Received</span>
          </div>
          <ul className="divide-y">
            {visible.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                open={expanded.has(event.id)}
                onToggle={() => toggle(event.id)}
              />
            ))}
          </ul>
        </div>
      )}
    </>
  )
}

function CopyId({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  async function copy(e: React.MouseEvent) {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("Couldn't copy to the clipboard")
    }
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy Gmail message id ${value}`}
          className="inline-flex items-center gap-1.5 rounded font-mono text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {shortId(value, 12)}
          {copied ? <CheckIcon className="size-3 text-emerald-500" /> : <CopyIcon className="size-3" />}
        </button>
      </TooltipTrigger>
      <TooltipContent>{copied ? "Copied" : value}</TooltipContent>
    </Tooltip>
  )
}

function EventRow({
  event,
  open,
  onToggle,
}: {
  event: SupportEvent
  open: boolean
  onToggle: () => void
}) {
  const detailsId = `event-${event.id}-details`
  return (
    <li>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-controls={detailsId}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onToggle()
          }
        }}
        className="grid cursor-pointer grid-cols-[2rem_1fr_auto] items-center gap-x-3 gap-y-1 px-4 py-3 outline-none hover:bg-muted/40 focus-visible:bg-muted/50 md:grid-cols-[2rem_minmax(0,1.4fr)_7.5rem_6rem_6rem_7rem]"
      >
        <ChevronRightIcon
          className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-90")}
        />
        <div className="min-w-0">
          <CopyId value={event.gmail_message_id} />
          <p className="truncate text-sm">{summary(event)}</p>
        </div>
        <div className="justify-self-end md:justify-self-start">
          <StatusBadge status={event.status} />
        </div>
        <span className="col-start-2 text-xs text-muted-foreground tabular-nums md:col-start-auto md:text-sm">
          <span className="md:hidden">Attempts: </span>
          {event.attempts}/{MAX_ATTEMPTS}
        </span>
        <span className="hidden text-sm text-muted-foreground tabular-nums md:block">
          {duration(event.created_at, event.processed_at)}
        </span>
        <span className="col-start-3 text-right text-xs md:col-start-auto md:text-sm">
          <TimeAgo value={event.created_at} />
        </span>
      </div>
      {open && (
        <div id={detailsId} className="border-t bg-muted/30 px-4 py-4 md:pl-[3.75rem]">
          <EventDetails event={event} />
        </div>
      )}
    </li>
  )
}

function summary(event: SupportEvent): string {
  if (event.status === "failed") return event.error?.split("\n")[0] ?? "Failed"
  if (event.status === "processing") return "In progress…"
  if (isProcessedResult(event.result)) {
    const verb = event.result.action === "reply" ? "Replied" : "Escalated"
    return event.result.section ? `${verb} · ${humanize(event.result.section)}` : verb
  }
  if (event.result && "reason" in event.result) return `Skipped: ${event.result.reason}`
  return humanize(event.status)
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  )
}

function EventDetails({ event }: { event: SupportEvent }) {
  if (event.status === "processing")
    return <p className="text-sm text-muted-foreground">The bot is still working on this email.</p>

  if (event.status === "failed")
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Attempt {event.attempts} of {MAX_ATTEMPTS}.{" "}
          {event.attempts >= MAX_ATTEMPTS
            ? "The bot gave up on this email; no reply was sent."
            : "The bot will retry on the next poll."}
        </p>
        <pre className="max-h-80 overflow-auto rounded-lg border bg-background p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words">
          {event.error ?? "No error message recorded."}
        </pre>
      </div>
    )

  if (isProcessedResult(event.result)) {
    const r = event.result
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Action">{r.action === "reply" ? "Replied to customer" : "Escalated to a colleague"}</Field>
          <Field label="Section">{humanize(r.section)}</Field>
          <Field label="Processing time">{duration(event.created_at, event.processed_at)}</Field>
        </div>
        {r.reason && <Field label="Reason">{r.reason}</Field>}
        {r.proposed_action && <Field label="Proposed action">{r.proposed_action}</Field>}
        {r.reply ? (
          <Field label="Reply sent">
            <div className="rounded-lg border bg-background p-3 leading-relaxed whitespace-pre-wrap break-words">
              {r.reply}
            </div>
          </Field>
        ) : (
          <p className="text-xs text-muted-foreground">
            No reply text was recorded for this email (processed by an older version of the bot).
          </p>
        )}
      </div>
    )
  }

  if (event.result && "reason" in event.result)
    return <Field label="Skipped because">{event.result.reason}</Field>

  return <p className="text-sm text-muted-foreground">No details recorded.</p>
}
