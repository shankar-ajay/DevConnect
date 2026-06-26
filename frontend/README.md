# DevConnect – Frontend

React 18 + Tailwind CSS frontend for the DevConnect Q&A platform.

## Tech Stack
- **Framework**: React 18 with React Router v6
- **Styling**: Tailwind CSS 3 + CSS custom properties (full dark/light theme)
- **State**: Zustand (auth store) + React local state
- **HTTP client**: Axios with auto token-refresh interceptor
- **Markdown**: react-markdown + remark-gfm + Prism syntax highlighting
- **Fonts**: Inter (UI) + JetBrains Mono (code)

## Quick Start

### 1. Prerequisites
- Node.js 18+
- Backend running on http://localhost:8000

### 2. Install
```bash
cd frontend
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit REACT_APP_API_URL if your backend port differs
```

### 4. Start dev server
```bash
npm start
# Opens http://localhost:3000
```

### 5. Build for production
```bash
npm run build
# Output in /build – serve with any static host
```

---

## Features

| Feature                  | Description                                               |
|--------------------------|-----------------------------------------------------------|
| 🌙 Dark / Light theme    | Persisted to localStorage, respects system preference     |
| 🔐 Auth                  | Email/password + Google OAuth + GitHub OAuth              |
| 🔄 Token refresh         | Axios interceptor silently refreshes expired tokens       |
| ❓ Questions              | List, search, filter by tag/sort, paginate                |
| ✏️ Ask / Edit            | Markdown editor with toolbar + live preview               |
| 📋 Answers               | Post, edit, vote, accept answers                          |
| 💬 Comments              | Thread comments on questions and answers                  |
| 🔖 Bookmarks             | Save/unsave questions, view bookmarked list               |
| 🏷️ Tags                  | Browse, search, filter questions by tag                   |
| 👥 Users                 | Directory, public profiles, reputation display            |
| ⚙️ Settings              | Edit profile, change password, view linked OAuth          |
| 📱 Responsive            | Works on mobile, tablet, and desktop                      |

---

## Project Structure

```
frontend/src/
├── api/
│   └── client.js          # Axios instance + all API helpers (authAPI, questionsAPI, …)
├── components/
│   ├── layout/
│   │   ├── Header.jsx     # Top nav with search, theme toggle, user menu
│   │   ├── Sidebar.jsx    # Left nav links
│   │   └── Layout.jsx     # Wrapper: Header + Sidebar + main + optional right sidebar
│   ├── common/
│   │   ├── UI.jsx         # Spinner, Pagination, TagPill, UserChip, EmptyState, Skeleton
│   │   ├── VoteControl.jsx       # Upvote/downvote/bookmark/accept widget
│   │   ├── MarkdownRenderer.jsx  # Safe Markdown with syntax highlighting
│   │   └── MarkdownEditor.jsx    # Textarea with toolbar + preview toggle
│   ├── questions/
│   │   └── QuestionCard.jsx      # List-view question row
│   └── ProtectedRoute.jsx        # ProtectedRoute + GuestRoute wrappers
├── context/
│   ├── authStore.js       # Zustand auth store (login, register, OAuth, logout)
│   └── ThemeContext.jsx   # Dark/light theme context + toggle
├── hooks/
│   └── useAsync.js        # useAsync, useDebounce, usePagination, useLocalStorage
├── pages/
│   ├── HomePage.jsx           # Hero banner + recent questions + popular tags
│   ├── QuestionsPage.jsx      # Full question list with filters/search/sort
│   ├── QuestionDetailPage.jsx # Question + answers + comments + answer form
│   ├── AskQuestionPage.jsx    # Multi-step ask form with tag input
│   ├── EditQuestionPage.jsx   # Edit title/body/tags
│   ├── AuthPages.jsx          # LoginPage + RegisterPage with OAuth buttons
│   ├── OAuthCallbackPage.jsx  # Handles token from OAuth redirect
│   ├── TagsPage.jsx           # Tag browser with search/sort
│   ├── UsersPage.jsx          # UsersPage (list) + UserProfilePage (detail)
│   ├── BookmarksPage.jsx      # Saved questions list
│   ├── SettingsPage.jsx       # Profile edit + password change
│   └── NotFoundPage.jsx       # 404
├── styles/
│   └── globals.css        # Tailwind imports + CSS vars + component classes
├── utils/
│   └── helpers.js         # timeAgo, formatDate, shortNumber, avatarUrl, extractErrorMessage
├── App.jsx                # BrowserRouter + all routes
└── index.js               # React 18 root render
```

---

## Theme System

All colours are CSS custom properties, toggled by adding/removing the `.dark` class on `<html>`:

```css
:root {
  --bg-primary: #ffffff;
  --text-primary: #242729;
  --brand: #f97316;
  /* … */
}
.dark {
  --bg-primary: #1b1b1b;
  --text-primary: #e7e8eb;
  --brand: #fb923c;
  /* … */
}
```

Every component uses `var(--*)` — add a new theme by defining a new CSS class.
