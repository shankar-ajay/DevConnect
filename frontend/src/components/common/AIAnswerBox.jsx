import React, { useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import { getAIAnswer } from '../../api/groq';

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

export default function AIAnswerBox({ questionTitle, questionBody }) {
  const [answer, setAnswer]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [shown, setShown]     = useState(false);
  const [copied, setCopied]   = useState(false);

  const handleAsk = async () => {
    setShown(true);
    setLoading(true);
    setError('');
    setAnswer('');
    try {
      const result = await getAIAnswer(questionTitle, questionBody);
      setAnswer(result);
    } catch (err) {
      setError(err.message || 'Failed to get AI answer. Check your Gemini API key.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    setAnswer('');
    handleAsk();
  };

  // Not yet triggered — show the Ask AI button only
  if (!shown) {
    return (
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={handleAsk}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white',
            border: 'none',
            boxShadow: '0 2px 8px rgba(99,102,241,0.35)',
          }}
        >
          <SparkleIcon />
          Ask AI for an answer
        </button>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Powered by Gemini · Instant, but verify before using
        </span>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-lg overflow-hidden border"
      style={{ borderColor: '#6366f1', background: 'var(--bg-primary)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
        <div className="flex items-center gap-2 text-white text-sm font-medium">
          <SparkleIcon />
          AI Answer · Gemini Flash
        </div>
        <div className="flex items-center gap-2">
          {!loading && answer && (
            <>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-white/80 hover:text-white text-xs transition-colors"
              >
                <CopyIcon />
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <span className="text-white/40">·</span>
              <button
                onClick={handleRegenerate}
                className="text-white/80 hover:text-white text-xs transition-colors"
              >
                Regenerate
              </button>
            </>
          )}
          <span className="text-white/40">·</span>
          <button
            onClick={() => setShown(false)}
            className="text-white/80 hover:text-white text-xs transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {loading && (
          <div className="flex items-center gap-3 py-4">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{
                    background: '#6366f1',
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Gemini is thinking…
            </span>
          </div>
        )}

        {error && (
          <div className="alert alert-error text-sm">{error}</div>
        )}

        {answer && !loading && (
          <>
            <MarkdownRenderer content={answer} />
            <div className="mt-4 pt-3 border-t flex items-center gap-2"
              style={{ borderColor: 'var(--border-light)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                AI answers can be wrong. Always verify code before using it in production.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
