import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { usersAPI } from '../api/client';
import useAuthStore from '../context/authStore';
import { extractErrorMessage, avatarUrl } from '../utils/helpers';

function Section({ title, description, children }) {
  return (
    <div className="card p-6 mb-5">
      <h2 className="text-base font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      {description && <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{description}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuthStore();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    display_name: user?.display_name || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
  });
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm: '' });
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdErr, setPwdErr] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(''); setProfileErr('');
    try {
      const { data } = await usersAPI.updateMe(profile);
      updateUser(data);
      setProfileMsg('Profile updated successfully!');
    } catch (err) {
      setProfileErr(extractErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm) {
      setPwdErr('New passwords do not match'); return;
    }
    if (passwords.new_password.length < 8) {
      setPwdErr('New password must be at least 8 characters'); return;
    }
    setSavingPwd(true); setPwdMsg(''); setPwdErr('');
    try {
      await usersAPI.changePassword({ current_password: passwords.current_password, new_password: passwords.new_password });
      setPwdMsg('Password changed successfully!');
      setPasswords({ current_password: '', new_password: '', confirm: '' });
    } catch (err) {
      setPwdErr(extractErrorMessage(err));
    } finally {
      setSavingPwd(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Layout>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Account Settings</h1>

        {/* Profile section */}
        <Section title="Public Profile" description="This information will be shown publicly on your profile page.">
          <div className="flex items-center gap-4 mb-5">
            <img src={avatarUrl(user)} alt={user?.display_name}
              className="w-16 h-16 rounded-full object-cover" />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Profile picture</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Connect via Google/GitHub to set a profile picture automatically, or use{' '}
                <a href="https://gravatar.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--link)' }}>Gravatar</a>.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            {profileMsg && <div className="alert alert-success">{profileMsg}</div>}
            {profileErr && <div className="alert alert-error">{profileErr}</div>}
            <div>
              <label className="form-label">Display Name</label>
              <input className="form-input" value={profile.display_name}
                onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Location</label>
                <input className="form-input" placeholder="City, Country" value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Website</label>
                <input className="form-input" placeholder="https://..." value={profile.website}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="form-label">About Me</label>
              <textarea className="form-input resize-none" rows={4} placeholder="Tell the community a bit about yourself…"
                value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
            </div>
            <button type="submit" disabled={savingProfile} className="btn-primary">
              {savingProfile ? 'Saving…' : 'Save Profile'}
            </button>
          </form>
        </Section>

        {/* Password section */}
        {user?.hashed_password !== undefined && (
          <Section title="Change Password" description="Use a strong password you don't use elsewhere.">
            <form onSubmit={handleChangePassword} className="space-y-4">
              {pwdMsg && <div className="alert alert-success">{pwdMsg}</div>}
              {pwdErr && <div className="alert alert-error">{pwdErr}</div>}
              <div>
                <label className="form-label">Current Password</label>
                <input type="password" className="form-input" value={passwords.current_password}
                  onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })} />
              </div>
              <div>
                <label className="form-label">New Password</label>
                <input type="password" className="form-input" placeholder="Min. 8 characters"
                  value={passwords.new_password}
                  onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Confirm New Password</label>
                <input type="password" className="form-input" value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} />
              </div>
              <button type="submit" disabled={savingPwd} className="btn-primary">
                {savingPwd ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          </Section>
        )}

        {/* Account info */}
        <Section title="Account Information">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Email</span>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{user?.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Username</span>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>@{user?.username}</span>
            </div>
            <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Reputation</span>
              <span className="font-semibold" style={{ color: '#d1a616' }}>{user?.reputation}</span>
            </div>
            <div className="flex justify-between py-2">
              <span style={{ color: 'var(--text-secondary)' }}>OAuth providers</span>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                {[user?.google_id && 'Google', user?.github_id && 'GitHub'].filter(Boolean).join(', ') || 'None linked'}
              </span>
            </div>
          </div>
        </Section>

        {/* Danger zone */}
        <Section title="Sign Out">
          <button onClick={handleLogout} className="btn-danger">Sign out of all sessions</button>
        </Section>
      </div>
    </Layout>
  );
}
