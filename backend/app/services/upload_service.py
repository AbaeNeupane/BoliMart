from typing import Dict, Any
import boto3
from app.config import settings

class UploadService:
    """Service for handling file uploads to Cloudflare R2"""
    
    def __init__(self):
        self.s3_client = boto3.client(
            "s3",
            endpoint_url=settings.R2_ENDPOINT_URL,
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        )

    async def upload_image(self, file_key: str, file_content: bytes) -> Dict[str, str]:
        # To be implemented
        pass

    async def delete_image(self, file_key: str) -> bool:
        # To be implemented
        pass
