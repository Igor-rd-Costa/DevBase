from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    """Gateway Manager configuration."""
    
    internal_api_token: str = "dev-secret-token"
    gateway_http_port: int = 8080
    gateway_image: str = "dev-gateway:latest"
    storage_path: str = os.path.join(os.getcwd(), "storage")
    
    class Config:
        env_file = ".env"

settings = Settings()
