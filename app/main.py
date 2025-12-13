from typing import Annotated, Optional, List
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from passlib.context import CryptContext

# JWT handling imports
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone

from .database import engine, get_db
from .models import Base, UserDB
from .schemas import UserRead, UserCreate, Token, TokenData

#Replacing @app.on_event("startup")

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(lifespan=lifespan)

#Configuration for JWT
SECRET_KEY = "AdminJoshFYP_Secret"      #Key used to encode
ALGORITHM = "HS256"                     #Hashing algorithm used to encode
ACCESS_TOKEN_EXPIRE_MINUTES = 30        #How long the key is valid

pwd_context = CryptContext(schemes=["bcrypt_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

# CORS (add this block)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # dev-friendly; tighten in prod
    allow_methods=["*"],
    allow_headers=["*"],
)

def create_access_token(*, subject: str) -> str:
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": subject, "exp": expire}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)

def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)

def authenticate_user(db: Session, email: str, password: str) -> UserDB:
    user = db.query(UserDB).filter(UserDB.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    return user

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> UserDB:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub = payload.get("sub")
        if not sub:
            raise credentials_exception
        token_data = TokenData(sub=sub)
    except JWTError:
        raise credentials_exception

    user = db.query(UserDB).filter(UserDB.email == token_data.sub).first()
    if not user:
        raise credentials_exception
    return user

@app.get("/api/users/{user_id}", response_model = UserRead)
def get_user(user_id: int, db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    user = db.get(UserDB, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get("/api/users", response_model=list[UserRead])
def get_all_users(db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    users = db.query(UserDB).all()
    return users


@app.post("/api/users/", response_model = UserRead, status_code = status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    # create an ORM User instance from the Pydantic payload
    user = UserDB(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password)
    )
    db.add(user)
    
    try: 
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email or Password already registered")
    return user

@app.post("/api/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, email=form_data.username, password=form_data.password)
    access_token = create_access_token(subject=user.email) 
    return {"access_token": access_token, "token_type": "bearer"}

@app.delete("/api/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    user = db.get(UserDB, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return

#create JWT token with an expiration time
#def create_access_token(data:dict):
 #   to_encode = data.copy()                                                                     #Copy data to avoid modifying the original
  #  expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)                 #Set the token's expiration time
   # to_encode.update({"exp": expire})                                                           #Add expiration time to the token payload
    #return jwt.encode(to_encode, Secret_Key, algorithm=Algorithm)                               #Encode the token with the secret key and algorithm

#def authenticate_user(form_data: OAuth2PasswordRequestForm = Depends()):
 #   email = form_data.email
  #  password_id = form_data.password_id
   # if UserDB.get(email) == password_id:
    #    return {"email": email}
    #raise HTTPException(status_code=401, detail="Incorrect email or password")


