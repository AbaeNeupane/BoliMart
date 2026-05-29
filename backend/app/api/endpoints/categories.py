from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List

from app.database import get_db
from app.models.listing import Category

router = APIRouter()

class CategoryResponse(BaseModel):
    id: str
    name: str
    slug: str

    class Config:
        from_attributes = True

@router.get("/", response_model=List[CategoryResponse])
async def get_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category).order_by(Category.name))
    categories = result.scalars().all()
    return [CategoryResponse(id=str(c.id), name=c.name, slug=c.slug) for c in categories]