import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { questionsAPI } from '../api/client';
import Layout from '../components/layout/Layout';
import QuestionCard from '../components/questions/QuestionCard';
import { Pagination, LoadingCenter, ErrorBanner, EmptyState, QuestionSkeleton } from '../components/common/UI';
import { useDebounce } from '../hooks/useAsync';
import useAuthStore from '../context/authStore';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'votes', label: 'Most Votes' },
  { value: 'activity', label: 'Active' },
  { value: 'unanswered', label: 'Unanswered' },
];

function RightSidebar() {
  return (
    <div>
      <div className="sidebar-section">
        <h3 className="sidebar-title">The Overflow Blog</h3>
        {['AI is changing how we write code', 'Best practices for async Python', 'Database indexing explained'].map((t) => (
          <p key={t} className="text-xs mb-2 py-1 border-b last:border-0" style={{ color: 'var(--link)', borderColor: 'var(--border-light)' }}>
            📝 {t}
          </p>
        ))}
      </div>
      <div className="sidebar-section">
        <h3 className="sidebar-title">Hot Network Questions</h3>
        {['Why is Python slow?', 'React vs Vue in 2025', 'SQL JOIN explained', 'What is a closure?'].map((t) => (
          <p key={t} className="text-xs mb-2 py-1 border-b last:border-0" style={{ color: 'var(--link)', borderColor: 'var(--border-light)' }}>
            {t}
          </p>
        ))}
      </div>
    </div>
  );
}

export default function QuestionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuthStore();

  const searchQ    = searchParams.get('search') || '';
  const tagQ       = searchParams.get('tag') || '';
  const sortQ      = searchParams.get('sort') || 'newest';
  const pageQ      = parseInt(searchParams.get('page') || '1', 10);

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [search, setSearch]   = useState(searchQ);
  const debouncedSearch       = useDebounce(search, 400);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: pageQ, per_page: 15, sort: sortQ };
      if (debouncedSearch) params.search = debouncedSearch;
      if (tagQ) params.tag = tagQ;
      const res = await questionsAPI.list(params);
      setData(res.data);
    } catch (e) {
      setError('Failed to load questions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [pageQ, sortQ, debouncedSearch, tagQ]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  useEffect(() => {
    const p = new URLSearchParams();
    if (debouncedSearch) p.set('search', debouncedSearch);
    if (tagQ) p.set('tag', tagQ);
    if (sortQ !== 'newest') p.set('sort', sortQ);
    p.set('page', '1');
    setSearchParams(p, { replace: true });

  }, [debouncedSearch, sortQ, tagQ]);

  const updateParam = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    p.set('page', '1');
    setSearchParams(p);
  };

  const goToPage = (p) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(p));
    setSearchParams(params);
  };

  return (
    <Layout rightSidebar={<RightSidebar />}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {tagQ ? `Questions tagged [${tagQ}]` : search ? `Search: "${search}"` : 'All Questions'}
          </h1>
          {data && (
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {data.total.toLocaleString()} question{data.total !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {isAuthenticated && (
          <Link to="/questions/ask" className="btn-primary">Ask Question</Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter questions…"
          className="form-input max-w-xs"
        />
        <div className="flex rounded border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateParam('sort', opt.value)}
              className="px-3 py-1.5 text-xs transition-colors"
              style={{
                background: sortQ === opt.value ? 'var(--brand)' : 'var(--bg-primary)',
                color: sortQ === opt.value ? 'white' : 'var(--text-secondary)',
                borderRight: '1px solid var(--border)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {tagQ && (
          <button onClick={() => updateParam('tag', '')}
            className="tag-pill flex items-center gap-1">
            {tagQ} <span>×</span>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="card">
        {error && <ErrorBanner message={error} />}
        {loading ? (
          <div>{[...Array(5)].map((_, i) => <QuestionSkeleton key={i} />)}</div>
        ) : data?.items?.length === 0 ? (
          <EmptyState
            title="No questions found"
            description={search ? 'Try different search terms' : 'Be the first to ask a question!'}
            action={isAuthenticated && <Link to="/questions/ask" className="btn-primary">Ask a Question</Link>}
          />
        ) : (
          <>
            {data?.items?.map((q) => <QuestionCard key={q.id} question={q} />)}
            <div className="px-4 pb-4">
              <Pagination page={pageQ} pages={data?.pages || 1} onPage={goToPage} />
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
