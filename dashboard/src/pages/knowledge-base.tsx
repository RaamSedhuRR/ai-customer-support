import { useEffect, useMemo, useState } from "react"
import { BookOpenIcon, FileTextIcon, InfoIcon, Loader2Icon, SearchIcon, Undo2Icon } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/app-shell"
import { Markdown } from "@/components/markdown"
import { EmptyState, ErrorState } from "@/components/states"
import { TimeAgo } from "@/components/time-ago"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { api, ApiError } from "@/lib/api"
import { humanize } from "@/lib/format"
import { setNavigationGuard } from "@/lib/router"
import type { Entry } from "@/lib/types"
import { useApi } from "@/lib/use-api"
import { cn } from "@/lib/utils"

const UNSAVED = "You have unsaved changes. Discard them?"

export function KnowledgeBasePage() {
  const kb = useApi(api.knowledgeBase)
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [draft, setDraft] = useState({ title: "", content: "" })
  const [saving, setSaving] = useState(false)

  const entries = useMemo(() => kb.data ?? [], [kb.data])
  const selected = entries.find((e) => e.id === selectedId) ?? null
  const dirty =
    selected !== null && (draft.title !== selected.title || draft.content !== selected.content)

  // Warn before closing the tab or leaving the page with unsaved edits.
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", onBeforeUnload)
    setNavigationGuard(() => window.confirm(UNSAVED))
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload)
      setNavigationGuard(null)
    }
  }, [dirty])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q
      ? entries.filter(
          (e) => e.title.toLowerCase().includes(q) || e.content.toLowerCase().includes(q)
        )
      : entries
  }, [entries, query])
  const sections = [...new Set(filtered.map((e) => e.section))]

  function select(entry: Entry) {
    if (entry.id === selectedId) return
    if (dirty && !window.confirm(UNSAVED)) return
    setSelectedId(entry.id)
    setDraft({ title: entry.title, content: entry.content })
  }

  async function save() {
    if (!selected) return
    setSaving(true)
    try {
      const updated = await api.saveEntry(selected.id, {
        title: draft.title.trim(),
        content: draft.content,
      })
      kb.setData((list = []) => list.map((e) => (e.id === updated.id ? updated : e)))
      setDraft({ title: updated.title, content: updated.content })
      toast.success("Saved", { description: "The bot uses this from the next email." })
    } catch (error) {
      const message =
        error instanceof ApiError && error.status === 404
          ? "This entry no longer exists. It may have been deleted elsewhere."
          : (error as Error).message
      toast.error("Couldn't save", { description: message })
    } finally {
      setSaving(false)
    }
  }

  const canSave = dirty && draft.title.trim() !== "" && draft.content.trim() !== "" && !saving

  return (
    <>
      <PageHeader
        title="Knowledge base"
        description="The facts and rules the bot reads when it writes replies."
      />

      <div className="mb-6 flex gap-3 rounded-xl border bg-background p-4 text-sm text-muted-foreground">
        <InfoIcon className="mt-0.5 size-4 shrink-0" />
        <p>Changes apply to the next email the bot handles. Replies already sent are not affected.</p>
      </div>

      {kb.error && !kb.data ? (
        <ErrorState error={kb.error} onRetry={kb.reload} />
      ) : kb.loading ? (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={BookOpenIcon}
          title="The knowledge base is empty"
          description="Run scripts/seed_knowledge_base.py to load the Markdown files."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="flex flex-col gap-3 lg:sticky lg:top-20 lg:max-h-[calc(100svh-6rem)] lg:self-start">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search entries"
                aria-label="Search entries"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="bg-background pl-9"
              />
            </div>
            <nav
              aria-label="Entries"
              className="flex max-h-80 flex-col gap-4 overflow-y-auto rounded-xl border bg-background p-2 lg:max-h-none"
            >
              {sections.length === 0 && (
                <p className="px-2 py-6 text-center text-sm text-muted-foreground">No entries match.</p>
              )}
              {sections.map((section) => (
                <div key={section}>
                  <p className="px-2 pt-1 pb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {humanize(section)}
                  </p>
                  <ul className="space-y-0.5">
                    {filtered
                      .filter((e) => e.section === section)
                      .map((entry) => (
                        <li key={entry.id}>
                          <button
                            type="button"
                            onClick={() => select(entry)}
                            aria-current={entry.id === selectedId ? "true" : undefined}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50",
                              entry.id === selectedId && "bg-accent font-medium"
                            )}
                          >
                            <FileTextIcon className="size-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate">{entry.title}</span>
                            {entry.id === selectedId && dirty && (
                              <span className="ml-auto size-1.5 shrink-0 rounded-full bg-amber-500" aria-label="Unsaved" />
                            )}
                          </button>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>

          {selected === null ? (
            <EmptyState
              icon={FileTextIcon}
              title="Select an entry"
              description="Choose an entry on the left to read or edit it."
              className="bg-background"
            />
          ) : (
            <section className="flex min-w-0 flex-col rounded-xl border bg-background">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                <div className="min-w-0 text-xs text-muted-foreground">
                  {humanize(selected.section)} · updated <TimeAgo value={selected.updated_at} />
                </div>
                <div className="flex items-center gap-2">
                  {dirty && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDraft({ title: selected.title, content: selected.content })}
                      disabled={saving}
                    >
                      <Undo2Icon /> Discard
                    </Button>
                  )}
                  <Button size="sm" onClick={save} disabled={!canSave}>
                    {saving && <Loader2Icon className="animate-spin" />}
                    {saving ? "Saving…" : "Save changes"}
                  </Button>
                </div>
              </div>

              <div className="space-y-4 p-4">
                <div className="space-y-2">
                  <Label htmlFor="entry-title">Title</Label>
                  <Input
                    id="entry-title"
                    value={draft.title}
                    onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                    aria-invalid={draft.title.trim() === "" || undefined}
                  />
                </div>

                <Tabs defaultValue="edit" className="xl:hidden">
                  <TabsList>
                    <TabsTrigger value="edit">Edit</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>
                  <TabsContent value="edit" className="mt-3">
                    <ContentEditor value={draft.content} onChange={(content) => setDraft((d) => ({ ...d, content }))} />
                  </TabsContent>
                  <TabsContent value="preview" className="mt-3">
                    <Preview source={draft.content} />
                  </TabsContent>
                </Tabs>

                <div className="hidden gap-4 xl:grid xl:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="entry-content">Content (Markdown)</Label>
                    <ContentEditor
                      id="entry-content"
                      value={draft.content}
                      onChange={(content) => setDraft((d) => ({ ...d, content }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Preview</p>
                    <Preview source={draft.content} />
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </>
  )
}

function ContentEditor({
  id,
  value,
  onChange,
}: {
  id?: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Textarea
      id={id}
      aria-label={id ? undefined : "Content (Markdown)"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={value.trim() === "" || undefined}
      spellCheck
      className="min-h-[28rem] resize-y font-mono text-sm leading-relaxed"
    />
  )
}

function Preview({ source }: { source: string }) {
  return (
    <div className="min-h-[28rem] rounded-lg border bg-muted/30 p-4">
      {source.trim() ? (
        <Markdown source={source} />
      ) : (
        <p className="text-sm text-muted-foreground">Nothing to preview.</p>
      )}
    </div>
  )
}
