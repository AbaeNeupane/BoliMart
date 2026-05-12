from fastapi import APIRouter

router = APIRouter()

# Placeholder endpoints - to be implemented
@router.get("/")
async def get_listings():
    return {"message": "Listings endpoint - to be implemented"}