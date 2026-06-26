import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { usersAPI, questionsAPI } from '../api/client';
import { LoadingCenter, ErrorBanner, EmptyState, Pagination, TagPill } from '../components/common/UI';
import { avatarUrl, formatDate, shortNumber, extractErrorMessage } from '../utils/helpers';
import useAuthStore from '../context/authStore';
import MarkdownEditor from '../components/common/MarkdownEditor';

// ── User Card ─────────────────────────────────────────────────────────────

function UserCard({ user }) {
  return (
    <Link to={`/users/${user.username}`}
      className="card p-4 flex items-start gap-3 hover:shadow-md transition-shadow">
      <img src={avatarUrl(user)} alt={user.display_name}
        className="w-12 h-12 rounded object-cover flex-shrink-0" />
      <div className="min-w-0">
        <p className="font-semibold text-sm truncate" style={{ color: 'var(--link)' }}>{user.display_name}</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>@{user.username}</p>
        <p className="text-xs mt-1 font-medium" style={{ color: '#d1a616' }}>
          ⭐ {shortNumber(user.reputation)} reputation
        </p>
        {user.location && (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>📍 {user.location}</p>
        )}
      </div>
    </Link>
  );
}

// ── Users List Page ───────────────────────────────────────────────────────

export function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('reputation');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    usersAPI.list({ page, per_page: 24, search, sort })
      .then((r) => {
        // API returns array; wrap in pagination manually
        setUsers(Array.isArray(r.data) ? r.data : r.data.items || []);
        setTotal(Array.isArray(r.data) ? r.data.length : r.data.total || r.data.length);
        setError(null);
      })
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false));
  }, [page, search, sort]);

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Users</h1>
      <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
        {total.toLocaleString()} registered developers
      </p>

      <div className="flex flex-wrap gap-3 mb-5">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Filter by name…" className="form-input max-w-xs" />
        <div className="flex rounded border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          {['reputation', 'newest', 'name'].map((s) => (
            <button key={s} onClick={() => setSort(s)}
              className="px-3 py-1.5 text-xs capitalize transition-colors"
              style={{ background: sort === s ? 'var(--brand)' : 'var(--bg-primary)', color: sort === s ? 'white' : 'var(--text-secondary)', borderRight: '1px solid var(--border)' }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorBanner message={error} />}
      {loading ? <LoadingCenter /> : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {users.map((u) => <UserCard key={u.id} user={u} />)}
          </div>
          {users.length === 0 && <EmptyState title="No users found" description="Try a different name" />}
        </>
      )}
    </Layout>
  );
}

// ── User Profile Page ─────────────────────────────────────────────────────

export function UserProfilePage() {
  const { username } = useParams();
  const { user: currentUser, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const isOwn = currentUser?.username === username;

  useEffect(() => {
    setLoading(true);
    usersAPI.profile(username)
      .then((r) => { setProfile(r.data); setEditForm({ display_name: r.data.display_name, bio: r.data.bio || '', location: r.data.location || '', website: r.data.website || '' }); })
      .catch(() => setError('User not found'))
      .finally(() => setLoading(false));
  }, [username]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await usersAPI.updateMe(editForm);
      setProfile((p) => ({ ...p, ...data }));
      updateUser(data);
      setEditing(false);
    } catch (e) { alert(extractErrorMessage(e)); }
    setSaving(false);
  };

  if (loading) return <Layout><LoadingCenter /></Layout>;
  if (error) return <Layout><ErrorBanner message={error} /></Layout>;

  return (
    <Layout>
      <div className="max-w-4xl">
        {/* Profile header */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-5">
            <img src={avatarUrl(profile)} alt={profile.display_name}
              className="w-24 h-24 rounded-full object-cover flex-shrink-0" />
            <div className="flex-1">
              {editing ? (
                <div className="space-y-3">
                  <div>
                    <label className="form-label text-xs">Display Name</label>
                    <input className="form-input" value={editForm.display_name}
                      onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label text-xs">Location</label>
                    <input className="form-input" value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} placeholder="City, Country" />
                  </div>
                  <div>
                    <label className="form-label text-xs">Website</label>
                    <input className="form-input" value={editForm.website}
                      onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} placeholder="https://..." />
                  </div>
                  <div>
                    <label className="form-label text-xs">About Me</label>
                    <textarea className="form-input resize-none" rows={3} value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSave} disabled={saving} className="btn-primary text-xs">{saving ? 'Saving…' : 'Save profile'}</button>
                    <button onClick={() => setEditing(false)} className="btn-ghost text-xs">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{profile.display_name}</h1>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>@{profile.username}</p>
                    </div>
                    {isOwn && (
                      <button onClick={() => setEditing(true)} className="btn-secondary text-xs">Edit profile</button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {profile.location && <span>📍 {profile.location}</span>}
                    {profile.website && <a href={profile.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--link)' }}>🔗 {profile.website}</a>}
                    <span>📅 Member since {formatDate(profile.created_at)}</span>
                  </div>
                  {profile.bio && <p className="mt-3 text-sm" style={{ color: 'var(--text-primary)' }}>{profile.bio}</p>}
                </>
              )}
            </div>
          </div>

          {/* Reputation badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t" style={{ borderColor: 'var(--border)' }}>
            {[
              { label: 'Reputation', value: shortNumber(profile.reputation), color: '#d1a616' },
              { label: '🥇 Gold', value: profile.gold_badges, color: '#f5b400' },
              { label: '🥈 Silver', value: profile.silver_badges, color: '#9e9e9e' },
              { label: '🥉 Bronze', value: profile.bronze_badges, color: '#cd7f32' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center p-3 rounded" style={{ background: 'var(--bg-tertiary)' }}>
                <p className="text-xl font-bold" style={{ color }}>{value}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
