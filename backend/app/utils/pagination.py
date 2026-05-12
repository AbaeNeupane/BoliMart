from typing import List, Generic, TypeVar

T = TypeVar("T")

class PaginationParams:
    def __init__(self, skip: int = 0, limit: int = 10):
        self.skip = skip
        self.limit = limit

class PaginatedResponse(Generic[T]):
    def __init__(self, data: List[T], total: int, skip: int, limit: int):
        self.data = data
        self.total = total
        self.skip = skip
        self.limit = limit
        self.pages = (total + limit - 1) // limit
