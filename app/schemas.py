from typing import Annotated, Optional, List
from annotated_types import Ge, Le
from pydantic import BaseModel, EmailStr, ConfigDict, StringConstraints
# ---------- Reusable type aliases ----------
NameStr = Annotated[str, StringConstraints(min_length=1, max_length=100)]
Password = Annotated[str, StringConstraints(pattern=r"^S\d{7}$")]       # Password must start with S and contain 7 characters. Example pattern: S1234567
CodeStr = Annotated[str, StringConstraints(min_length=1, max_length=32)]
AgeInt = Annotated[int, Ge(0), Le(150)]


# ---------- Users ----------

class UserCreate(BaseModel):
	name: NameStr
	email: EmailStr
	password_id: Password

class UserRead(BaseModel):
	model_config = ConfigDict(from_attributes=True)
	id: int
	name: NameStr
	email: EmailStr
	password_id: Password


# ---------- JSON Web Tokens schemas ----------

class Token(BaseModel):			#Return to client after login
	access_token: str
	token_type: str = "bearer"

class TokenData(BaseModel):						#TokenData is a structured Pydantic model that holds important fields (like user_id in my case or could be email_str), 
	user_id: Optional[int] = None				#only used on back end, not returned to user