from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.routes import (
    auth, users, chats, contacts,
    messages, websocket, media, reactions,
    statuses, calls,                        # ← calls added
)
from app.core.config import settings
import app.models
import os
 
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for WhatsApp Clone",
    version="1.0.0",
)
 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
os.makedirs("uploads/profiles", exist_ok=True)
 
app.mount("/media",   StaticFiles(directory="media"),   name="media")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
 
app.include_router(auth.router,      prefix="/api/v1/auth",      tags=["Authentication"])
app.include_router(users.router,     prefix="/api/v1/users",      tags=["Users"])
app.include_router(contacts.router,  prefix="/api/v1/contacts",   tags=["Contacts"])
app.include_router(chats.router,     prefix="/api/v1/chats",      tags=["Chats"])
app.include_router(messages.router,  prefix="/api/v1/messages",   tags=["Messages"])
app.include_router(media.router,     prefix="/api/v1/media",      tags=["Media"])
app.include_router(reactions.router, prefix="/api/v1/reactions",  tags=["Reactions"])
app.include_router(statuses.router,  prefix="/api/v1/statuses",   tags=["Statuses"])
app.include_router(calls.router,     prefix="/api/v1/calls",      tags=["Calls"])   # ← NEW
app.include_router(websocket.router, prefix="/api/v1",            tags=["Websockets"])
 
@app.get("/")
def root():
    return {"message": "Welcome to WhatsApp Clone API!"}