from __future__ import annotations

from datetime import datetime
import re

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class CustomerBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=20)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        if not re.match(r"^\+?[\d\s\-()]+$", v):
            raise ValueError("Phone number must contain only digits, spaces, hyphens, parentheses, and optional leading +")
        # Strip common formatting to store a clean version
        cleaned = re.sub(r"[\s\-()]", "", v)
        if not re.match(r"^\+?\d{10,15}$", cleaned):
            raise ValueError("Phone number must be between 10 and 15 digits (excluding formatting)")
        return v


class CustomerCreate(CustomerBase):
    pass


class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    phone: str
    created_at: datetime
    updated_at: datetime


class CustomerListResponse(BaseModel):
    items: list[CustomerResponse]
