import { Fragment } from "react"
import { cn } from "@/lib/utils"

// A small, safe Markdown renderer for knowledge-base entries: headings, paragraphs,
// bullet and numbered lists, **bold**, *italic* and `code`. It builds React elements,
// never raw HTML, so content can't inject markup.

function inline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g)
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4)
      return <strong key={key}>{part.slice(2, -2)}</strong>
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2)
      return (
        <code key={key} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      )
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2)
      return <em key={key}>{part.slice(1, -1)}</em>
    return <Fragment key={key}>{part}</Fragment>
  })
}

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "p"; text: string }

function parse(source: string): Block[] {
  const blocks: Block[] = []
  let paragraph: string[] = []
  const flush = () => {
    if (paragraph.length) blocks.push({ type: "p", text: paragraph.join(" ") })
    paragraph = []
  }

  for (const raw of source.split("\n")) {
    const line = raw.trim()
    const heading = line.match(/^(#{1,6})\s+(.*)$/)
    const bullet = line.match(/^[-*+]\s+(.*)$/)
    const numbered = line.match(/^\d+[.)]\s+(.*)$/)
    const last = blocks[blocks.length - 1]

    if (!line) flush()
    else if (heading) {
      flush()
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2] })
    } else if (bullet || numbered) {
      flush()
      const type = bullet ? "ul" : "ol"
      const text = (bullet ?? numbered)![1]
      if (last && last.type === type) last.items.push(text)
      else blocks.push({ type, items: [text] })
    } else paragraph.push(line)
  }
  flush()
  return blocks
}

export function Markdown({ source, className }: { source: string; className?: string }) {
  return (
    <div className={cn("space-y-3 text-sm leading-relaxed", className)}>
      {parse(source).map((block, i) => {
        const key = `b${i}`
        if (block.type === "heading")
          return (
            <p key={key} className="pt-1 font-semibold">
              {inline(block.text, key)}
            </p>
          )
        if (block.type === "ul" || block.type === "ol") {
          const items = block.items.map((item, j) => (
            <li key={j}>{inline(item, `${key}-${j}`)}</li>
          ))
          const listClass = "space-y-1 pl-5 marker:text-muted-foreground"
          return block.type === "ul" ? (
            <ul key={key} className={cn(listClass, "list-disc")}>
              {items}
            </ul>
          ) : (
            <ol key={key} className={cn(listClass, "list-decimal")}>
              {items}
            </ol>
          )
        }
        return <p key={key}>{inline(block.text, key)}</p>
      })}
    </div>
  )
}
