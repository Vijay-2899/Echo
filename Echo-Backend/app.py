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

#DB setup

DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

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

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

if __name__ == "__main__":
    uvicorn.run("app:app", port=5000, reload=True)