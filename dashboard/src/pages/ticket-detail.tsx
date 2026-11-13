import { AlertTriangleIcon, ArrowLeftIcon, MessagesSquareIcon, SearchXIcon } from "lucide-react"
import { EmptyState, ErrorState } from "@/components/states"
import { StatusBadge } from "@/components/status-badge"
import { TimeAgo } from "@/components/time-ago"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import { humanize, initials } from "@/lib/format"
import { href } from "@/lib/router"
import type { Message } from "@/lib/types"
import { useApi } from "@/lib/use-api"
import { cn } from "@/lib/utils"

function BackLink() {
  return (
    <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4 text-muted-foreground">
      <a href={href("/tickets")}>
        <ArrowLeftIcon /> All tickets
      </a>
    </Button>
  )
}

export function TicketDetailPage({ id }: { id: number }) {
  // There is no single-ticket endpoint, so the ticket's own fields come from the list.
  const tickets = useApi(api.tickets, [id])
  const messages = useApi(() => api.messages(id), [id])
  const ticket = tickets.data?.find((t) => t.id === id)

  if (tickets.error && !tickets.data)
    return (
      <>
        <BackLink />
        <ErrorState error={tickets.error} onRetry={tickets.reload} />
      </>
    )

  if (tickets.loading)
    return (
      <>
        <BackLink />
        <Skeleton className="mb-2 h-8 w-2/3" />
        <Skeleton className="mb-6 h-4 w-1/3" />
        <div className="space-y-4">
          <Skeleton className="h-28 w-4/5" />
          <Skeleton className="ml-auto h-28 w-4/5" />
        </div>
      </>
    )

  if (!ticket)
    return (
      <>
        <BackLink />
        <EmptyState
          icon={SearchXIcon}
          title="Ticket not found"
          description={`Ticket #${id} isn't among the latest 100 tickets, or it doesn't exist.`}
        />
      </>
    )

  return (
    <>
      <BackLink />
      <div className="mb-6 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight break-words">
            {ticket.subject || "(no subject)"}
          </h1>
          <StatusBadge status={ticket.status} className="self-start" />
        </div>
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <div className="flex gap-1.5">
            <dt className="text-muted-foreground">Customer</dt>
            <dd className="font-medium break-all">{ticket.customer_email}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-muted-foreground">Category</dt>
            <dd className="font-medium">{ticket.category ? humanize(ticket.category) : "—"}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-muted-foreground">Opened</dt>
            <dd>
              <TimeAgo value={ticket.created_at} />
            </dd>
          </div>
        </dl>

        {ticket.status === "escalated" && (
          <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
            <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="space-y-1">
              <p className="font-medium text-amber-950 dark:text-amber-100">Escalated to a colleague</p>
              {ticket.proposed_action && (
                <p className="text-amber-900 dark:text-amber-200">
                  <span className="font-medium">Proposed action:</span> {ticket.proposed_action}
                </p>
              )}
              <p className="text-amber-900/80 dark:text-amber-200/80">
                A colleague owns this thread until the needs-human label is removed in Gmail.
              </p>
            </div>
          </div>
        )}
        {ticket.status !== "escalated" && ticket.proposed_action && (
          <p className="rounded-lg bg-muted px-3 py-2 text-sm">
            <span className="font-medium">Proposed action:</span> {ticket.proposed_action}
          </p>
        )}
      </div>

      <section aria-label="Conversation" className="rounded-xl border bg-background p-4 sm:p-6">
        {messages.error && !messages.data ? (
          <ErrorState error={messages.error} onRetry={messages.reload} className="border-0" />
        ) : messages.loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-4/5" />
            <Skeleton className="ml-auto h-24 w-4/5" />
          </div>
        ) : !messages.data?.length ? (
          <EmptyState
            icon={MessagesSquareIcon}
            title="No messages stored"
            description="This conversation has no saved messages yet."
            className="border-0"
          />
        ) : (
          <ol className="space-y-5">
            {messages.data.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </ol>
        )}
      </section>
    </>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const ours = message.direction === "out"
  return (
    <li className={cn("flex gap-3", ours && "flex-row-reverse")}>
      <div
        aria-hidden
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          ours ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}
      >
        {ours ? "H&P" : initials(message.from_address)}
      </div>
      <div className={cn("flex max-w-[85%] min-w-0 flex-col gap-1 sm:max-w-[75%]", ours && "items-end")}>
        <div className="flex items-baseline gap-2 text-xs">
          <span className="truncate font-medium">{ours ? "Support bot" : message.from_address}</span>
          <TimeAgo value={message.created_at} className="text-xs" />
        </div>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed break-words whitespace-pre-wrap",
            ours
              ? "rounded-tr-sm bg-primary text-primary-foreground"
              : "rounded-tl-sm border bg-muted/40"
          )}
        >
          {message.body}
        </div>
      </div>
    </li>
  )
}
