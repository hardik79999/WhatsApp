from fastapi import FastAPI, websockets
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.routes import auth, users, chats, contacts, messages, websocket, media, reactions

from app.core.config import settings
import app.models

# FastAPI instance create karna
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for WhatsApp Clone",
    version="1.0.0"
)

# CORS Middleware setup - Ye kisi bhi frontend ko API call karne allow karega
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Production mein yahan apna frontend ka exact URL daalte hain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount media directory for serving uploaded files
app.mount("/media", StaticFiles(directory="media"), name="media")

# Auth router ko API mein add karna
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(contacts.router, prefix="/api/v1/contacts", tags=["Contacts"])
app.include_router(chats.router, prefix="/api/v1/chats", tags=["Chats"])
app.include_router(messages.router, prefix="/api/v1/messages", tags=["Messages"])
app.include_router(media.router, prefix="/api/v1/media", tags=["Media"])
app.include_router(reactions.router, prefix="/api/v1/reactions", tags=["Reactions"])
app.include_router(websocket.router, prefix="/api/v1", tags=["Websockets"])

# Health check route (Bas ye check karne ke liye ki server chal raha hai)
@app.get("/")
def root():
    return {"message": "Welcome to WhatsApp Clone API!"}