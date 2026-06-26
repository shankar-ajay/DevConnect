import { formatDistanceToNow, format } from 'date-fns';

export const timeAgo = (date) =>
  formatDistanceToNow(new Date(date), { addSuffix: true });

export const formatDate = (date) =>
  format(new Date(date), 'MMM d, yyyy');

export const formatDateFull = (date) =>
  format(new Date(date), "MMM d, yyyy 'at' HH:mm");

export const shortNumber = (n) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
};

export const reputationColor = (rep) => {
  if (rep >= 10000) return 'text-yellow-600 dark:text-yellow-400';
  if (rep >= 1000)  return 'text-gray-500 dark:text-gray-400';
  return 'text-gray-500 dark:text-gray-400';
};

export const extractErrorMessage = (err) => {
  if (typeof err?.response?.data?.detail === 'string')
    return err.response.data.detail;
  if (Array.isArray(err?.response?.data?.detail))
    return err.response.data.detail.map((e) => e.msg).join(', ');
  return err?.message || 'An unexpected error occurred';
};

export const avatarUrl = (user) => {
  if (user?.avatar_url) return user.avatar_url;
  // Gravatar fallback
  const name = encodeURIComponent(user?.display_name || user?.username || '?');
  return `https://ui-avatars.com/api/?name=${name}&background=f97316&color=fff&size=64`;
};
