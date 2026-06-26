from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import Boolean, DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # OAuth provider links
    google_id: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True)
    github_id: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True)

    # Account state
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)

    # Reputation & stats
    reputation: Mapped[int] = mapped_column(Integer, default=1)
    gold_badges: Mapped[int] = mapped_column(Integer, default=0)
    silver_badges: Mapped[int] = mapped_column(Integer, default=0)
    bronze_badges: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    last_seen_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships — NO lazy="dynamic", use select (default) so selectinload works
    questions: Mapped[List["Question"]] = relationship(  # noqa: F821
        "Question", back_populates="author", lazy="select"
    )
    answers: Mapped[List["Answer"]] = relationship(  # noqa: F821
        "Answer", back_populates="author", lazy="select"
    )
    comments: Mapped[List["Comment"]] = relationship(  # noqa: F821
        "Comment", back_populates="author", lazy="select"
    )
    votes: Mapped[List["Vote"]] = relationship(  # noqa: F821
        "Vote", back_populates="user", lazy="select"
    )
    badges: Mapped[List["UserBadge"]] = relationship(  # noqa: F821
        "UserBadge", back_populates="user", lazy="select"
    )
    bookmarks: Mapped[List["Bookmark"]] = relationship(  # noqa: F821
        "Bookmark", back_populates="user", lazy="select"
    )