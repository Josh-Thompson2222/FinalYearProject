from typing import Annotated, Optional, List
from annotated_types import Ge, Le
from pydantic import BaseModel, EmailStr, ConfigDict, StringConstraints
# ---------- Reusable type aliases ----------
NameStr = Annotated[str, StringConstraints(min_length=1, max_length=100)]
Password = Annotated[str, StringConstraints(min_length=5, max_length=28)]       # Password must bebetween 5 and 28 characters
#CodeStr = Annotated[str, StringConstraints(min_length=1, max_length=32)]
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