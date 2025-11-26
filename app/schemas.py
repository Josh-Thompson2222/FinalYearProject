# app/schemas.py
from typing import Annotated
from pydantic import BaseModel, EmailStr, constr, conint, Field

class User(BaseModel):
    user_id: int
    name: constr(min_length=2, max_length=50)
    email: EmailStr
    age: conint(gt=18)