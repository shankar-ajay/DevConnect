# DevConnect – Backend

FastAPI + SQLAlchemy (async) + MySQL backend for the DevConnect Q&A platform.

## Tech Stack
- **Framework**: FastAPI 0.115
- **ORM**: SQLAlchemy 2.0 (fully async)
- **Database**: MySQL 8 via aiomysql (PostgreSQL supported too — just swap the URL)
- **Auth**: JWT (access + refresh tokens) + Google OAuth + GitHub OAuth
- **Migrations**: Alembic
- **Password hashing**: bcrypt via passlib

## Quick Start

### 1. Prerequisites
- Python 3.11+
- MySQL 8.0+ running locally (or any cloud MySQL)

### 2. Create virtual environment
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure environment
```bash
cp .env.example .env
# Open .env and fill in your values (see table below)
```

### 4. Create MySQL database
```sql
CREATE DATABASE devconnect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'devuser'@'localhost' IDENTIFIED BY 'devpassword';
GRANT ALL PRIVILEGES ON devconnect.* TO 'devuser'@'localhost';
FLUSH PRIVILEGES;
```

Update `.env`:
```
DATABASE_URL=mysql+aiomysql://devuser:devpassword@localhost:3306/devconnect
```

### 5. Start the server
```bash
uvicorn app.main:app --reload --port 8000
```

Tables are created automatically on first run. API docs: http://localhost:8000/docs

---

## Switching Databases

Only change `DATABASE_URL` in `.env` — zero code changes:

| Database            | URL                                                            |
|---------------------|----------------------------------------------------------------|
| MySQL (local)       | `mysql+aiomysql://user:pass@localhost:3306/devconnect`         |
| MySQL (cloud)       | `mysql+aiomysql://user:pass@cloud-host:3306/devconnect`        |
| PostgreSQL (local)  | `postgresql+asyncpg://user:pass@localhost:5432/devconnect`     |
| PostgreSQL (cloud)  | `postgresql+asyncpg://user:pass@cloud-host:5432/devconnect`    |

---

## OAuth Setup

### Google
1. https://console.cloud.google.com → APIs & Services → Credentials → Create OAuth 2.0 Client
2. Application type: **Web application**
3. Authorized redirect URI: `http://localhost:8000/api/v1/auth/google/callback`
4. Copy Client ID & Secret → paste into `.env`

### GitHub
1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
2. Authorization callback URL: `http://localhost:8000/api/v1/auth/github/callback`
3. Copy Client ID & Secret → paste into `.env`

---

## Key Environment Variables

| Variable               | Description                              | Required |
|------------------------|------------------------------------------|----------|
| `SECRET_KEY`           | JWT signing secret (32+ random chars)    | ✅        |
| `DATABASE_URL`         | Full DB connection string                | ✅        |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID                   | Optional |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret               | Optional |
| `GITHUB_CLIENT_ID`     | GitHub OAuth client ID                   | Optional |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret               | Optional |
| `CORS_ORIGINS`         | JSON array of allowed frontend origins   | ✅        |
| `DEBUG`                | Show /docs and verbose SQL               | Optional |

---

## API Reference

| Method | Endpoint                          | Description                    | Auth     |
|--------|-----------------------------------|--------------------------------|----------|
| POST   | /api/v1/auth/register             | Register with email/password   | Public   |
| POST   | /api/v1/auth/login                | Login → JWT tokens             | Public   |
| POST   | /api/v1/auth/refresh              | Refresh access token           | Public   |
| POST   | /api/v1/auth/logout               | Logout (client drops tokens)   | Public   |
| GET    | /api/v1/auth/google               | Redirect to Google OAuth       | Public   |
| GET    | /api/v1/auth/google/callback      | Google OAuth callback          | Public   |
| GET    | /api/v1/auth/github               | Redirect to GitHub OAuth       | Public   |
| GET    | /api/v1/auth/github/callback      | GitHub OAuth callback          | Public   |
| GET    | /api/v1/auth/me                   | Current user profile           | Bearer   |
| GET    | /api/v1/questions                 | List/search/filter questions   | Optional |
| POST   | /api/v1/questions                 | Create question                | Bearer   |
| GET    | /api/v1/questions/{id}            | Question detail + answers      | Optional |
| PUT    | /api/v1/questions/{id}            | Edit question                  | Bearer   |
| DELETE | /api/v1/questions/{id}            | Soft-delete question           | Bearer   |
| POST   | /api/v1/questions/{id}/vote       | Upvote / downvote              | Bearer   |
| POST   | /api/v1/questions/{id}/bookmark   | Toggle bookmark                | Bearer   |
| POST   | /api/v1/questions/{id}/comments   | Add comment to question        | Bearer   |
| POST   | /api/v1/questions/{id}/answers    | Post an answer                 | Bearer   |
| PUT    | /api/v1/answers/{id}              | Edit answer                    | Bearer   |
| DELETE | /api/v1/answers/{id}              | Delete answer                  | Bearer   |
| POST   | /api/v1/answers/{id}/vote         | Vote on answer                 | Bearer   |
| POST   | /api/v1/answers/{id}/accept       | Accept answer (Q author)       | Bearer   |
| POST   | /api/v1/answers/{id}/comments     | Add comment to answer          | Bearer   |
| DELETE | /api/v1/comments/{id}             | Delete comment                 | Bearer   |
| GET    | /api/v1/users                     | List users                     | Public   |
| GET    | /api/v1/users/me                  | Own full profile               | Bearer   |
| PUT    | /api/v1/users/me                  | Update own profile             | Bearer   |
| PUT    | /api/v1/users/me/password         | Change password                | Bearer   |
| GET    | /api/v1/users/me/bookmarks        | Own bookmarked questions       | Bearer   |
| GET    | /api/v1/users/{username}          | Public user profile            | Public   |
| GET    | /api/v1/tags                      | List / search tags             | Public   |
| GET    | /api/v1/tags/{name}               | Tag detail                     | Public   |
| POST   | /api/v1/tags                      | Create tag (admin only)        | Bearer   |

---

## Project Structure

```
backend/
├── app/
│   ├── api/v1/
│   │   ├── endpoints/
│   │   │   ├── auth.py        # Register, login, OAuth flows
│   │   │   ├── questions.py   # CRUD, vote, bookmark, close
│   │   │   ├── answers.py     # CRUD, vote, accept, comments
│   │   │   └── users.py       # Profiles, tags
│   │   ├── deps.py            # get_current_user, get_current_admin
│   │   └── __init__.py        # Router aggregator
│   ├── core/
│   │   ├── config.py          # All settings via env vars
│   │   └── security.py        # JWT helpers, bcrypt
│   ├── db/
│   │   └── session.py         # Async engine, session, Base, init_db
│   ├── models/
│   │   ├── user.py            # User ORM model
│   │   ├── question.py        # Question + question_tags pivot
│   │   ├── answer.py          # Answer, Comment, Vote, Tag, Badge, Bookmark
│   │   └── __init__.py
│   ├── schemas/
│   │   ├── auth.py            # Register/Login/Token schemas
│   │   ├── user.py            # UserPublic, UserPrivate, UserUpdate
│   │   └── question.py        # Question, Answer, Comment, Tag, Vote schemas
│   └── main.py                # FastAPI app factory + lifespan
├── migrations/                # Alembic migration scripts
├── requirements.txt
├── alembic.ini
└── .env.example
```
