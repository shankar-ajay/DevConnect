import React from 'react';
import { Link } from 'react-router-dom';
import { timeAgo, avatarUrl, shortNumber } from '../../utils/helpers';

// ── Spinner ───────────────────────────────────────────────────────────────

export function Spinner({ size = 'md' }) {
  const s = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-10 h-10' : 'w-7 h-7';
  return (
    <div className={`${s} border-2 border-t-transparent rounded-full animate-spin`}
      style={{ borderColor: 'var(--brand)', borderTopColor: 'transparent' }} />
  );
}

export function LoadingCenter() {
  return (
    <div className="flex justify-center py-16">
      <Spinner size="lg" />
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────

export function Pagination({ page, pages, onPage }) {
  if (pages <= 1) return null;
  const nums = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || (i >= page - 2 && i <= page + 2)) nums.push(i);
    else if (nums[nums.length - 1] !== '…') nums.push('…');
  }
  return (
    <div className="flex items-center gap-1 mt-6 flex-wrap">
      <button onClick={() => onPage(page - 1)} disabled={page === 1}
        className="btn btn-secondary px-2 py-1 text-xs" disabled={page === 1}>← Prev</button>
      {nums.map((n, i) =>
        n === '…' ? (
          <span key={`e${i}`} className="px-2 text-sm" style={{ color: 'var(--text-muted)' }}>…</span>
        ) : (
          <button key={n} onClick={() => onPage(n)}
            className={`btn px-3 py-1 text-xs ${page === n ? 'btn-primary' : 'btn-secondary'}`}>
            {n}
          </button>
        )
      )}
      <button onClick={() => onPage(page + 1)} disabled={page === pages}
        className="btn btn-secondary px-2 py-1 text-xs">Next →</button>
    </div>
  );
}

// ── TagPill ───────────────────────────────────────────────────────────────

export function TagPill({ name, onClick }) {
  if (onClick) {
    return <button onClick={onClick} className="tag-pill">{name}</button>;
  }
  return <Link to={`/questions?tag=${name}`} className="tag-pill">{name}</Link>;
}

// ── UserChip ──────────────────────────────────────────────────────────────

export function UserChip({ user, date, action = 'asked' }) {
  if (!user) return null;
  return (
    <div className="user-chip">
      <img src={avatarUrl(user)} alt={user.display_name} className="w-6 h-6 rounded object-cover" />
      <div>
        <div className="flex items-center gap-1">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{action}</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{timeAgo(date)}</span>
        </div>
        <Link to={`/users/${user.username}`} className="text-xs font-medium" style={{ color: 'var(--link)' }}>
          {user.display_name}
        </Link>
        <span className="text-xs ml-1 font-semibold" style={{ color: '#d1a616' }}>
          {shortNumber(user.reputation)}
        </span>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────

export function EmptyState({ title, description, action }) {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">🔍</div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{description}</p>
      {action}
    </div>
  );
}

// ── Error banner ──────────────────────────────────────────────────────────

export function ErrorBanner({ message }) {
  return (
    <div className="alert alert-error">
      <span>⚠</span>
      <p>{message}</p>
    </div>
  );
}

// ── Skeleton question item ────────────────────────────────────────────────

export function QuestionSkeleton() {
  return (
    <div className="flex gap-4 p-4 border-b" style={{ borderColor: 'var(--border)' }}>
      <div className="flex flex-col gap-2 items-end w-20 flex-shrink-0">
        <div className="skeleton h-4 w-12" />
        <div className="skeleton h-4 w-10" />
        <div className="skeleton h-4 w-10" />
      </div>
      <div className="flex-1 space-y-2">
        <div className="skeleton h-5 w-3/4" />
        <div className="skeleton h-4 w-full" />
        <div className="flex gap-2 mt-2">
          <div className="skeleton h-5 w-16 rounded-full" />
          <div className="skeleton h-5 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ── Stats badge ───────────────────────────────────────────────────────────

export function StatBadge({ value, label, color }) {
  return (
    <div className="flex flex-col items-center justify-center p-3 rounded text-center"
      style={{ border: `1px solid ${color}`, minWidth: 60 }}>
      <span className="text-lg font-bold" style={{ color }}>{value}</span>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}
