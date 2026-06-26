from datetime import datetime
from typing import Optional, List

from sqlalchemy import (
    Boolean, DateTime, Enum, ForeignKey, Integer, String, Text, func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


# ─── Answer ──────────────────────────────────────────────────────────────────

class Answer(Base):
    __tablename__ = "answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    question_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    author_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    is_accepted: Mapped[bool] = mapped_column(Boolean, default=False)
    vote_score: Mapped[int] = mapped_column(Integer, default=0)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    question: Mapped["Question"] = relationship(  # noqa: F821
        "Question", back_populates="answers", foreign_keys=[question_id]
    )
    author: Mapped["User"] = relationship("User", back_populates="answers")  # noqa: F821
    comments: Mapped[List["Comment"]] = relationship(
        "Comment",
        back_populates="answer",
        lazy="select",
    )


# ─── Comment ─────────────────────────────────────────────────────────────────

class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    author_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    question_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=True, index=True
    )
    answer_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("answers.id", ondelete="CASCADE"), nullable=True, index=True
    )
    vote_score: Mapped[int] = mapped_column(Integer, default=0)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    author: Mapped["User"] = relationship("User", back_populates="comments")  # noqa: F821
    question: Mapped[Optional["Question"]] = relationship(  # noqa: F821
        "Question", back_populates="comments",
        primaryjoin="and_(Comment.question_id==Question.id, Comment.answer_id==None)",
        foreign_keys=[question_id],
    )
    answer: Mapped[Optional["Answer"]] = relationship(
        "Answer", back_populates="comments", foreign_keys=[answer_id]
    )


# ─── Vote ────────────────────────────────────────────────────────────────────

class Vote(Base):
    __tablename__ = "votes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    target_type: Mapped[str] = mapped_column(
        Enum("question", "answer", "comment", name="vote_target_type"), nullable=False
    )
    target_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    value: Mapped[int] = mapped_column(Integer, nullable=False)  # +1 or -1
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped["User"] = relationship("User", back_populates="votes")  # noqa: F821


# ─── Tag ─────────────────────────────────────────────────────────────────────

class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    excerpt: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    question_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    questions: Mapped[List["Question"]] = relationship(  # noqa: F821
        "Question",
        secondary="question_tags",
        back_populates="tags",
        lazy="select",
    )


# ─── Badge ───────────────────────────────────────────────────────────────────

class Badge(Base):
    __tablename__ = "badges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    badge_class: Mapped[str] = mapped_column(
        Enum("gold", "silver", "bronze", name="badge_class"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user_badges: Mapped[List["UserBadge"]] = relationship(
        "UserBadge", back_populates="badge", lazy="select"
    )


class UserBadge(Base):
    __tablename__ = "user_badges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    badge_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("badges.id", ondelete="CASCADE"), nullable=False, index=True
    )
    awarded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped["User"] = relationship("User", back_populates="badges")  # noqa: F821
    badge: Mapped["Badge"] = relationship("Badge", back_populates="user_badges")


# ─── Bookmark ────────────────────────────────────────────────────────────────

class Bookmark(Base):
    __tablename__ = "bookmarks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    question_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped["User"] = relationship("User", back_populates="bookmarks")  # noqa: F821
    question: Mapped["Question"] = relationship("Question", back_populates="bookmarks")  # noqa: F821