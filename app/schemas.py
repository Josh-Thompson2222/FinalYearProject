from typing import Annotated, Optional, List
from annotated_types import Ge, Le
from pydantic import BaseModel, EmailStr, ConfigDict, StringConstraints, Field
from datetime import datetime


# ---------- Reusable type aliases ----------
NameStr = Annotated[str, StringConstraints(min_length=1, max_length=100)]
Password = Annotated[str, StringConstraints(min_length=5, max_length=28)]       # Password must bebetween 5 and 28 characters
AgeInt = Annotated[int, Ge(0), Le(150)]


# ---------- Users ----------

class UserCreate(BaseModel):
	name: NameStr
	email: EmailStr
	password: Password

class UserRead(BaseModel):
	model_config = ConfigDict(from_attributes=True)
	id: int
	name: NameStr
	email: EmailStr


# ---------- JSON Web Tokens schemas ----------

class Token(BaseModel):			#Return to client after login
	access_token: str
	token_type: str = "bearer"

class TokenData(BaseModel):
    sub: Optional[str] = None


# ---------- Tablet schedules schemas ----------

class DoseItem(BaseModel):
	name: str
	qty: int = Field(default=1, ge=1)

class ScheduleCreate(BaseModel):

	morning: List[DoseItem] = []
	afternoon: List[DoseItem] = []
	evening: List[DoseItem] = []

class ScheduleRead(BaseModel):
	
	model_config = ConfigDict(from_attributes=True)
	id: int
	user_id: int
	morning: List[DoseItem]
	afternoon: List[DoseItem]
	evening: List[DoseItem]
	created_at: datetime
	updated_at: datetime

class ScheduleUpdate(BaseModel):

	morning: Optional[List[DoseItem]] = None
	afternoon: Optional[List[DoseItem]] = None
	evening: Optional[List[DoseItem]] = None

class IntakeCreate(BaseModel):
	tablet_name: str
	time_of_day: str
	qty_taken: int = Field(default=1, ge=1)

class IntakeRead(BaseModel):
	model_config = ConfigDict(from_attributes=True)
	id: int
	user_id: int
	tablet_name: str
	time_of_day: str
	qty_taken: int
	taken_at: datetime