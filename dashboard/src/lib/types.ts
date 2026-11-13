// Mirrors the rows the FastAPI backend returns (see supabase/migrations and app/ai/schemas.py).

export type TicketStatus = "open" | "answered" | "escalated"
export type EventStatus = "processing" | "processed" | "skipped" | "failed"
export type Status = TicketStatus | EventStatus

export type Ticket = {
  id: number
  gmail_thread_id: string
  customer_email: string
  subject: string
  category: string | null
  status: TicketStatus
  proposed_action: string | null
  created_at: string
  updated_at: string
}

export type Message = {
  id: number
  ticket_id: number
  gmail_message_id: string
  direction: "in" | "out"
  from_address: string
  body: string
  created_at: string
}

export type ProcessedResult = {
  action: "reply" | "escalate"
  section: string
  reply: string
  reason: string
  proposed_action: string | null
}

export type SkippedResult = { reason: string }

export type SupportEvent = {
  id: number
  gmail_message_id: string
  status: EventStatus
  attempts: number
  error: string | null
  result: ProcessedResult | SkippedResult | null
  created_at: string
  processed_at: string | null
}

export type Entry = {
  id: number
  section: string
  title: string
  content: string
  updated_at: string
}

export const MAX_ATTEMPTS = 3

export function isProcessedResult(result: SupportEvent["result"]): result is ProcessedResult {
  return result !== null && "action" in result
}
