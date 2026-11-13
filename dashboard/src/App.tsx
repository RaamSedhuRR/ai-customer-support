import { useEffect, useState } from "react"
import { SearchXIcon } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { EmptyState } from "@/components/states"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { isLoggedIn, LOGGED_OUT_EVENT, logout } from "@/lib/api"
import { href, matchRoute, usePath, type Route } from "@/lib/router"
import { ActivityPage } from "@/pages/activity"
import { KnowledgeBasePage } from "@/pages/knowledge-base"
import { LoginPage } from "@/pages/login"
import { OverviewPage } from "@/pages/overview"
import { TicketDetailPage } from "@/pages/ticket-detail"
import { TicketsPage } from "@/pages/tickets"

const TITLES: Record<Route["name"], string> = {
  overview: "Overview",
  tickets: "Tickets",
  ticket: "Ticket",
  activity: "Activity",
  "knowledge-base": "Knowledge base",
  "not-found": "Not found",
}

function Page({ route }: { route: Route }) {
  switch (route.name) {
    case "overview":
      return <OverviewPage />
    case "tickets":
      return <TicketsPage />
    case "ticket":
      return <TicketDetailPage id={route.id} />
    case "activity":
      return <ActivityPage />
    case "knowledge-base":
      return <KnowledgeBasePage />
    default:
      return (
        <EmptyState
          icon={SearchXIcon}
          title="Page not found"
          description="This address doesn't match any page."
          action={
            <Button variant="outline" size="sm" asChild>
              <a href={href("/")}>Go to overview</a>
            </Button>
          }
        />
      )
  }
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn())
  const route = matchRoute(usePath())

  // Any 401 from the API (e.g. password changed on the server) returns to login.
  useEffect(() => {
    const onLoggedOut = () => setLoggedIn(false)
    window.addEventListener(LOGGED_OUT_EVENT, onLoggedOut)
    return () => window.removeEventListener(LOGGED_OUT_EVENT, onLoggedOut)
  }, [])

  useEffect(() => {
    document.title = loggedIn
      ? `${TITLES[route.name]} · Harbor & Pine support`
      : "Sign in · Harbor & Pine support"
  }, [loggedIn, route.name])

  function logOut() {
    logout()
    setLoggedIn(false)
  }

  return (
    <TooltipProvider delayDuration={300}>
      {loggedIn ? (
        <AppShell route={route} onLogout={logOut}>
          <Page key={route.name === "ticket" ? `ticket-${route.id}` : route.name} route={route} />
        </AppShell>
      ) : (
        <LoginPage onLogin={() => setLoggedIn(true)} />
      )}
      <Toaster richColors position="bottom-right" closeButton />
    </TooltipProvider>
  )
}
