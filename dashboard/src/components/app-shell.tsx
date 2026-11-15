import { useState } from "react"
import {
  ActivityIcon,
  BookOpenIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MenuIcon,
  TicketIcon,
  type LucideIcon,
} from "lucide-react"
import { PollButton } from "@/components/poll-button"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { currentUser } from "@/lib/api"
import { href, type Route } from "@/lib/router"
import { cn } from "@/lib/utils"

type NavItem = { label: string; path: string; icon: LucideIcon; match: Route["name"][] }

const NAV: NavItem[] = [
  { label: "Overview", path: "/", icon: LayoutDashboardIcon, match: ["overview"] },
  { label: "Tickets", path: "/tickets", icon: TicketIcon, match: ["tickets", "ticket"] },
  { label: "Activity", path: "/activity", icon: ActivityIcon, match: ["activity"] },
  {
    label: "Knowledge base",
    path: "/knowledge-base",
    icon: BookOpenIcon,
    match: ["knowledge-base"],
  },
]

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
        H&amp;P
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold">Harbor &amp; Pine</p>
        <p className="text-xs text-muted-foreground">Support console</p>
      </div>
    </div>
  )
}

function NavLinks({ route, onNavigate }: { route: Route; onNavigate?: () => void }) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = item.match.includes(route.name)
        return (
          <a
            key={item.path}
            href={href(item.path)}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
              active && "bg-accent text-foreground"
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </a>
        )
      })}
    </nav>
  )
}

function AccountMenu({ onLogout }: { onLogout: () => void }) {
  const user = currentUser()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Account">
          <span className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase">
            {user.charAt(0) || "?"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="font-normal">
          <p className="text-xs text-muted-foreground">Signed in as</p>
          <p className="truncate font-medium">{user}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onLogout}>
          <LogOutIcon /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AppShell({
  route,
  onLogout,
  children,
}: {
  route: Route
  onLogout: () => void
  children: React.ReactNode
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-svh bg-muted/40 lg:grid lg:grid-cols-[240px_1fr]">
      <a
        href="#main"
        onClick={(e) => {
          e.preventDefault()
          document.getElementById("main")?.focus()
        }}
        className="sr-only z-50 rounded-md bg-background px-3 py-2 text-sm focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      <aside className="sticky top-0 hidden h-svh flex-col gap-6 border-r bg-background px-4 py-5 lg:flex">
        <Brand />
        <NavLinks route={route} />
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur supports-backdrop-filter:bg-background/70 sm:px-6">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 gap-6 p-5">
              <SheetHeader className="p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <Brand />
              </SheetHeader>
              <NavLinks route={route} onNavigate={() => setMenuOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="lg:hidden">
            <Brand />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <PollButton />
            <AccountMenu onLogout={onLogout} />
          </div>
        </header>

        <main id="main" tabIndex={-1} className="flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  )
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
