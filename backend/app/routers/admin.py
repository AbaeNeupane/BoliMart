from fastapi import APIRouter

router = APIRouter()

@router.get("/users")
async def get_users():
    return {"message": "Admin: Get users - to be implemented"}

@router.get("/transactions")
async def get_transactions():
    return {"message": "Admin: Get transactions - to be implemented"}

@router.get("/listings")
async def get_listings():
    return {"message": "Admin: Get listings - to be implemented"}

@router.post("/ban-user/{user_id}")
async def ban_user(user_id: str):
    return {"message": f"Admin: Ban user {user_id} - to be implemented"}
