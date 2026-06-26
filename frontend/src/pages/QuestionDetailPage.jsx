import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import MarkdownRenderer from '../components/common/MarkdownRenderer';
import MarkdownEditor from '../components/common/MarkdownEditor';
import VoteControl from '../components/common/VoteControl';
import { TagPill, UserChip, LoadingCenter, ErrorBanner } from '../components/common/UI';
import { questionsAPI, answersAPI, commentsAPI } from '../api/client';
import useAuthStore from '../context/authStore';
import { timeAgo, formatDateFull, extractErrorMessage } from '../utils/helpers';

// ── Comment ───────────────────────────────────────────────────────────────

function Comment({ comment, onDelete, canDelete }) {
  return (
    <div className="flex items-start gap-2 py-2 border-t text-sm" style={{ borderColor: 'var(--border-light)' }}>
      <p className="flex-1" style={{ color: 'var(--text-primary)' }}>
        <MarkdownRenderer content={comment.body} />
      </p>
      <div className="flex items-center gap-2 flex-shrink-0 text-xs" style={{ color: 'var(--text-muted)' }}>
        <Link to={`/users/${comment.author?.username}`} style={{ color: 'var(--link)' }}>
          {comment.author?.display_name}
        </Link>
        <span>{timeAgo(comment.created_at)}</span>
        {canDelete && (
          <button onClick={onDelete} className="hover:text-red-500 transition-colors">✕</button>
        )}
      </div>
    </div>
  );
}

// ── CommentForm ───────────────────────────────────────────────────────────

function CommentForm({ onSubmit, placeholder = 'Add a comment…' }) {
  const [body, setBody] = useState('');
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!show) {
    return (
      <button onClick={() => setShow(true)} className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
        Add a comment
      </button>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    if (body.trim().length < 15) return;
    setSubmitting(true);
    await onSubmit(body.trim());
    setBody('');
    setShow(false);
    setSubmitting(false);
  };

  return (
    <form onSubmit={submit} className="mt-3 space-y-2">
      <textarea value={body} onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder} rows={2}
        className="form-input text-sm resize-none"
        style={{ fontFamily: 'inherit' }} />
      <div className="flex gap-2">
        <button type="submit" disabled={submitting || body.trim().length < 15} className="btn-primary text-xs py-1">
          {submitting ? 'Posting…' : 'Add Comment'}
        </button>
        <button type="button" onClick={() => setShow(false)} className="btn-ghost text-xs py-1">Cancel</button>
      </div>
    </form>
  );
}

// ── Answer component ──────────────────────────────────────────────────────

