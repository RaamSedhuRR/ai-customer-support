# 1. Start from a small official Python image (matches .python-version).
FROM python:3.13-slim

# 2. Copy the uv tool in from its own published image.
COPY --from=ghcr.io/astral-sh/uv:0.9.7 /uv /bin/uv

# 3. Settings for uv and Python inside the container.
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy PYTHONUNBUFFERED=1 PATH="/app/.venv/bin:$PATH"

# 4. All later commands run in /app.
WORKDIR /app

# 5. Install dependencies FIRST, so this layer is cached when only code changes.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

# 6. Now copy the code.
COPY app ./app
COPY knowledge_base ./knowledge_base


# 7. Start the poller in the background and the web server in the foreground.
CMD ["sh", "-c", "python -m app.poller & exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
