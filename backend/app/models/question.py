from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    Boolean, DateTime, ForeignKey, Integer, String, Text, func, Table, Column
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

# Many-to-many: questions <-> tags
question_tags = Table(
    "question_tags",
    Base.metadata,
    Column("question_id", Integer, ForeignKey("questions.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False, index=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    author_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    accepted_answer_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("answers.id", ondelete="SET NULL"), nullable=True
    )

    view_count: Mapped[int] = mapped_column(Integer, default=0)
    vote_score: Mapped[int] = mapped_column(Integer, default=0)
    answer_count: Mapped[int] = mapped_column(Integer, default=0)
    is_closed: Mapped[bool] = mapped_column(Boolean, default=False)
    close_reason: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    is_protected: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    last_activity_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )

    # Relationships — NO lazy="dynamic", use select (default) so selectinload works
    author: Mapped["User"] = relationship("User", back_populates="questions")  # noqa: F821
    answers: Mapped[List["Answer"]] = relationship(  # noqa: F821
        "Answer",
        back_populates="question",
        foreign_keys="Answer.question_id",
        lazy="select",
    )
    accepted_answer: Mapped[Optional["Answer"]] = relationship(  # noqa: F821
        "Answer",
        foreign_keys=[accepted_answer_id],
        post_update=True,
    )
    tags: Mapped[List["Tag"]] = relationship(  # noqa: F821
        "Tag", secondary=question_tags, back_populates="questions"
    )
    comments: Mapped[List["Comment"]] = relationship(  # noqa: F821
        "Comment",
        back_populates="question",
        primaryjoin="and_(Comment.question_id==Question.id, Comment.answer_id==None)",
        foreign_keys="Comment.question_id",
        lazy="select",
    )
    bookmarks: Mapped[List["Bookmark"]] = relationship(  # noqa: F821
        "Bookmark", back_populates="question", lazy="select"
    )