import React, { useState } from 'react';
import useAuthStore from '../../context/authStore';

function UpArrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function DownArrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function BookmarkIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
    </svg>
  );
}

export default function VoteControl({
  score,
  userVote,
  onVote,
  isBookmarked,
  onBookmark,
  isAccepted,
  canAccept,
  onAccept,
  isAnswer = false,
}) {
  const { isAuthenticated } = useAuthStore();
  const [optimisticScore, setOptimisticScore] = useState(score);
  const [optimisticVote, setOptimisticVote] = useState(userVote);
  const [optimisticBookmark, setOptimisticBookmark] = useState(isBookmarked);

  const handleVote = async (value) => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    // Optimistic update
    const newVote = optimisticVote === value ? null : value;
    const delta = newVote === null ? -value : value - (optimisticVote || 0);
    setOptimisticScore(optimisticScore + delta);
    setOptimisticVote(newVote);
    try {
      await onVote(value);
    } catch {
      // Revert
      setOptimisticScore(score);
      setOptimisticVote(userVote);
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) { window.location.href = '/login'; return; }
    setOptimisticBookmark((b) => !b);
    try { await onBookmark?.(); }
    catch { setOptimisticBookmark(isBookmarked); }
  };

  return (
    <div className="flex flex-col items-center gap-1 w-10">
      {/* Up vote */}
      <button
        onClick={() => handleVote(1)}
        className={`vote-btn ${optimisticVote === 1 ? 'active-up' : ''}`}
        title="This question is useful"
      >
        <UpArrow />
      </button>

      {/* Score */}
      <span
        className="text-lg font-bold tabular-nums"
        style={{ color: isAccepted ? 'var(--accepted)' : 'var(--text-primary)' }}
      >
        {optimisticScore}
      </span>

      {/* Down vote */}
      <button
        onClick={() => handleVote(-1)}
        className={`vote-btn ${optimisticVote === -1 ? 'active-down' : ''}`}
        title="This question is not useful"
      >
        <DownArrow />
      </button>

      {/* Bookmark (questions only) */}
      {onBookmark && (
        <button
          onClick={handleBookmark}
          className="vote-btn mt-1"
          style={{ color: optimisticBookmark ? 'var(--brand)' : 'var(--text-muted)' }}
          title={optimisticBookmark ? 'Remove bookmark' : 'Bookmark this question'}
        >
          <BookmarkIcon filled={optimisticBookmark} />
        </button>
      )}

      {/* Accept (answers only) */}
      {isAnswer && (
        <button
          onClick={onAccept}
          disabled={!canAccept}
          className="vote-btn mt-1"
          style={{
            color: isAccepted ? 'var(--accepted)' : canAccept ? 'var(--text-muted)' : 'var(--border)',
            cursor: canAccept ? 'pointer' : 'default',
          }}
          title={canAccept ? (isAccepted ? 'Unaccept this answer' : 'Accept this answer') : 'Only the question author can accept answers'}
        >
          <svg viewBox="0 0 24 24" fill={isAccepted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
