import { useSyncExternalStore } from "react"

// Hash-based routing (#/tickets/12): FastAPI serves the built files with StaticFiles,
// which has no SPA fallback, so path-based deep links would 404 on refresh.

function readHash() {
  return window.location.hash.replace(/^#/, "") || "/"
}

let path = readHash()
let guard: (() => boolean) | null = null
const listeners = new Set<() => void>()

/** Lets a page with unsaved edits confirm before the user navigates away. */
export function setNavigationGuard(fn: (() => boolean) | null) {
  guard = fn
}

window.addEventListener("hashchange", () => {
  const next = readHash()
  if (next === path) return
  if (guard && !guard()) {
    // Undo the navigation without adding a history entry or firing hashchange again.
    history.replaceState(history.state, "", `#${path}`)
    return
  }
  path = next
  window.scrollTo({ top: 0 })
  listeners.forEach((listener) => listener())
})

function subscribe(callback: () => void) {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

export function usePath() {
  return useSyncExternalStore(subscribe, () => path)
}

export function navigate(path: string) {
  window.location.hash = path
}

export function href(path: string) {
  return `#${path}`
}

export type Route =
  | { name: "overview" }
  | { name: "tickets" }
  | { name: "ticket"; id: number }
  | { name: "activity" }
  | { name: "knowledge-base" }
  | { name: "not-found" }

export function matchRoute(path: string): Route {
  const clean = path.split("?")[0].replace(/\/+$/, "") || "/"
  if (clean === "/") return { name: "overview" }
  if (clean === "/tickets") return { name: "tickets" }
  const ticket = clean.match(/^\/tickets\/(\d+)$/)
  if (ticket) return { name: "ticket", id: Number(ticket[1]) }
  if (clean === "/activity") return { name: "activity" }
  if (clean === "/knowledge-base") return { name: "knowledge-base" }
  return { name: "not-found" }
}
