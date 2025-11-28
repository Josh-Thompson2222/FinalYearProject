from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from .database import engine, get_db
from .models import Base, UserDB
from .schemas import UserRead, UserCreate

#Replacing @app.on_event("startup")

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(lifespan=lifespan)

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

    try: 
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email or Password already registered")
    return user
