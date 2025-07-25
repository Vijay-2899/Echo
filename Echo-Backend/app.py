import os
import base64
import random
from datetime import datetime

import uvicorn
import socketio
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from passlib.context import CryptContext
import smtplib
from email.mime.text import MIMEText
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware


fastapp = FastAPI()
socket = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
app = socketio.ASGIApp(socket, other_asgi_app=fastapp)

DATABASE_URL = "sqlite:///./users.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class RegisterSchema(BaseModel):
    email: str
    username: str
    password: str

class VerifyOtpSchema(BaseModel):
    email: str
    otp: str

class LoginSchema(BaseModel):
    email: str
    password: str

class User(Base):
    __tablename__ = "users"
    id              = Column(Integer, primary_key=True, index=True)
    email           = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class Otp(Base):
    __tablename__ = "otps"
    id         = Column(Integer, primary_key=True, index=True)
    email      = Column(String, unique=True, index=True)
    otp        = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def send_email_otp(email: str, otp: str):
    smtp_server   = "smtp.gmail.com"
    smtp_port     = 587
    smtp_username = "bojjaramya99@gmail.com"
    smtp_password = "nkbf exaz hjzp vptx"  # app password

    msg = MIMEText(f"Your OTP is: {otp}")
    msg["Subject"] = "Your OTP"
    msg["From"]    = smtp_username
    msg["To"]      = email

    with smtplib.SMTP(smtp_server, smtp_port) as server:
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.send_message(msg)

@fastapp.post("/register")
def register(payload: RegisterSchema, db: Session = Depends(get_db)):
    otp = str(random.randint(100000, 999999))
    existing = db.query(Otp).filter(Otp.email == payload.email).first()
    if existing:
        existing.otp = otp
        existing.created_at = datetime.utcnow()
    else:
        db.add(Otp(email=payload.email, otp=otp))
    db.commit()

    send_email_otp(payload.email, otp)
    return {"message": "OTP sent to your email"}

@fastapp.post("/verify-otp")
def verify_otp(payload: VerifyOtpSchema, db: Session = Depends(get_db)):
    otp_entry = db.query(Otp).filter(Otp.email == payload.email).first()
    if not otp_entry:
        raise HTTPException(status_code=404, detail="No OTP found")
    if otp_entry.otp != payload.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    user = db.query(User).filter(User.email == payload.email).first()
    if user:
        db.delete(otp_entry)
        db.commit()
        return {"message": "OTP verified. User already exists."}

    hashed_pw = hash_password("Ramya@123")  # TODO: store real password
    db.add(User(email=payload.email, hashed_password=hashed_pw))
    db.delete(otp_entry)
    db.commit()
    return {"message": "OTP verified, user registered!"}

@fastapp.post("/login")
def login(payload: LoginSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return {"message": "Login successful", "user_id": user.id}

if __name__ == "__main__":
    uvicorn.run("app:app", port=5000, reload=True)