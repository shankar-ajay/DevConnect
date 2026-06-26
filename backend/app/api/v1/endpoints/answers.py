"""
Answer endpoints:
  POST   /questions/{id}/answers         – post answer
  PUT    /answers/{id}                   – update answer
  DELETE /answers/{id}                   – delete answer
  POST   /answers/{id}/vote              – vote
  POST   /answers/{id}/accept            – accept (question author)
  GET    /answers/{id}/comments          – list comments
  POST   /answers/{id}/comments          – add comment
  PUT    /comments/{id}                  – edit comment
  DELETE /comments/{id}                  – delete comment
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.deps import get_current_user
from app.db.session import get_db
from app.models import Answer, Question, User, Vote
from app.models.answer import Comment
from app.schemas.question import AnswerCreate, AnswerOut, AnswerUpdate, CommentCreate, CommentOut, VoteCreate

router = APIRouter(tags=["answers"])


# ─── Helpers ─────────────────────────────────────────────────────────────────

async def _get_answer_or_404(db: AsyncSession, answer_id: int) -> Answer:
    result = await db.execute(
        select(Answer)
        .where(Answer.id == answer_id, Answer.is_deleted == False)
        .options(selectinload(Answer.author), selectinload(Answer.comments).selectinload(Comment.author))
    )
    a = result.scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Answer not found")
    return a


# ─── Post Answer ─────────────────────────────────────────────────────────────

@router.post("/questions/{question_id}/answers", response_model=AnswerOut, status_code=201)
async def create_answer(
    question_id: int,
    payload: AnswerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q_result = await db.execute(
        select(Question).where(Question.id == question_id, Question.is_deleted == False)
    )
    question = q_result.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    if question.is_closed:
        raise HTTPException(status_code=400, detail="Question is closed")

    answer = Answer(body=payload.body, question_id=question_id, author_id=current_user.id)
    db.add(answer)
    question.answer_count += 1
    await db.flush()

    # Eagerly reload author to avoid MissingGreenlet on lazy access
    result = await db.execute(
        select(Answer)
        .where(Answer.id == answer.id)
        .options(selectinload(Answer.author), selectinload(Answer.comments))
    )
    answer = result.scalar_one()
    return {**answer.__dict__, "author": answer.author, "comments": [], "user_vote": None}


# ─── Update Answer ───────────────────────────────────────────────────────────

@router.put("/answers/{answer_id}", response_model=AnswerOut)
async def update_answer(
    answer_id: int,
    payload: AnswerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    answer = await _get_answer_or_404(db, answer_id)
    if answer.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not allowed")
    answer.body = payload.body
    await db.flush()
    return {**answer.__dict__, "author": answer.author, "comments": list(answer.comments), "user_vote": None}


# ─── Delete Answer ───────────────────────────────────────────────────────────

@router.delete("/answers/{answer_id}", status_code=204)
async def delete_answer(
    answer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    answer = await _get_answer_or_404(db, answer_id)
    if answer.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not allowed")
    answer.is_deleted = True
    # Decrement question answer count
    await db.execute(
        update(Question)
        .where(Question.id == answer.question_id)
        .values(answer_count=Question.answer_count - 1)
    )


# ─── Vote Answer ─────────────────────────────────────────────────────────────

@router.post("/answers/{answer_id}/vote")
async def vote_answer(
    answer_id: int,
    payload: VoteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    answer = await _get_answer_or_404(db, answer_id)
    if answer.author_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot vote on your own answer")

    existing = await db.execute(
        select(Vote).where(
            Vote.user_id == current_user.id,
            Vote.target_type == "answer",
            Vote.target_id == answer_id,
        )
    )
    vote = existing.scalar_one_or_none()
    new_vote = None

    if vote:
        if vote.value == payload.value:
            answer.vote_score -= vote.value
            await db.delete(vote)
        else:
            answer.vote_score += payload.value - vote.value
            vote.value = payload.value
            new_vote = payload.value
    else:
        db.add(Vote(user_id=current_user.id, target_type="answer", target_id=answer_id, value=payload.value))
        answer.vote_score += payload.value
        new_vote = payload.value

    # Reputation: +10 upvote, -2 downvote
    rep_map = {1: 10, -1: -2}
    author = await db.get(User, answer.author_id)
    if author:
        author.reputation = max(1, author.reputation + rep_map.get(payload.value, 0))

    return {"vote_score": answer.vote_score, "user_vote": new_vote}


# ─── Accept Answer ───────────────────────────────────────────────────────────

@router.post("/answers/{answer_id}/accept")
async def accept_answer(
    answer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    answer = await _get_answer_or_404(db, answer_id)
    q_result = await db.execute(select(Question).where(Question.id == answer.question_id))
    question = q_result.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404)
    if question.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only question author can accept answers")

    # Un-accept previous if any
    if question.accepted_answer_id and question.accepted_answer_id != answer_id:
        prev = await db.get(Answer, question.accepted_answer_id)
        if prev:
            prev.is_accepted = False

    if question.accepted_answer_id == answer_id:
        # Toggle off
        answer.is_accepted = False
        question.accepted_answer_id = None
    else:
        answer.is_accepted = True
        question.accepted_answer_id = answer_id
        # +15 rep for author
        author = await db.get(User, answer.author_id)
        if author:
            author.reputation += 15

    return {"accepted": answer.is_accepted}


# ─── Comments ────────────────────────────────────────────────────────────────

@router.post("/questions/{question_id}/comments", response_model=CommentOut, status_code=201)
async def add_question_comment(
    question_id: int,
    payload: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = Comment(body=payload.body, question_id=question_id, author_id=current_user.id)
    db.add(comment)
    await db.flush()
    result = await db.execute(
        select(Comment).where(Comment.id == comment.id).options(selectinload(Comment.author))
    )
    comment = result.scalar_one()
    return {**comment.__dict__, "author": comment.author}


@router.post("/answers/{answer_id}/comments", response_model=CommentOut, status_code=201)
async def add_answer_comment(
    answer_id: int,
    payload: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = Comment(body=payload.body, answer_id=answer_id, author_id=current_user.id)
    db.add(comment)
    await db.flush()
    result = await db.execute(
        select(Comment).where(Comment.id == comment.id).options(selectinload(Comment.author))
    )
    comment = result.scalar_one()
    return {**comment.__dict__, "author": comment.author}


@router.delete("/comments/{comment_id}", status_code=204)
async def delete_comment(
    comment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Comment).where(Comment.id == comment_id))
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not allowed")
    comment.is_deleted = True