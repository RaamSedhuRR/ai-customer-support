import { useMemo, useState } from "react"
import { SearchIcon, TicketIcon, XIcon } from "lucide-react"
import { PageHeader } from "@/components/app-shell"
import { EmptyState, ErrorState, TableSkeleton } from "@/components/states"
import { StatusBadge } from "@/components/status-badge"
import { TimeAgo } from "@/components/time-ago"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api } from "@/lib/api"
import { humanize } from "@/lib/format"
import { href, navigate } from "@/lib/router"
import type { Ticket } from "@/lib/types"
import { useApi } from "@/lib/use-api"

type Filters = { query: string; status: string; category: string }

// Kept outside the component so filters survive opening a ticket and coming back.
let savedFilters: Filters = { query: "", status: "all", category: "all" }

const STATUSES = ["open", "answered", "escalated"] as const

export function TicketsPage() {
  const tickets = useApi(api.tickets)
  const [filters, setFiltersState] = useState<Filters>(savedFilters)
  const setFilters = (update: Partial<Filters>) => {
    savedFilters = { ...filters, ...update }
    setFiltersState(savedFilters)
  }

  const all = useMemo(() => tickets.data ?? [], [tickets.data])
  const categories = useMemo(
    () => [...new Set(all.map((t) => t.category).filter((c): c is string => !!c))].sort(),
    [all]
  )
  const visible = useMemo(() => {
    const q = filters.query.trim().toLowerCase()
    return all.filter(
      (t) =>
        (filters.status === "all" || t.status === filters.status) &&
        (filters.category === "all" || t.category === filters.category) &&
        (!q || t.subject.toLowerCase().includes(q) || t.customer_email.toLowerCase().includes(q))
    )
  }, [all, filters])

  const filtered = filters.query !== "" || filters.status !== "all" || filters.category !== "all"

  return (
    <>
      <PageHeader
        title="Tickets"
        description="One ticket per email conversation, newest activity first."
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search subject or customer email"
            aria-label="Search tickets"
            value={filters.query}
            onChange={(e) => setFilters({ query: e.target.value })}
            className="bg-background pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filters.status} onValueChange={(status) => setFilters({ status })}>
            <SelectTrigger className="w-full bg-background sm:w-40" aria-label="Filter by status">
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
          <Select value={filters.category} onValueChange={(category) => setFilters({ category })}>
            <SelectTrigger className="w-full bg-background sm:w-48" aria-label="Filter by category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {humanize(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {tickets.error && !tickets.data ? (
        <ErrorState error={tickets.error} onRetry={tickets.reload} />
      ) : tickets.loading ? (
        <TableSkeleton columns={5} />
      ) : visible.length === 0 ? (
        filtered ? (
          <EmptyState
            icon={SearchIcon}
            title="No matching tickets"
            description="Try a different search or clear the filters."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ query: "", status: "all", category: "all" })}
              >
                <XIcon /> Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={TicketIcon}
            title="No tickets yet"
            description="Tickets appear here once the bot handles its first customer email."
          />
        )
      ) : (
        <>
          <p className="mb-2 text-xs text-muted-foreground" aria-live="polite">
            {visible.length} of {all.length} tickets
          </p>
          <TicketTable tickets={visible} />
          <TicketCards tickets={visible} />
        </>
      )}
    </>
  )
}

function TicketTable({ tickets }: { tickets: Ticket[] }) {
  return (
    <div className="hidden overflow-hidden rounded-xl border bg-background md:block">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">Subject</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-4 text-right">Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow
              key={ticket.id}
              className="cursor-pointer"
              onClick={() => navigate(`/tickets/${ticket.id}`)}
            >
              <TableCell className="max-w-72 pl-4">
                <a
                  href={href(`/tickets/${ticket.id}`)}
                  onClick={(e) => e.stopPropagation()}
                  className="block truncate font-medium outline-none hover:underline focus-visible:underline"
                >
                  {ticket.subject || "(no subject)"}
                </a>
              </TableCell>
              <TableCell className="max-w-56 truncate text-muted-foreground">
                {ticket.customer_email}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {ticket.category ? humanize(ticket.category) : "—"}
              </TableCell>
              <TableCell>
                <StatusBadge status={ticket.status} />
              </TableCell>
              <TableCell className="pr-4 text-right">
                <TimeAgo value={ticket.updated_at} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function TicketCards({ tickets }: { tickets: Ticket[] }) {
  return (
    <ul className="space-y-2 md:hidden">
      {tickets.map((ticket) => (
        <li key={ticket.id}>
          <a
            href={href(`/tickets/${ticket.id}`)}
            className="block rounded-xl border bg-background p-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-muted/50"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="line-clamp-2 font-medium">{ticket.subject || "(no subject)"}</p>
              <StatusBadge status={ticket.status} />
            </div>
            <p className="mt-1 truncate text-sm text-muted-foreground">{ticket.customer_email}</p>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{ticket.category ? humanize(ticket.category) : "Uncategorized"}</span>
              <TimeAgo value={ticket.updated_at} />
            </div>
          </a>
        </li>
      ))}
    </ul>
  )
}
