import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { tagsAPI } from '../api/client';
import { LoadingCenter, EmptyState, ErrorBanner } from '../components/common/UI';
import { useDebounce } from '../hooks/useAsync';

export default function TagsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQ = searchParams.get('search') || '';
  const sortQ   = searchParams.get('sort') || 'popular';

  const [tags, setTags]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [search, setSearch] = useState(searchQ);
  const debouncedSearch = useDebounce(search, 350);

  useEffect(() => {
    const p = new URLSearchParams();
    if (debouncedSearch) p.set('search', debouncedSearch);
    if (sortQ !== 'popular') p.set('sort', sortQ);
    setSearchParams(p, { replace: true });
  }, [debouncedSearch, sortQ, setSearchParams]);

  useEffect(() => {
    setLoading(true);
    const params = { per_page: 36, sort: sortQ };
    if (debouncedSearch) params.search = debouncedSearch;
    tagsAPI.list(params)
      .then((r) => { setTags(r.data); setError(null); })
      .catch(() => setError('Failed to load tags'))
      .finally(() => setLoading(false));
  }, [debouncedSearch, sortQ]);

  const updateSort = (s) => {
    const p = new URLSearchParams(searchParams);
    p.set('sort', s);
    setSearchParams(p);
  };

  return (
    <Layout>
      <div className="max-w-5xl">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Tags</h1>
        <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
          A tag is a keyword or label that categorizes your question with other similar questions.
        </p>

        <div className="flex flex-wrap gap-3 mb-5">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by tag name…" className="form-input max-w-xs" />
          <div className="flex rounded border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            {['popular', 'name', 'newest'].map((s) => (
              <button key={s} onClick={() => updateSort(s)}
                className="px-3 py-1.5 text-xs capitalize transition-colors"
                style={{
                  background: sortQ === s ? 'var(--brand)' : 'var(--bg-primary)',
                  color: sortQ === s ? 'white' : 'var(--text-secondary)',
                  borderRight: '1px solid var(--border)',
                }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && <ErrorBanner message={error} />}
        {loading ? (
          <LoadingCenter />
        ) : tags.length === 0 ? (
          <EmptyState title="No tags found" description="Try a different search term" />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {tags.map((tag) => (
              <div key={tag.id} className="card p-4 flex flex-col gap-2 hover:shadow-md transition-shadow">
                <Link to={`/questions?tag=${tag.name}`} className="tag-pill self-start text-sm px-2 py-1">
                  {tag.name}
                </Link>
                {tag.excerpt && (
                  <p className="text-xs line-clamp-3" style={{ color: 'var(--text-secondary)' }}>{tag.excerpt}</p>
                )}
                <p className="text-xs mt-auto" style={{ color: 'var(--text-muted)' }}>
                  {tag.question_count.toLocaleString()} question{tag.question_count !== 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
