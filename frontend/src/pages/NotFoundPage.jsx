import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
      style={{ background: 'var(--bg-secondary)' }}>
      <div className="text-8xl font-black mb-4" style={{ color: 'var(--border)' }}>404</div>
      <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        Page not found
      </h1>
      <p className="text-sm mb-8 max-w-sm" style={{ color: 'var(--text-secondary)' }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Link to="/" className="btn-primary">Go Home</Link>
        <Link to="/questions" className="btn-secondary">Browse Questions</Link>
      </div>
    </div>
  );
}
