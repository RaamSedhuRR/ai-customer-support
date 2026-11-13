import type { Entry, Message, SupportEvent, Ticket } from "@/lib/types"

const KEY = "dashboard-login"
const USER_KEY = "dashboard-user"
const DEFAULT_TIMEOUT_MS = 30_000

/** Fired when the server rejects the saved login, so the app can return to the login page. */
export const LOGGED_OUT_EVENT = "dashboard:logged-out"

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

export function saveLogin(username: string, password: string) {
  sessionStorage.setItem(KEY, btoa(`${username}:${password}`))
  sessionStorage.setItem(USER_KEY, username)
}

export function logout() {
  sessionStorage.removeItem(KEY)
  sessionStorage.removeItem(USER_KEY)
}

export function isLoggedIn() {
  return sessionStorage.getItem(KEY) !== null
}

export function currentUser() {
  return sessionStorage.getItem(USER_KEY) ?? ""
}

async function errorMessage(response: Response): Promise<string> {
  const text = await response.text()
  try {
    const body = JSON.parse(text) as { detail?: unknown }
    if (typeof body.detail === "string") return body.detail
  } catch {
    // Not JSON: fall through to the raw text.
  }
  return text || `Request failed (${response.status})`
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`/api${path}`, {
      ...init,
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${sessionStorage.getItem(KEY) ?? ""}`,
        ...init.headers,
      },
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new ApiError(0, "The server took too long to respond.")
    }
    throw new ApiError(0, "Can't reach the server. Check your connection.")
  }

  if (response.status === 401) {
    const wasLoggedIn = isLoggedIn()
    logout()
    if (wasLoggedIn) window.dispatchEvent(new Event(LOGGED_OUT_EVENT))
    throw new ApiError(401, await errorMessage(response))
  }
  if (!response.ok) {
    throw new ApiError(response.status, await errorMessage(response))
  }
  return response.json() as Promise<T>
}

export const api = {
  login: () => request<{ ok: boolean }>("/login"),
  tickets: () => request<Ticket[]>("/tickets"),
  messages: (ticketId: number) => request<Message[]>(`/tickets/${ticketId}/messages`),
  events: () => request<SupportEvent[]>("/events"),
  knowledgeBase: () => request<Entry[]>("/knowledge-base"),
  saveEntry: (id: number, update: { title: string; content: string }) =>
    request<Entry>(`/knowledge-base/${id}`, { method: "PUT", body: JSON.stringify(update) }),
  // Polling calls the LLM for every new email, so it can take a while.
  poll: () => request<{ messages: number }>("/poll", { method: "POST" }, 120_000),
}
