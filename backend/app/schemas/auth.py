from pydantic import BaseModel, field_validator

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: str
    role: str

class RefreshRequest(BaseModel):
    refresh_token: str

    @field_validator("refresh_token")
    @classmethod
    def validate_token_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Refresh token cannot be empty")
        return v
