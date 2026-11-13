import asyncio
import logging
from contextlib import asynccontextmanager
import httpx
from fastapi import FastAPI
from app.config import settings

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

    


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}