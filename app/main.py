from typing import Annotated, Optional, List
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

# JWT handling imports
from jose import jwt 
from datetime import datetime, timedelta

from .database import engine, get_db
from .models import Base, UserDB
from .schemas import UserRead, UserCreate, Token

#Replacing @app.on_event("startup")

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(lifespan=lifespan)

#Configuration for JWT
Secret_Key = "AdminJoshFYP_Secret"      #Key used to encode
Algorithm = "HS256"                     #Hashing algorithm used to encode
ACCESS_TOKEN_EXPIRE_MINUTES = 30        #How long the key is valid

# CORS (add this block)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # dev-friendly; tighten in prod
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/users/{user_id}", response_model = UserRead)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(UserDB, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get("/api/users", response_model=list[UserRead])
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(UserDB).all()
    return users


@app.post("/api/users/", response_model = UserRead, status_code = status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    # create an ORM User instance from the Pydantic payload
    user = UserDB(**payload.model_dump())
    db.add(user)

#create JWT token with an expiration time
def create_access_token(data:dict):
    to_encode = data.copy()                                                                     #Copy data to avoid modifying the original
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)                 #Set the token's expiration time
    to_encode.update({"exp": expire})                                                           #Add expiration time to the token payload
    return jwt.encode(to_encode, Secret_Key, algorithm=Algorithm)                               #Encode the token with the secret key and algorithm

def authenticate_user(form_data: OAuth2PasswordRequestForm = Depends()):
    email = form_data.email
    password_id = form_data.password_id
    if UserDB.get(email) == password_id:
        return {"email": email}
    raise HTTPException(status_code=401, detail="Incorrect email or password")

@app.post("/api/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data)
    access_token = create_access_token(data={"sub": user["email"]}) 
    return {"access_token": access_token, "token_type": "bearer"}


    try: 
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email or Password already registered")
    return user
