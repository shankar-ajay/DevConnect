import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import useAuthStore from './context/authStore';
import { ProtectedRoute, GuestRoute } from './components/ProtectedRoute';

// Pages
import HomePage            from './pages/HomePage';
import QuestionsPage       from './pages/QuestionsPage';
import QuestionDetailPage  from './pages/QuestionDetailPage';
import AskQuestionPage     from './pages/AskQuestionPage';
import EditQuestionPage    from './pages/EditQuestionPage';
import TagsPage            from './pages/TagsPage';
import { UsersPage, UserProfilePage } from './pages/UsersPage';
import BookmarksPage       from './pages/BookmarksPage';
import SettingsPage        from './pages/SettingsPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import OAuthCallbackPage   from './pages/OAuthCallbackPage';
import NotFoundPage        from './pages/NotFoundPage';

import './styles/globals.css';

function AppRoutes() {
  const { fetchMe } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <Routes>
      {/* Public */}
      <Route path="/"                  element={<HomePage />} />
      <Route path="/questions"         element={<QuestionsPage />} />
      <Route path="/questions/:id"     element={<QuestionDetailPage />} />
      <Route path="/tags"              element={<TagsPage />} />
      <Route path="/users"             element={<UsersPage />} />
      <Route path="/users/:username"   element={<UserProfilePage />} />
      <Route path="/auth/callback"     element={<OAuthCallbackPage />} />

      {/* Guest-only */}
      <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

      {/* Protected */}
      <Route path="/questions/ask"     element={<ProtectedRoute><AskQuestionPage /></ProtectedRoute>} />
      <Route path="/questions/:id/edit" element={<ProtectedRoute><EditQuestionPage /></ProtectedRoute>} />
      <Route path="/bookmarks"         element={<ProtectedRoute><BookmarksPage /></ProtectedRoute>} />
      <Route path="/settings"          element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
}
