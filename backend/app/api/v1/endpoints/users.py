"""
User endpoints:
  GET  /users               – list users
  GET  /users/{username}    – profile
  PUT  /users/me            – update own profile
  PUT  /users/me/password   – change password
  GET  /users/me/bookmarks  – saved questions

Tag endpoints:
  GET  /tags                – list/search tags
  GET  /tags/{name}         – tag detail
  POST /tags                – create tag (admin)
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.deps import get_current_admin, get_current_user
from app.db.session import get_db
from app.models import Bookmark, Question, Tag, User
from app.core.security import get_password_hash, verify_password
from app.schemas.question import PaginatedQuestions, QuestionSummary, TagCreate, TagOut
from app.schemas.user import UserPasswordUpdate, UserPrivate, UserPublic, UserUpdate

users_router = APIRouter(prefix="/users", tags=["users"])
tags_router = APIRouter(prefix="/tags", tags=["tags"])


# ────────────────────────── USERS ──────────────────────────────────────────

@users_router.get("", response_model=List[UserPublic])
async def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    search: Optional[str] = Query(None),
    sort: str = Query("reputation", regex="^(reputation|newest|name)$"),
    db: AsyncSession = Depends(get_db),
):
    query = select(User).where(User.is_active == True)
    if search:
        query = query.where(User.username.ilike(f"%{search}%") | User.display_name.ilike(f"%{search}%"))
    if sort == "reputation":
        query = query.order_by(User.reputation.desc())
    elif sort == "newest":
        query = query.order_by(User.created_at.desc())
    elif sort == "name":
        query = query.order_by(User.display_name.asc())

    offset = (page - 1) * per_page
    result = await db.execute(query.offset(offset).limit(per_page))
    return result.scalars().all()


@users_router.get("/me", response_model=UserPrivate)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@users_router.put("/me", response_model=UserPrivate)
async def update_me(
    payload: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    await db.flush()
    return current_user


@users_router.put("/me/password")
async def change_password(
    payload: UserPasswordUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.hashed_password:
        raise HTTPException(status_code=400, detail="OAuth account – no password set")
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password incorrect")
    current_user.hashed_password = get_password_hash(payload.new_password)
    return {"detail": "Password updated"}


@users_router.get("/me/bookmarks")
async def my_bookmarks(
    page: int = Query(1, ge=1),
    per_page: int = Query(15, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        select(Question)
        .join(Bookmark, Bookmark.question_id == Question.id)
        .where(Bookmark.user_id == current_user.id, Question.is_deleted == False)
        .options(selectinload(Question.author), selectinload(Question.tags))
        .order_by(Bookmark.created_at.desc())
    )
    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar_one()
    offset = (page - 1) * per_page
    questions = (await db.execute(query.offset(offset).limit(per_page))).scalars().all()

    def _enrich(q):
        return {
            "id": q.id, "title": q.title, "body": q.body, "author": q.author,
            "tags": list(q.tags), "vote_score": q.vote_score, "answer_count": q.answer_count,
            "view_count": q.view_count, "is_closed": q.is_closed,
            "accepted_answer_id": q.accepted_answer_id,
            "created_at": q.created_at, "updated_at": q.updated_at,
            "last_activity_at": q.last_activity_at, "user_vote": None, "is_bookmarked": True,
        }

    return {
        "items": [_enrich(q) for q in questions],
        "total": total, "page": page, "per_page": per_page,
        "pages": max(1, -(-total // per_page)),
    }


@users_router.get("/{username}", response_model=UserPublic)
async def get_user_profile(username: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ────────────────────────── TAGS ───────────────────────────────────────────

@tags_router.get("", response_model=List[TagOut])
async def list_tags(
    page: int = Query(1, ge=1),
    per_page: int = Query(30, ge=1, le=100),
    search: Optional[str] = Query(None),
    sort: str = Query("popular", regex="^(popular|newest|name)$"),
    db: AsyncSession = Depends(get_db),
):
    query = select(Tag)
    if search:
        query = query.where(Tag.name.ilike(f"%{search}%"))
    if sort == "popular":
        query = query.order_by(Tag.question_count.desc())
    elif sort == "newest":
        query = query.order_by(Tag.created_at.desc())
    elif sort == "name":
        query = query.order_by(Tag.name.asc())

    offset = (page - 1) * per_page
    result = await db.execute(query.offset(offset).limit(per_page))
    return result.scalars().all()


@tags_router.get("/{tag_name}", response_model=TagOut)
async def get_tag(tag_name: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tag).where(Tag.name == tag_name.lower()))
    tag = result.scalar_one_or_none()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return tag


@tags_router.post("", response_model=TagOut, status_code=201)
async def create_tag(
    payload: TagCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    existing = await db.execute(select(Tag).where(Tag.name == payload.name.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Tag already exists")
    tag = Tag(name=payload.name.lower(), description=payload.description, excerpt=payload.excerpt)
    db.add(tag)
    await db.flush()
    return tag
