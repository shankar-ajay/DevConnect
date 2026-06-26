import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import QuestionCard from '../components/questions/QuestionCard';
import { LoadingCenter, EmptyState } from '../components/common/UI';
import { questionsAPI, tagsAPI } from '../api/client';
import useAuthStore from '../context/authStore';

function HeroBanner({ isAuthenticated }) {
  return (
    <div className="card p-8 mb-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 dark:opacity-10"
        style={{ background: 'linear-gradient(135deg, var(--brand) 0%, transparent 60%)' }} />
      <div className="relative">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Welcome to Dev<span style={{ color: 'var(--brand)' }}>Connect</span>
        </h1>
        <p className="text-base mb-6 max-w-xl" style={{ color: 'var(--text-secondary)' }}>
          A community-driven Q&A platform for developers. Ask questions, share knowledge, and grow together.
        </p>
        {!isAuthenticated && (
          <div className="flex flex-wrap gap-3">
            <Link to="/register" className="btn-primary">Join the community</Link>
            <Link to="/questions" className="btn-secondary">Browse questions</Link>
          </div>
        )}
        {isAuthenticated && (
          <Link to="/questions/ask" className="btn-primary">Ask a Question</Link>
        )}
      </div>
    </div>
  );
}

function PopularTags({ tags }) {
  return (
    <div className="sidebar-section">
      <h3 className="sidebar-title">Popular Tags</h3>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Link key={tag.id} to={`/questions?tag=${tag.name}`} className="tag-pill">
            {tag.name}
            <span className="ml-1 text-xs opacity-60">×{tag.question_count}</span>
          </Link>
        ))}
      </div>
      <Link to="/tags" className="text-xs mt-3 block" style={{ color: 'var(--link)' }}>View all tags →</Link>
    </div>
  );
}

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const [questions, setQuestions] = useState([]);
  const [tags, setTags]         = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      questionsAPI.list({ page: 1, per_page: 10, sort: 'newest' }),
      tagsAPI.list({ per_page: 20, sort: 'popular' }),
    ]).then(([qRes, tRes]) => {
      setQuestions(qRes.data.items || []);
      setTags(Array.isArray(tRes.data) ? tRes.data : []);
    }).finally(() => setLoading(false));
  }, []);

  const sidebar = <PopularTags tags={tags} />;

  return (
    <Layout rightSidebar={sidebar}>
      <HeroBanner isAuthenticated={isAuthenticated} />

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Questions</h2>
        <Link to="/questions" className="text-sm" style={{ color: 'var(--link)' }}>View all →</Link>
      </div>

      <div className="card">
        {loading ? (
          <LoadingCenter />
        ) : questions.length === 0 ? (
          <EmptyState
            title="No questions yet"
            description="Be the first to ask!"
            action={isAuthenticated && <Link to="/questions/ask" className="btn-primary">Ask a Question</Link>}
          />
        ) : (
          questions.map((q) => <QuestionCard key={q.id} question={q} />)
        )}
      </div>
    </Layout>
  );
}
