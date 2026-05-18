import logging
import os

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from sqlalchemy.exc import SQLAlchemyError

from app.api.routes import (
    auth, users, chats, contacts,
    messages, websocket, media, reactions,
    statuses, calls, groups,                # ← calls added
)
from app.core.config import settings
from app.core.rate_limit import limiter
import app.models

logger = logging.getLogger("whatsapp_clone")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for WhatsApp Clone",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    logger.error("Rate limit exceeded: %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please try again later."},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error("Request validation error on %s %s: %s", request.method, request.url.path, exc.errors())
    errors = [
        {
            "field": ".".join(str(part) for part in error.get("loc", []) if part != "body"),
            "message": error.get("msg", "Invalid value"),
        }
        for error in exc.errors()
    ]
    return JSONResponse(status_code=422, content={"detail": errors})


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.error("HTTP error on %s %s: %s", request.method, request.url.path, exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "status_code": exc.status_code},
        headers=getattr(exc, "headers", None),
    )


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    logger.error("Database error on %s %s", request.method, request.url.path, exc_info=exc)
    return JSONResponse(status_code=500, content={"detail": "Database error"})


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled error on %s %s", request.method, request.url.path, exc_info=exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_origin_regex=settings.allowed_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads/profiles", exist_ok=True)
settings.media_storage_path.mkdir(parents=True, exist_ok=True)

app.mount("/media",   StaticFiles(directory=str(settings.media_storage_path)),   name="media")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router,      prefix="/api/v1/auth",      tags=["Authentication"])
app.include_router(users.router,     prefix="/api/v1/users",      tags=["Users"])
app.include_router(contacts.router,  prefix="/api/v1/contacts",   tags=["Contacts"])
app.include_router(chats.router,     prefix="/api/v1/chats",      tags=["Chats"])
app.include_router(groups.router,    prefix="/api/v1/groups",     tags=["Groups"])
app.include_router(messages.router,  prefix="/api/v1/messages",   tags=["Messages"])
app.include_router(media.router,     prefix="/api/v1/media",      tags=["Media"])
app.include_router(reactions.router, prefix="/api/v1/reactions",  tags=["Reactions"])
app.include_router(statuses.router,  prefix="/api/v1/statuses",   tags=["Statuses"])
app.include_router(calls.router,     prefix="/api/v1/calls",      tags=["Calls"])   # ← NEW
app.include_router(websocket.router, prefix="/api/v1",            tags=["Websockets"])
 
@app.get("/")
def root():
    return {"message": "Welcome to WhatsApp Clone API!"}
