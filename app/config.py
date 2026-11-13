from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Load .env into the environment, so Pydantic AI also finds ANTHROPIC_API_KEY.
load_dotenv()


class Settings(BaseSettings):
    google_client_id: str
    google_client_secret: str
    google_refresh_token: str
    database_url: str
    classifier_model: str
    agent_model: str
    poll_interval_seconds: int = 600
    dashboard_username: str = "admin"
    dashboard_password: str = ""
    keep_alive_seconds: int = 300
    render_external_url: str = ""


settings = Settings()  