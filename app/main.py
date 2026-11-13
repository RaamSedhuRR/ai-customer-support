import asyncio
import logging
from contextlib import asynccontextmanager
import httpx
import secrets
from pathlib import Path

from fastapi import APIRouter, Depends, FastAPI, HTTPException
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from app import db
from app.config import settings
from app.poller import poll_once


logger = logging.getLogger("keepalive")

KEEP_ALIVE_SECONDS = settings.keep_alive_seconds


async def keep_alive() -> None:
  """Ping our own public URL so Render sees traffic and doesn't sleep the app."""
  # Render sets this automatically, e.g. https://ai-customer-support.onrender.com
  
  render_external_url = settings.render_external_url
  if not render_external_url:
        logger.info("RENDER_EXTERNAL_URL not set, keep-alive disabled")        
        return
  
  # One client for the whole loop; `async with` closes it when the task is cancelled.

  async with httpx.AsyncClient(timeout=60) as client:
      while True:
        # Non-blocking wait: the server keeps handling requests meanwhile.
        await asyncio.sleep(KEEP_ALIVE_SECONDS)
        try:
            response = await client.get(f"{render_external_url}/health")
            response.raise_for_status()
        except httpx.HTTPError as exc:
        # Never let one failed ping end the loop.
            logger.warning("Keep-alive ping failed: %s", exc)
        

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: run keep_alive() in the background on the event loop.

    task = asyncio.create_task(keep_alive())
    yield # the app serves requests while we're paused here
    
    # Shutdown: stop the background loop.
    
    task.cancel()

app = FastAPI(title="AI customer support", lifespan= lifespan)
security = HTTPBasic(auto_error=False)
    


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


def require_login(credentials: HTTPBasicCredentials | None = Depends(security)) -> None:
    valid = (
        credentials is not None
        and settings.dashboard_password != ""
        and secrets.compare_digest(credentials.username.encode(), settings.dashboard_username.encode())
        and secrets.compare_digest(credentials.password.encode(), settings.dashboard_password.encode())
    )
    if not valid:
        raise HTTPException(status_code=401, detail="Wrong username or password")


class EntryUpdate(BaseModel):
    title: str
    content: str


api = APIRouter(prefix="/api", dependencies=[Depends(require_login)])


@api.get("/login")
def login() -> dict:
    return {"ok": True}


@api.get("/events")
def events() -> list[dict]:
    return db.list_events()


@api.get("/tickets")
def tickets() -> list[dict]:
    return db.list_tickets()


@api.get("/tickets/{ticket_id}/messages")
def ticket_messages(ticket_id: int) -> list[dict]:
    return db.list_messages(ticket_id)


@api.get("/knowledge-base")
def knowledge_base() -> list[dict]:
    return db.list_knowledge_base()


@api.put("/knowledge-base/{entry_id}")
def update_entry(entry_id: int, update: EntryUpdate) -> dict:
    entry = db.update_knowledge_base_entry(entry_id, update.title, update.content)
    if entry is None:
        raise HTTPException(status_code=404, detail="Entry not found")
    return entry


@api.post("/poll")
def poll() -> dict:
    return {"messages": poll_once()}


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


app.include_router(api)

# The built dashboard. Mounted last, so the API routes above take precedence.
dashboard = Path(__file__).resolve().parent.parent / "dashboard" / "dist"
if dashboard.exists():
    app.mount("/", StaticFiles(directory=dashboard, html=True), name="dashboard")