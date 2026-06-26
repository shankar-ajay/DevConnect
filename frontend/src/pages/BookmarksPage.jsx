import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import QuestionCard from '../components/questions/QuestionCard';
import { LoadingCenter, ErrorBanner, EmptyState, Pagination } from '../components/common/UI';
import { usersAPI } from '../api/client';

export default function BookmarksPage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [page, setPage]       = useState(1);

  useEffect(() => {
    setLoading(true);
    usersAPI.bookmarks({ page, per_page: 15 })
      .then((r) => { setData(r.data); setError(null); })
      .catch(() => setError('Failed to load bookmarks'))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <Layout>
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Bookmarks</h1>
            {data && (
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {data.total} saved question{data.total !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {error && <ErrorBanner message={error} />}

        <div className="card">
          {loading ? (
            <LoadingCenter />
          ) : data?.items?.length === 0 ? (
            <EmptyState
              title="No bookmarks yet"
              description="Save questions you want to revisit later by clicking the bookmark icon on any question."
              action={<Link to="/questions" className="btn-primary">Browse questions</Link>}
            />
          ) : (
            <>
              {data?.items?.map((q) => <QuestionCard key={q.id} question={q} />)}
              <div className="px-4 pb-4">
                <Pagination page={page} pages={data?.pages || 1} onPage={setPage} />
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
