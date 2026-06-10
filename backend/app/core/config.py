from typing import List, Union
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Auction Marketplace"
    APP_NAME: str = PROJECT_NAME
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False
    FRONTEND_URL: str = "http://localhost:5173"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost/auction_db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Auth
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Email (Resend)
    RESEND_API_KEY: str = "your-resend-api-key"
    EMAIL_FROM: str = "noreply@bolimart.com"
    EMAIL_FROM_NAME: str = "Bolimart"

    # Stripe
    STRIPE_SECRET_KEY: str = "sk_test_..."
    STRIPE_PUBLISHABLE_KEY: str = "pk_test_..."
    STRIPE_WEBHOOK_SECRET: str = "whsec_..."
    STRIPE_PLATFORM_FEE_PERCENT: float = 10.0

    # Cloudflare R2 (S3-compatible)
    R2_ENDPOINT_URL: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = ""
    R2_PUBLIC_URL: str = ""

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # React dev server
    ]

    # File uploads
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 5 * 1024 * 1024  # 5MB

    class Config:
        env_file = ".env"
        extra = "ignore"
        case_sensitive = True

settings = Settings()