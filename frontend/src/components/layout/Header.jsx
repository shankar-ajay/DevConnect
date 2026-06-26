import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import useAuthStore from '../../context/authStore';
import { avatarUrl } from '../../utils/helpers';

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
    </svg>
  );
}

function SearchBar() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/questions?search=${encodeURIComponent(query.trim())}`);
  };
  return (
    <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-4">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search questions…"
          className="form-input pl-9 pr-4"
          style={{ borderRadius: '3px' }}
        />
      </div>
    </form>
  );
}

function UserDropdown({ user, logout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 p-1 rounded hover:opacity-80 transition">
        <img src={avatarUrl(user)} alt={user.display_name} className="w-7 h-7 rounded-full object-cover" />
        <span className="text-sm font-medium hidden md:block" style={{ color: 'var(--text-primary)' }}>
          {user.display_name}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 card z-50 py-1" style={{ borderRadius: '4px' }}>
          <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{user.display_name}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>@{user.username}</p>
          </div>
          {[
            { label: 'Profile', path: `/users/${user.username}` },
            { label: 'My Questions', path: `/users/${user.username}` },
            { label: 'Bookmarks', path: '/bookmarks' },
            { label: 'Settings', path: '/settings' },
          ].map(({ label, path }) => (
            <button
              key={label}
              onClick={() => { navigate(path); setOpen(false); }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              style={{ color: 'var(--text-primary)' }}
            >
              {label}
            </button>
          ))}
          <div className="border-t my-1" style={{ borderColor: 'var(--border)' }} />
          <button
            onClick={() => { logout(); setOpen(false); }}
            className="w-full text-left px-4 py-2 text-sm transition-colors"
            style={{ color: 'var(--danger)' }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-40 border-b" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded flex items-center justify-center font-bold text-white text-sm" style={{ background: 'var(--brand)' }}>
            SO
          </div>
          <span className="text-base font-bold hidden sm:block" style={{ color: 'var(--text-primary)' }}>
            Dev<span style={{ color: 'var(--brand)' }}>Connect</span>
          </span>
        </Link>

        {/* Search */}
        <SearchBar />

        {/* Right controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="btn-ghost p-2 rounded"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>

          {isAuthenticated ? (
            <>
              <Link to="/questions/ask" className="btn-primary text-xs px-3 py-1.5 hidden sm:flex">
                Ask Question
              </Link>
              <UserDropdown user={user} logout={logout} />
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary text-xs">Log in</Link>
              <Link to="/register" className="btn-primary text-xs">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
