import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../context/authStore';

export default function OAuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithTokens } = useAuthStore();

  useEffect(() => {
    const access = params.get('access_token');
    const refresh = params.get('refresh_token');
    const error = params.get('error');

    if (error) {
      navigate(`/login?error=${error}`);
      return;
    }

    if (access && refresh) {
      loginWithTokens(access, refresh)
        .then(() => navigate('/'))
        .catch(() => navigate('/login?error=oauth_failed'));
    } else {
      navigate('/login?error=missing_tokens');
    }
  }, [params, navigate, loginWithTokens]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--brand)', borderTopColor: 'transparent' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Signing you in…</p>
      </div>
    </div>
  );
}
