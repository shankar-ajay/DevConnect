"""
Auth endpoints:
  POST /auth/register
  POST /auth/login
  POST /auth/refresh
  POST /auth/logout
  GET  /auth/google              – redirect to Google consent
  GET  /auth/google/callback     – OAuth callback
  GET  /auth/github              – redirect to GitHub consent
  GET  /auth/github/callback     – OAuth callback
  GET  /auth/me                  – current user info
"""

import secrets
from typing import Optional
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user
from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import OAuthCallback, Token, TokenRefresh, UserLogin, UserRegister
from app.schemas.user import UserPrivate

router = APIRouter(prefix="/auth", tags=["auth"])

#FRONTEND_URL = "http://localhost:3000"
FRONTEND_URL = settings.FRONTEND_URL


# ─── Helper ──────────────────────────────────────────────────────────────────

def _issue_tokens(user: User) -> Token:
    return Token(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


async def _get_or_create_oauth_user(
    db: AsyncSession,
    *,
    provider_field: str,
    provider_id: str,
    email: str,
    display_name: str,
    avatar_url: Optional[str] = None,
) -> User:
    """Find existing user by OAuth id or email; create if new."""
    # 1. Try by OAuth id
    result = await db.execute(
        select(User).where(getattr(User, provider_field) == provider_id)
    )
    user = result.scalar_one_or_none()
    if user:
        return user

    # 2. Try by email (link accounts)
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user:
        setattr(user, provider_field, provider_id)
        if not user.avatar_url and avatar_url:
            user.avatar_url = avatar_url
        return user

    # 3. Create new
    base_username = email.split("@")[0].lower()[:20]
    username = base_username
    suffix = 1
    while True:
        existing = await db.execute(select(User).where(User.username == username))
        if not existing.scalar_one_or_none():
            break
        username = f"{base_username}{suffix}"
        suffix += 1

    user = User(
        email=email,
        username=username,
        display_name=display_name,
        avatar_url=avatar_url,
        is_verified=True,
        **{provider_field: provider_id},
    )
    db.add(user)
    await db.flush()
    return user


# ─── Register / Login ────────────────────────────────────────────────────────

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegister, db: AsyncSession = Depends(get_db)):
    # Check uniqueness
    email_exists = await db.execute(select(User).where(User.email == payload.email))
    if email_exists.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    username_exists = await db.execute(select(User).where(User.username == payload.username))
    if username_exists.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        email=payload.email,
        username=payload.username,
        display_name=payload.display_name,
        hashed_password=get_password_hash(payload.password),
    )
    db.add(user)
    await db.flush()
    return _issue_tokens(user)


@router.post("/login", response_model=Token)
async def login(payload: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    if not user or not user.hashed_password or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")
    return _issue_tokens(user)


@router.post("/refresh", response_model=Token)
async def refresh_token(payload: TokenRefresh, db: AsyncSession = Depends(get_db)):
    data = decode_token(payload.refresh_token)
    if not data or data.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    result = await db.execute(select(User).where(User.id == int(data["sub"])))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")
    return _issue_tokens(user)


@router.post("/logout")
async def logout():
    # Stateless JWT – instruct client to drop tokens
    return {"detail": "Logged out successfully"}


@router.get("/me", response_model=UserPrivate)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


# ─── Google OAuth ────────────────────────────────────────────────────────────

@router.get("/google")
async def google_auth():
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google OAuth not configured")
    state = secrets.token_urlsafe(16)
    params = urlencode({
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
    })
    return RedirectResponse(f"https://accounts.google.com/o/oauth2/v2/auth?{params}")


@router.get("/google/callback")
async def google_callback(
    code: str = Query(...),
    state: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    async with httpx.AsyncClient() as client:
        # Exchange code for tokens
        token_resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )
        if token_resp.status_code != 200:
            return RedirectResponse(f"{FRONTEND_URL}/login?error=google_auth_failed")

        google_tokens = token_resp.json()
        # Fetch user info
        user_resp = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {google_tokens['access_token']}"},
        )
        if user_resp.status_code != 200:
            return RedirectResponse(f"{FRONTEND_URL}/login?error=google_user_failed")

        info = user_resp.json()

    user = await _get_or_create_oauth_user(
        db,
        provider_field="google_id",
        provider_id=info["id"],
        email=info["email"],
        display_name=info.get("name", info["email"]),
        avatar_url=info.get("picture"),
    )
    tokens = _issue_tokens(user)
    params = urlencode({
        "access_token": tokens.access_token,
        "refresh_token": tokens.refresh_token,
    })
    return RedirectResponse(f"{FRONTEND_URL}/auth/callback?{params}")


# ─── GitHub OAuth ────────────────────────────────────────────────────────────

@router.get("/github")
async def github_auth():
    if not settings.GITHUB_CLIENT_ID:
        raise HTTPException(status_code=503, detail="GitHub OAuth not configured")
    state = secrets.token_urlsafe(16)
    params = urlencode({
        "client_id": settings.GITHUB_CLIENT_ID,
        "redirect_uri": settings.GITHUB_REDIRECT_URI,
        "scope": "read:user user:email",
        "state": state,
    })
    return RedirectResponse(f"https://github.com/login/oauth/authorize?{params}")


@router.get("/github/callback")
async def github_callback(
    code: str = Query(...),
    state: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": settings.GITHUB_REDIRECT_URI,
            },
        )
        if token_resp.status_code != 200:
            return RedirectResponse(f"{FRONTEND_URL}/login?error=github_auth_failed")

        gh_tokens = token_resp.json()
        access_token = gh_tokens.get("access_token")

        user_resp = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
        )
        emails_resp = await client.get(
            "https://api.github.com/user/emails",
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
        )

    gh_user = user_resp.json()
    emails = emails_resp.json() if emails_resp.status_code == 200 else []
    primary_email = next(
        (e["email"] for e in emails if e.get("primary") and e.get("verified")),
        gh_user.get("email"),
    )
    if not primary_email:
        return RedirectResponse(f"{FRONTEND_URL}/login?error=github_no_email")

    user = await _get_or_create_oauth_user(
        db,
        provider_field="github_id",
        provider_id=str(gh_user["id"]),
        email=primary_email,
        display_name=gh_user.get("name") or gh_user.get("login", primary_email),
        avatar_url=gh_user.get("avatar_url"),
    )
    tokens = _issue_tokens(user)
    params = urlencode({
        "access_token": tokens.access_token,
        "refresh_token": tokens.refresh_token,
    })
    return RedirectResponse(f"{FRONTEND_URL}/auth/callback?{params}")
