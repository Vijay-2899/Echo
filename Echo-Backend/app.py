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

# Create FastAPI app
fastapp = FastAPI()

# Setup Socket.IO
socket = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=["*"]
)

# Combine FastAPI with Socket.IO
sio_app = socketio.ASGIApp(socket, other_asgi_app=fastapp)

# Apply CORS to the whole ASGI app
app = CORSMiddleware(
    sio_app,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

DATABASE_URL = "sqlite:///./users.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()
shared_secrets = {}   
room_keys      = {}  

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
    username: str
    password: str
    otp: str

class LoginSchema(BaseModel):
    email: str
    password: str

class User(Base):
    __tablename__ = "users"
    id              = Column(Integer, primary_key=True, index=True)
    username        = Column(String)
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

    hashed_pw = hash_password(payload.password)  # TODO: store real password
    new_user = User(email=payload.email, username=payload.username, hashed_password=hashed_pw)
    db.add(new_user)
    db.delete(otp_entry)
    db.commit()
    return {"message": "OTP verified, user registered!"}

@fastapp.post("/login")
def login(payload: LoginSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return {"message": "Login successful", "user_id": user.id}

@socket.on("join")
async def on_join(sid, data):
    room = data["room"]
    if room not in room_keys:
        room_keys[room] = os.urandom(32)
    room_key = room_keys[room]

    aesgcm = AESGCM(shared_secrets[sid])
    iv = os.urandom(12)
    ct = aesgcm.encrypt(iv, room_key, None)

    await socket.emit("room_key", {
        "iv":         base64.b64encode(iv).decode(),
        "ciphertext": base64.b64encode(ct).decode()
    }, to=sid)

    await socket.enter_room(sid, room)
    await socket.emit("receive_message", {
        "display_name": data.get("display_name", "Ramya"),
        "message":      f"{data.get('display_name','Ramya')} joined {room}"
    }, room=room)

@socket.on("client_public_key")
async def handle_client_pubkey(sid, data):
    client_pem = data["client_public_key"].encode()
    client_pub = serialization.load_pem_public_key(client_pem)
    server_priv = ec.generate_private_key(ec.SECP384R1())
    server_pub  = server_priv.public_key()

    shared = server_priv.exchange(ec.ECDH(), client_pub)
    key = HKDF(algorithm=hashes.SHA256(), length=32, salt=None,
               info=b"handshake data",).derive(shared)
    shared_secrets[sid] = key

    server_pem = server_pub.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ).decode()
    await socket.emit("server_public_key", {
        "server_public_key": server_pem,
        "derived_key":       base64.b64encode(key).decode()
    }, to=sid)

@socket.on("send_message")
async def on_message(sid, data):
    await socket.emit("receive_message", {
        "display_name": data["display_name"],
        "message":      data["message"]
    }, room=data["room"])

@socket.on("leave")
async def on_leave(sid, data):
    await socket.leave_room(sid, data["room"])
    await socket.emit("receive_message", {
        "display_name": data.get("display_name","Ramya"),
        "message":      f"{data.get('display_name','Ramya')} left {data['room']}"
    }, room=data["room"])

if __name__ == "__main__":
    import os
    uvicorn.run("app:app", host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
