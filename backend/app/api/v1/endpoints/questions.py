"""
Question endpoints:
  GET    /questions               – paginated list with filters/sorting/search
  POST   /questions               – create
  GET    /questions/{id}          – detail + answers + comments
  PUT    /questions/{id}          – update (author or admin)
  DELETE /questions/{id}          – soft delete
  POST   /questions/{id}/vote     – upvote / downvote
  POST   /questions/{id}/bookmark – toggle bookmark
  POST   /questions/{id}/close    – close question (admin)
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, update, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.deps import get_current_admin, get_current_user, get_current_user_optional
from app.db.session import get_db
from app.models import Answer, Bookmark, Question, Tag, User, Vote
from app.models.answer import Comment
from app.schemas.question import (
    PaginatedQuestions,
    QuestionCreate,
    QuestionDetail,
    QuestionSummary,
    QuestionUpdate,
    VoteCreate,
)

router = APIRouter(prefix="/questions", tags=["questions"])


# ─── Helpers ─────────────────────────────────────────────────────────────────

async def _get_question_or_404(db: AsyncSession, question_id: int) -> Question:
    result = await db.execute(
        select(Question)
        .where(Question.id == question_id, Question.is_deleted == False)
        .options(
            selectinload(Question.author),
            selectinload(Question.tags),
            selectinload(Question.answers).selectinload(Answer.author),
            selectinload(Question.answers).selectinload(Answer.comments).selectinload(Comment.author),
            selectinload(Question.comments).selectinload(Comment.author),
        )
    )
    q = result.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    return q


async def _get_or_create_tags(db: AsyncSession, tag_names: List[str]) -> List[Tag]:
    tags = []
    for name in tag_names:
        result = await db.execute(select(Tag).where(Tag.name == name))
        tag = result.scalar_one_or_none()
        if not tag:
            tag = Tag(name=name)
            db.add(tag)
            await db.flush()
        tags.append(tag)
    return tags


def _enrich_question(q: Question, current_user: Optional[User], bookmarks: set, votes: dict) -> dict:
    data = {
        "id": q.id,
        "title": q.title,
        "body": q.body,
        "author": q.author,
        "tags": list(q.tags),
        "vote_score": q.vote_score,
        "answer_count": q.answer_count,
        "view_count": q.view_count,
        "is_closed": q.is_closed,
        "accepted_answer_id": q.accepted_answer_id,
        "created_at": q.created_at,
        "updated_at": q.updated_at,
        "last_activity_at": q.last_activity_at,
        "user_vote": votes.get(q.id),
        "is_bookmarked": q.id in bookmarks,
    }
    return data


# ─── List ────────────────────────────────────────────────────────────────────

@router.get("", response_model=PaginatedQuestions)
async def list_questions(
    page: int = Query(1, ge=1),
    per_page: int = Query(15, ge=1, le=50),
    sort: str = Query("newest", regex="^(newest|oldest|votes|activity|unanswered)$"),
    tag: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    query = (
        select(Question)
        .where(Question.is_deleted == False)
        .options(selectinload(Question.author), selectinload(Question.tags))
    )

    if tag:
        query = query.join(Question.tags).where(Tag.name == tag)
    if search:
        like = f"%{search}%"
        query = query.where(or_(Question.title.ilike(like), Question.body.ilike(like)))
    if sort == "newest":
        query = query.order_by(Question.created_at.desc())
    elif sort == "oldest":
        query = query.order_by(Question.created_at.asc())
    elif sort == "votes":
        query = query.order_by(Question.vote_score.desc())
    elif sort == "activity":
        query = query.order_by(Question.last_activity_at.desc())
    elif sort == "unanswered":
        query = query.where(Question.answer_count == 0).order_by(Question.created_at.desc())

    # Total count
    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar_one()

    # Paginate
    offset = (page - 1) * per_page
    questions = (await db.execute(query.offset(offset).limit(per_page))).scalars().all()

    # Current user bookmarks & votes
    bookmarks: set = set()
    votes: dict = {}
    if current_user:
        bm_result = await db.execute(
            select(Bookmark.question_id).where(
                Bookmark.user_id == current_user.id,
                Bookmark.question_id.in_([q.id for q in questions]),
            )
        )
        bookmarks = {r for r, in bm_result}
        vote_result = await db.execute(
            select(Vote.target_id, Vote.value).where(
                Vote.user_id == current_user.id,
                Vote.target_type == "question",
                Vote.target_id.in_([q.id for q in questions]),
            )
        )
        votes = {r.target_id: r.value for r in vote_result}

    items = [_enrich_question(q, current_user, bookmarks, votes) for q in questions]

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": max(1, -(-total // per_page)),
    }


# ─── Create ──────────────────────────────────────────────────────────────────

@router.post("", response_model=QuestionSummary, status_code=status.HTTP_201_CREATED)
async def create_question(
    payload: QuestionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tags = await _get_or_create_tags(db, payload.tags)
    question = Question(
        title=payload.title,
        body=payload.body,
        author_id=current_user.id,
        tags=tags,
    )
    db.add(question)
    await db.flush()

    # Update tag counts
    for tag in tags:
        tag.question_count += 1

    # Re-fetch with relationships eagerly loaded to avoid MissingGreenlet on lazy access
    result = await db.execute(
        select(Question)
        .where(Question.id == question.id)
        .options(selectinload(Question.author), selectinload(Question.tags))
    )
    question = result.scalar_one()
    return _enrich_question(question, current_user, set(), {})


# ─── Detail ──────────────────────────────────────────────────────────────────

@router.get("/{question_id}", response_model=QuestionDetail)
async def get_question(
    question_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    q = await _get_question_or_404(db, question_id)

    # Increment view count
    await db.execute(
        update(Question).where(Question.id == question_id).values(view_count=Question.view_count + 1)
    )

    bookmarks: set = set()
    votes: dict = {}
    answer_votes: dict = {}
    if current_user:
        bm = await db.execute(
            select(Bookmark.question_id).where(
                Bookmark.user_id == current_user.id, Bookmark.question_id == question_id
            )
        )
        bookmarks = {r for r, in bm}
        q_votes = await db.execute(
            select(Vote.target_id, Vote.value).where(
                Vote.user_id == current_user.id,
                Vote.target_type == "question",
                Vote.target_id == question_id,
            )
        )
        votes = {r.target_id: r.value for r in q_votes}
        a_votes = await db.execute(
            select(Vote.target_id, Vote.value).where(
                Vote.user_id == current_user.id,
                Vote.target_type == "answer",
                Vote.target_id.in_([a.id for a in q.answers]),
            )
        )
        answer_votes = {r.target_id: r.value for r in a_votes}

    answers_out = []
    for a in sorted(q.answers, key=lambda x: (-x.is_accepted, -x.vote_score, x.created_at)):
        if not a.is_deleted:
            answers_out.append({
                **a.__dict__,
                "author": a.author,
                "comments": [c for c in a.comments if not c.is_deleted],
                "user_vote": answer_votes.get(a.id),
            })

    base = _enrich_question(q, current_user, bookmarks, votes)
    return {
        **base,
        "close_reason": q.close_reason,
        "answers": answers_out,
        "comments": [c for c in q.comments if not c.is_deleted],
    }


# ─── Update ──────────────────────────────────────────────────────────────────

@router.put("/{question_id}", response_model=QuestionSummary)
async def update_question(
    question_id: int,
    payload: QuestionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = await _get_question_or_404(db, question_id)
    if q.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not allowed")

    if payload.title is not None:
        q.title = payload.title
    if payload.body is not None:
        q.body = payload.body
    if payload.tags is not None:
        tags = await _get_or_create_tags(db, payload.tags)
        q.tags = tags

    await db.flush()

    # Re-fetch with relationships eagerly loaded
    result = await db.execute(
        select(Question)
        .where(Question.id == q.id)
        .options(selectinload(Question.author), selectinload(Question.tags))
    )
    q = result.scalar_one()
    return _enrich_question(q, current_user, set(), {})


# ─── Delete ──────────────────────────────────────────────────────────────────

@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(
    question_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = await _get_question_or_404(db, question_id)
    if q.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not allowed")
    q.is_deleted = True


# ─── Vote ────────────────────────────────────────────────────────────────────

@router.post("/{question_id}/vote")
async def vote_question(
    question_id: int,
    payload: VoteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = await _get_question_or_404(db, question_id)
    if q.author_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot vote on your own question")

    existing = await db.execute(
        select(Vote).where(
            Vote.user_id == current_user.id,
            Vote.target_type == "question",
            Vote.target_id == question_id,
        )
    )
    vote = existing.scalar_one_or_none()

    if vote:
        if vote.value == payload.value:
            # Toggle off
            q.vote_score -= vote.value
            await db.delete(vote)
            new_vote = None
        else:
            # Change direction
            q.vote_score += payload.value - vote.value
            vote.value = payload.value
            new_vote = payload.value
    else:
        vote = Vote(
            user_id=current_user.id,
            target_type="question",
            target_id=question_id,
            value=payload.value,
        )
        db.add(vote)
        q.vote_score += payload.value
        new_vote = payload.value

    # Adjust author reputation
    reputation_delta = payload.value * 10 if not (vote and vote.value == payload.value) else -payload.value * 10
    author = await db.get(User, q.author_id)
    if author:
        author.reputation = max(1, author.reputation + reputation_delta)

    return {"vote_score": q.vote_score, "user_vote": new_vote}


# ─── Bookmark ────────────────────────────────────────────────────────────────

@router.post("/{question_id}/bookmark")
async def toggle_bookmark(
    question_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _get_question_or_404(db, question_id)
    existing = await db.execute(
        select(Bookmark).where(
            Bookmark.user_id == current_user.id, Bookmark.question_id == question_id
        )
    )
    bm = existing.scalar_one_or_none()
    if bm:
        await db.delete(bm)
        return {"bookmarked": False}
    db.add(Bookmark(user_id=current_user.id, question_id=question_id))
    return {"bookmarked": True}


# ─── Close ───────────────────────────────────────────────────────────────────

@router.post("/{question_id}/close")
async def close_question(
    question_id: int,
    reason: str = Query(..., max_length=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    q = await _get_question_or_404(db, question_id)
    q.is_closed = True
    q.close_reason = reason
    return {"detail": "Question closed"}