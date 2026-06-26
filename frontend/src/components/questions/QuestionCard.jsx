import React from 'react';
import { Link } from 'react-router-dom';
import { TagPill, UserChip } from '../common/UI';
import { shortNumber, timeAgo } from '../../utils/helpers';

export default function QuestionCard({ question }) {
  const hasAccepted = Boolean(question.accepted_answer_id);

  return (
    <div className="flex gap-4 px-4 py-5 border-b transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30"
      style={{ borderColor: 'var(--border)' }}>

      {/* Stats column */}
      <div className="flex flex-col items-end gap-1 w-24 flex-shrink-0 text-sm">
        <StatItem value={question.vote_score} label="votes" />
        <StatItem
          value={question.answer_count}
          label="answers"
          highlight={hasAccepted ? 'accepted' : question.answer_count > 0 ? 'answered' : null}
        />
        <StatItem value={question.view_count} label="views" muted />
      </div>

      {/* Content column */}
      <div className="flex-1 min-w-0">
        <h3 className="text-base mb-1 leading-snug">
          <Link
            to={`/questions/${question.id}`}
            style={{ color: 'var(--link)' }}
            className="hover:underline font-medium"
          >
            {question.title}
          </Link>
        </h3>

        {/* Body excerpt */}
        <p className="text-xs line-clamp-2 mb-2" style={{ color: 'var(--text-secondary)' }}>
          {question.body?.replace(/[#*`>[\]]/g, '').substring(0, 200)}
        </p>

        {/* Footer */}
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex flex-wrap gap-1">
            {question.tags?.map((tag) => (
              <TagPill key={tag.id ?? tag.name} name={tag.name} />
            ))}
          </div>
          <UserChip user={question.author} date={question.created_at} action="asked" />
        </div>
      </div>
    </div>
  );
}

function StatItem({ value, label, highlight, muted }) {
  let borderColor = 'transparent';
  let textColor = muted ? 'var(--text-muted)' : 'var(--text-secondary)';
  let bg = 'transparent';

  if (highlight === 'accepted') {
    borderColor = 'var(--accepted)';
    textColor = 'var(--accepted)';
    bg = '#e8f5e9';
  } else if (highlight === 'answered') {
    borderColor = 'var(--accepted)';
    textColor = 'var(--accepted)';
  }

  return (
    <div className="text-right">
      <span
        className="inline-block px-2 py-0.5 rounded text-sm font-semibold"
        style={{ background: bg, border: `1px solid ${borderColor}`, color: textColor }}
      >
        {shortNumber(value)}
      </span>
      <span className="block text-xs ml-1" style={{ color: 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}
