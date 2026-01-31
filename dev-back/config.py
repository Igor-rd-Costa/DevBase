from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    github_client_id: str = ""
    github_client_secret: str = ""
    github_redirect_uri: str = ""
    jwt_secret_key: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    backend_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:3007"
    database_url: str = "postgresql+asyncpg://user:password@localhost/dbname"
    internal_api_token: str = ""
    gateway_manager_url: str = "http://localhost:8080"

    class Config:
        env_file = ".env"


settings = Settings()

