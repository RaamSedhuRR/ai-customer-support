"""Seed the knowledge_base table from the Markdown files in knowledge_base/.

Each file is one section (the file stem) and each ## heading is one entry.
Reruns upsert on (section, title), so they update rows instead of duplicating
them. Note: rerunning overwrites any edits made in the dashboard.

Run from the project root:
    uv run python -m scripts.seed_knowledge_base
"""

from pathlib import Path

from app import db

KB_DIR = Path(__file__).resolve().parent.parent / "knowledge_base"


def parse(path: Path) -> list[tuple[str, str, str]]:
    """Split a section file into (section, title, content) rows, one per ## heading."""
    entries = []
    for block in path.read_text(encoding="utf-8").split("\n## ")[1:]:
        title, _, content = block.partition("\n")
        entries.append((path.stem, title.strip(), content.strip()))
    return entries


def main() -> None:
    with db.connect() as conn:
        for path in sorted(KB_DIR.glob("*.md")):
            rows = parse(path)
            for section, title, content in rows:
                conn.execute(
                    """
                    insert into knowledge_base (section, title, content) values (%s, %s, %s)
                    on conflict (section, title) do update
                      set content = excluded.content, updated_at = now()
                    """,
                    (section, title, content),
                )
            print(f"{path.stem}: {len(rows)} entries")


if __name__ == "__main__":
    main()
