from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from app.core.dependencies import get_current_user
from app.core.constants import UserRole

router = APIRouter()

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_MB = 5

@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    """Upload an image file (JPEG, PNG, or WebP)."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG, WebP allowed"
        )

    contents = await file.read()
    if len(contents) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large (max {MAX_SIZE_MB}MB)"
        )

    # In production, upload to Cloudflare R2 or similar
    # For now, return a placeholder URL
    import uuid
    file_id = str(uuid.uuid4())
    filename = file.filename.split(".")[0] if file.filename else file_id
    
    return {
        "url": f"/uploads/{file_id}_{filename}",
        "filename": file.filename,
        "size": len(contents),
    }
