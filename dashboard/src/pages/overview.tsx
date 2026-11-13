import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  CircleDotIcon,
  MailCheckIcon,
  MailMinusIcon,
  MailXIcon,
  type LucideIcon,
} from "lucide-react"
import { PageHeader } from "@/components/app-shell"
import { ErrorState } from "@/components/states"
import { TimeAgo } from "@/components/time-ago"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import { humanize } from "@/lib/format"
import { href } from "@/lib/router"
import { MAX_ATTEMPTS, type SupportEvent, type Ticket } from "@/lib/types"
import { useApi } from "@/lib/use-api"
import { cn } from "@/lib/utils"

type Stat = { label: string; value: number; icon: LucideIcon; tone: string; link: string }

function StatCard({ stat }: { stat: Stat }) {
  return (
    <a
      href={href(stat.link)}
      className="group rounded-xl border bg-background p-4 transition-colors outline-none hover:border-foreground/20 focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{stat.label}</p>
        <stat.icon className={cn("size-4", stat.tone)} />
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{stat.value}</p>
    </a>
  )
}

function Panel({
  title,
  link,
  children,
}: {
  title: string
  link: { label: string; path: string }
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col rounded-xl border bg-background">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <a
          href={href(link.path)}
          className="inline-flex items-center gap-1 rounded text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {link.label} <ArrowRightIcon className="size-3" />
        </a>
      </div>
      {children}
    </section>
  )
}

function PanelEmpty({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground">
      <Icon className="size-5 text-emerald-500" />
      {text}
    </div>
  )
}

export function OverviewPage() {
  const tickets = useApi(api.tickets, [], 60_000)
  const events = useApi(api.events, [], 60_000)

  const error = tickets.error ?? events.error
  const loading = tickets.loading || events.loading
  const t: Ticket[] = tickets.data ?? []
  const e: SupportEvent[] = events.data ?? []
  const count = <T extends { status: string }>(rows: T[], status: string) =>
    rows.filter((row) => row.status === status).length

  const stats: Stat[] = [
    { label: "Open tickets", value: count(t, "open"), icon: CircleDotIcon, tone: "text-sky-500", link: "/tickets" },
    { label: "Answered", value: count(t, "answered"), icon: CheckCircle2Icon, tone: "text-emerald-500", link: "/tickets" },
    { label: "Escalated", value: count(t, "escalated"), icon: AlertTriangleIcon, tone: "text-amber-500", link: "/tickets" },
    { label: "Processed emails", value: count(e, "processed"), icon: MailCheckIcon, tone: "text-emerald-500", link: "/activity" },
    { label: "Skipped", value: count(e, "skipped"), icon: MailMinusIcon, tone: "text-muted-foreground", link: "/activity" },
    { label: "Failed", value: count(e, "failed"), icon: MailXIcon, tone: "text-red-500", link: "/activity" },
  ]

  const escalated = t.filter((ticket) => ticket.status === "escalated").slice(0, 5)
  const failures = e.filter((event) => event.status === "failed").slice(0, 5)

  return (
    <>
      <PageHeader
        title="Overview"
        description="What the support bot has been doing. Based on the latest 100 tickets and emails."
      />

      {error ? (
        <ErrorState
          error={error}
          onRetry={() => {
            void tickets.reload()
            void events.reload()
          }}
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {loading
              ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-[92px] rounded-xl" />)
              : stats.map((stat) => <StatCard key={stat.label} stat={stat} />)}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Needs a human" link={{ label: "All tickets", path: "/tickets" }}>
              {loading ? (
                <div className="space-y-3 p-4">
                  {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : escalated.length === 0 ? (
                <PanelEmpty icon={CheckCircle2Icon} text="Nothing is waiting for a colleague." />
              ) : (
                <ul className="divide-y">
                  {escalated.map((ticket) => (
                    <li key={ticket.id}>
                      <a
                        href={href(`/tickets/${ticket.id}`)}
                        className="block px-4 py-3 outline-none hover:bg-muted/50 focus-visible:bg-muted/50"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-medium">{ticket.subject || "(no subject)"}</p>
                          <TimeAgo value={ticket.updated_at} className="text-xs" />
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {ticket.customer_email}
                          {ticket.category && ` · ${humanize(ticket.category)}`}
                        </p>
                        {ticket.proposed_action && (
                          <p className="mt-1.5 line-clamp-2 rounded-md bg-amber-500/10 px-2 py-1 text-xs text-amber-900 dark:text-amber-200">
                            {ticket.proposed_action}
                          </p>
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Recent failures" link={{ label: "All activity", path: "/activity" }}>
              {loading ? (
                <div className="space-y-3 p-4">
                  {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : failures.length === 0 ? (
                <PanelEmpty icon={CheckCircle2Icon} text="No failed emails. All good." />
              ) : (
                <ul className="divide-y">
                  {failures.map((event) => (
                    <li key={event.id} className="px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-mono text-xs text-muted-foreground">{event.gmail_message_id}</p>
                        <TimeAgo value={event.created_at} className="text-xs" />
                      </div>
                      <p className="mt-1 truncate text-sm text-red-700 dark:text-red-400">
                        {event.error?.split("\n")[0] || "Unknown error"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Attempt {event.attempts} of {MAX_ATTEMPTS}
                        {event.attempts >= MAX_ATTEMPTS && " · gave up"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      )}
    </>
  )
}
