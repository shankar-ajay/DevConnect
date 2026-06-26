import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../context/authStore';
import { LoadingCenter } from './common/UI';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) return <LoadingCenter />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

export function GuestRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <LoadingCenter />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}
