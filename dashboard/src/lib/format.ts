const relative = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })
const full = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" })

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
]

export function timeAgo(value: string, now = Date.now()): string {
  const seconds = Math.round((new Date(value).getTime() - now) / 1000)
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit)
  }
  return "just now"
}

export function fullDate(value: string): string {
  return full.format(new Date(value))
}

export function duration(start: string, end: string | null): string {
  if (!end) return "—"
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (ms < 1000) return `${ms} ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`
  return `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`
}

/** "paddle-boards" → "Paddle boards" */
export function humanize(value: string | null | undefined): string {
  if (!value) return "—"
  const text = value.replace(/[-_]/g, " ")
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function shortId(value: string, length = 8): string {
  return value.length > length ? `${value.slice(0, length)}…` : value
}

export function initials(email: string): string {
  const name = email.split("@")[0] ?? ""
  const parts = name.split(/[._-]+/).filter(Boolean)
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?"
}
