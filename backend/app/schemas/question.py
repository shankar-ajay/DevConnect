from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, field_validator

from app.schemas.user import UserPublic


# ─── Tag ─────────────────────────────────────────────────────────────────────

class TagBase(BaseModel):
    name: str
    description: Optional[str] = None
    excerpt: Optional[str] = None


class TagCreate(TagBase):
    pass


class TagOut(TagBase):
    id: int
    question_count: int

    class Config:
        from_attributes = True


# ─── Comment ─────────────────────────────────────────────────────────────────

class CommentCreate(BaseModel):
    body: str

    @field_validator("body")
    @classmethod
    def min_length(cls, v: str) -> str:
        if len(v.strip()) < 15:
            raise ValueError("Comment must be at least 15 characters")
        return v


class CommentOut(BaseModel):
    id: int
    body: str
    author: UserPublic
    vote_score: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ─── Answer ──────────────────────────────────────────────────────────────────

class AnswerCreate(BaseModel):
    body: str

    @field_validator("body")
    @classmethod
    def min_length(cls, v: str) -> str:
        if len(v.strip()) < 30:
            raise ValueError("Answer must be at least 30 characters")
        return v


class AnswerUpdate(BaseModel):
    body: str


class AnswerOut(BaseModel):
    id: int
    body: str
    question_id: int
    author: UserPublic
    is_accepted: bool
    vote_score: int
    created_at: datetime
    updated_at: datetime
    comments: List[CommentOut] = []
    user_vote: Optional[int] = None   # +1, -1, or None for current user

    class Config:
        from_attributes = True


# ─── Question ────────────────────────────────────────────────────────────────

class QuestionCreate(BaseModel):
    title: str
    body: str
    tags: List[str]

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        if len(v.strip()) < 15:
            raise ValueError("Title must be at least 15 characters")
        if len(v.strip()) > 300:
            raise ValueError("Title must be less than 300 characters")
        return v

    @field_validator("body")
    @classmethod
    def validate_body(cls, v: str) -> str:
        if len(v.strip()) < 30:
            raise ValueError("Body must be at least 30 characters")
        return v

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: List[str]) -> List[str]:
        if not v:
            raise ValueError("At least one tag is required")
        if len(v) > 5:
            raise ValueError("Maximum 5 tags allowed")
        return [t.lower().strip() for t in v]


class QuestionUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    tags: Optional[List[str]] = None


class QuestionSummary(BaseModel):
    id: int
    title: str
    body: str
    author: UserPublic
    tags: List[TagOut] = []
    vote_score: int
    answer_count: int
    view_count: int
    is_closed: bool
    accepted_answer_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    last_activity_at: datetime
    user_vote: Optional[int] = None
    is_bookmarked: bool = False

    class Config:
        from_attributes = True


class QuestionDetail(QuestionSummary):
    close_reason: Optional[str] = None
    answers: List[AnswerOut] = []
    comments: List[CommentOut] = []

    class Config:
        from_attributes = True


# ─── Vote ────────────────────────────────────────────────────────────────────

class VoteCreate(BaseModel):
    value: int  # +1 or -1

    @field_validator("value")
    @classmethod
    def validate_value(cls, v: int) -> int:
        if v not in (1, -1):
            raise ValueError("Vote value must be +1 or -1")
        return v


# ─── Pagination ──────────────────────────────────────────────────────────────

class PaginatedQuestions(BaseModel):
    items: List[QuestionSummary]
    total: int
    page: int
    per_page: int
    pages: int