function AnswerBlock({ answer, questionAuthorId, onUpdate }) {
  const { user, isAuthenticated } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(answer.body);
  const [saving, setSaving] = useState(false);
  const [localAnswer, setLocalAnswer] = useState(answer);
  const [localComments, setLocalComments] = useState(answer.comments || []);

  const canEdit   = user?.id === localAnswer.author_id || user?.is_admin;
  const canAccept = user?.id === questionAuthorId;

  const handleVote = async (v) => {
    const { data } = await answersAPI.vote(localAnswer.id, v);
    setLocalAnswer((a) => ({ ...a, vote_score: data.vote_score, user_vote: data.user_vote }));
  };

  const handleAccept = async () => {
    const { data } = await answersAPI.accept(localAnswer.id);
    setLocalAnswer((a) => ({ ...a, is_accepted: data.accepted }));
    onUpdate?.();
  };

  const handleEdit = async () => {
    setSaving(true);
    try {
      await answersAPI.update(localAnswer.id, { body: editBody });
      setLocalAnswer((a) => ({ ...a, body: editBody }));
      setEditing(false);
    } catch (e) { alert(extractErrorMessage(e)); }
    setSaving(false);
  };

  const handleAddComment = async (body) => {
    const { data } = await answersAPI.addComment(localAnswer.id, body);
    setLocalComments((c) => [...c, data]);
  };

  const handleDeleteComment = async (cid) => {
    await commentsAPI.delete(cid);
    setLocalComments((c) => c.filter((x) => x.id !== cid));
  };

  return (
    <div className={`flex gap-4 py-5 border-t ${localAnswer.is_accepted ? 'bg-green-50 dark:bg-green-950/20' : ''}`}
      style={{ borderColor: 'var(--border)' }}>
      <VoteControl
        score={localAnswer.vote_score}
        userVote={localAnswer.user_vote}
        onVote={handleVote}
        isAnswer
        isAccepted={localAnswer.is_accepted}
        canAccept={canAccept}
        onAccept={handleAccept}
      />
      <div className="flex-1 min-w-0">
        {localAnswer.is_accepted && (
          <div className="flex items-center gap-1 text-xs mb-2 font-semibold" style={{ color: 'var(--accepted)' }}>
            ✓ Accepted Answer
          </div>
        )}
        {editing ? (
          <div className="space-y-3">
            <MarkdownEditor value={editBody} onChange={setEditBody} minRows={8} />
            <div className="flex gap-2">
              <button onClick={handleEdit} disabled={saving} className="btn-primary text-xs">{saving ? 'Saving…' : 'Save edits'}</button>
              <button onClick={() => setEditing(false)} className="btn-ghost text-xs">Cancel</button>
            </div>
          </div>
        ) : (
          <MarkdownRenderer content={localAnswer.body} />
        )}

        <div className="flex flex-wrap items-center gap-3 mt-4 justify-between">
          <div className="flex gap-3">
            {canEdit && !editing && (
              <button onClick={() => setEditing(true)} className="text-xs" style={{ color: 'var(--text-muted)' }}>Edit</button>
            )}
          </div>
          <UserChip user={localAnswer.author} date={localAnswer.created_at} action="answered" />
        </div>

        {/* Comments */}
        <div className="mt-3">
          {localComments.filter(c => !c.is_deleted).map((c) => (
            <Comment key={c.id} comment={c}
              canDelete={user?.id === c.author_id || user?.is_admin}
              onDelete={() => handleDeleteComment(c.id)} />
          ))}
          {isAuthenticated && <CommentForm onSubmit={handleAddComment} />}
        </div>
      </div>
    </div>
  );
}

// ── Main Question Detail ───────────────────────────────────────────────────

export default function QuestionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answerBody, setAnswerBody] = useState('');
  const [answerError, setAnswerError] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  const fetchQuestion = useCallback(async () => {
    try {
      const { data } = await questionsAPI.get(id);
      setQuestion(data);
    } catch (e) {
      setError('Question not found or has been deleted.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchQuestion(); }, [fetchQuestion]);

  const handleVote = async (v) => {
    const { data } = await questionsAPI.vote(id, v);
    setQuestion((q) => ({ ...q, vote_score: data.vote_score, user_vote: data.user_vote }));
  };

  const handleBookmark = async () => {
    const { data } = await questionsAPI.bookmark(id);
    setQuestion((q) => ({ ...q, is_bookmarked: data.bookmarked }));
  };

  const handleDeleteQuestion = async () => {
    if (!window.confirm('Delete this question?')) return;
    await questionsAPI.delete(id);
    navigate('/questions');
  };

  const handleAddComment = async (body) => {
    const { data } = await questionsAPI.addComment(id, body);
    setQuestion((q) => ({ ...q, comments: [...(q.comments || []), data] }));
  };

  const handleDeleteComment = async (cid) => {
    await commentsAPI.delete(cid);
    setQuestion((q) => ({ ...q, comments: q.comments.filter((c) => c.id !== cid) }));
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (answerBody.trim().length < 30) { setAnswerError('Answer must be at least 30 characters'); return; }
    setSubmittingAnswer(true);
    setAnswerError('');
    try {
      const { data } = await answersAPI.create(id, { body: answerBody });
      setQuestion((q) => ({ ...q, answers: [...(q.answers || []), data], answer_count: (q.answer_count || 0) + 1 }));
      setAnswerBody('');
    } catch (e) { setAnswerError(extractErrorMessage(e)); }
    setSubmittingAnswer(false);
  };

  if (loading) return <Layout><LoadingCenter /></Layout>;
  if (error) return <Layout><ErrorBanner message={error} /></Layout>;
  if (!question) return null;

  const canEdit = user?.id === question.author?.id || user?.is_admin;

  return (
    <Layout>
      <div className="max-w-4xl">
        {/* Question header */}
        <div className="mb-4 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h1 className="text-2xl font-bold mb-2 leading-tight" style={{ color: 'var(--text-primary)' }}>
            {question.title}
          </h1>
          <div className="flex flex-wrap gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>Asked <strong>{timeAgo(question.created_at)}</strong></span>
            <span>Modified <strong>{timeAgo(question.updated_at)}</strong></span>
            <span>Viewed <strong>{question.view_count.toLocaleString()} times</strong></span>
          </div>
        </div>

        {/* Question body */}
        <div className="flex gap-4">
          <VoteControl
            score={question.vote_score}
            userVote={question.user_vote}
            onVote={handleVote}
            isBookmarked={question.is_bookmarked}
            onBookmark={handleBookmark}
          />
          <div className="flex-1 min-w-0">
            {question.is_closed && (
              <div className="alert alert-warning mb-4">
                🔒 This question is closed. {question.close_reason && `Reason: ${question.close_reason}`}
              </div>
            )}
            <MarkdownRenderer content={question.body} />

            <div className="flex flex-wrap gap-2 mt-4">
              {question.tags?.map((tag) => <TagPill key={tag.id ?? tag.name} name={tag.name} />)}
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-4 justify-between">
              <div className="flex gap-3">
                {canEdit && (
                  <Link to={`/questions/${id}/edit`} className="text-xs" style={{ color: 'var(--text-muted)' }}>Edit</Link>
                )}
                {canEdit && (
                  <button onClick={handleDeleteQuestion} className="text-xs" style={{ color: 'var(--danger)' }}>Delete</button>
                )}
              </div>
              <UserChip user={question.author} date={question.created_at} action="asked" />
            </div>

            {/* Question comments */}
            <div className="mt-3">
              {question.comments?.filter(c => !c.is_deleted).map((c) => (
                <Comment key={c.id} comment={c}
                  canDelete={user?.id === c.author_id || user?.is_admin}
                  onDelete={() => handleDeleteComment(c.id)} />
              ))}
              {isAuthenticated && <CommentForm onSubmit={handleAddComment} />}
            </div>
          </div>
        </div>

        {/* Answers */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            {question.answer_count} Answer{question.answer_count !== 1 ? 's' : ''}
          </h2>
          {question.answers?.filter(a => !a.is_deleted).map((a) => (
            <AnswerBlock key={a.id} answer={a} questionAuthorId={question.author?.id} onUpdate={fetchQuestion} />
          ))}
        </div>

        {/* Your Answer form */}
        {isAuthenticated ? (
          <div className="mt-10 border-t pt-8" style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Your Answer</h2>
            {question.is_closed && (
              <div className="alert alert-warning mb-4">This question is closed. Answers cannot be added.</div>
            )}
            {!question.is_closed && (
              <form onSubmit={handleSubmitAnswer} className="space-y-4">
                {answerError && <div className="alert alert-error">{answerError}</div>}
                <MarkdownEditor value={answerBody} onChange={setAnswerBody} placeholder="Write your answer here…" minRows={10} />
                <button type="submit" disabled={submittingAnswer} className="btn-primary">
                  {submittingAnswer ? 'Posting…' : 'Post Your Answer'}
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="mt-8 card p-6 text-center">
            <p style={{ color: 'var(--text-secondary)' }}>
              <Link to="/login" style={{ color: 'var(--link)' }}>Log in</Link> or{' '}
              <Link to="/register" style={{ color: 'var(--link)' }}>sign up</Link> to answer this question.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
