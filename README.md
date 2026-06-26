# DevConnect 🔗

A full-stack developer Q&A community — think StackOverflow, built from scratch.

**Backend:** FastAPI · SQLAlchemy (async) · MySQL · JWT · Google/GitHub OAuth  
**Frontend:** React 18 · Tailwind CSS · Zustand · Markdown editor · Dark/Light theme

---

## Feature Highlights

- ✅ Email/password registration & login
- ✅ One-click OAuth via **Google** and **GitHub**
- ✅ Ask, edit, delete questions (Markdown + live preview)
- ✅ Post, edit, accept, vote on answers
- ✅ Comments on questions and answers
- ✅ Upvote / downvote with reputation system
- ✅ Bookmarks, tag browser, user directory
- ✅ Full-text search + filter by tag/sort
- ✅ Dark / Light theme (persisted, follows system default)
- ✅ Zero-hardcoding — swap databases via a single env var

---

## Project Layout

```
devconnect/
├── backend/      ← FastAPI Python backend
└── frontend/     ← React frontend
```

---

## ──────────────────────────────────────────
## STEP-BY-STEP SETUP GUIDE
## ──────────────────────────────────────────

### Prerequisites

| Tool       | Minimum version | Install                          |
|------------|-----------------|----------------------------------|
| Python     | 3.11            | https://python.org               |
| Node.js    | 18              | https://nodejs.org               |
| MySQL      | 8.0             | https://dev.mysql.com/downloads/ |
| Git        | any             | https://git-scm.com              |

---

## PART 1 — Database Setup

### 1.1 Log into MySQL

```bash
mysql -u root -p
```

### 1.2 Create the database and user

```sql
CREATE DATABASE devconnect
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER 'devuser'@'localhost' IDENTIFIED BY 'devpassword';
GRANT ALL PRIVILEGES ON devconnect.* TO 'devuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

> **Cloud database?** Skip this step. Just use your cloud provider's connection string in Step 2.4.

---

## PART 2 — Backend Setup

### 2.1 Create & activate a Python virtual environment

```bash
cd backend

# macOS / Linux
python3 -m venv venv
source venv/bin/activate

# Windows (PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 2.2 Install Python dependencies

```bash
pip install -r requirements.txt
```

### 2.3 Copy the environment file

```bash
cp .env.example .env
```

### 2.4 Edit `.env` — minimum required values

Open `.env` in any editor and set:

```dotenv
# A random string of 32+ characters — used to sign JWT tokens
# Generate one: python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=paste-your-generated-secret-here

# Your MySQL connection string (swap host/user/pass for cloud)
DATABASE_URL=mysql+aiomysql://devuser:devpassword@localhost:3306/devconnect

# The URL(s) your React frontend runs on
CORS_ORIGINS=["http://localhost:3000"]
```

Everything else (OAuth, email, Redis) is optional for local testing.

### 2.5 Start the backend

```bash
uvicorn app.main:app --reload --port 8000
```

On first run, **all database tables are created automatically**.

✅ Backend is ready at: http://localhost:8000  
✅ Interactive API docs: http://localhost:8000/docs

---

## PART 3 — Frontend Setup

### 3.1 Install Node dependencies

```bash
cd ../frontend
npm install
```

### 3.2 Copy the environment file

```bash
cp .env.example .env
```

### 3.3 Edit `.env`

```dotenv
# Must match where your backend is running
REACT_APP_API_URL=http://localhost:8000/api/v1
```

### 3.4 Start the frontend

```bash
npm start
```

✅ Frontend is ready at: http://localhost:3000

---

## PART 4 — OAuth Setup (Optional but Recommended)

### 4.1 Google OAuth

1. Go to https://console.cloud.google.com
2. Create a project (or select an existing one)
3. **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
4. Application type: **Web application**
5. Add to **Authorized redirect URIs**:
   ```
   http://localhost:8000/api/v1/auth/google/callback
   ```
6. Copy the **Client ID** and **Client Secret**
7. Add to `backend/.env`:
   ```dotenv
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

### 4.2 GitHub OAuth

1. Go to https://github.com/settings/developers
2. **OAuth Apps → New OAuth App**
3. Fill in:
   - **Application name**: DevConnect
   - **Homepage URL**: http://localhost:3000
   - **Authorization callback URL**: `http://localhost:8000/api/v1/auth/github/callback`
4. Click **Register application**
5. Copy the **Client ID**, then **Generate a new client secret**
6. Add to `backend/.env`:
   ```dotenv
   GITHUB_CLIENT_ID=your-client-id
   GITHUB_CLIENT_SECRET=your-client-secret
   ```
7. Restart the backend after editing `.env`

---

## PART 5 — Verify Everything Works

1. Open http://localhost:3000
2. Click **Sign up** → create an account with email/password
3. Post a question using the **Ask Question** button
4. Try voting, commenting, bookmarking
5. Log out → try **Continue with Google** or **Continue with GitHub**

---

## PART 6 — Switching Databases

Only change `DATABASE_URL` in `backend/.env`. No code changes anywhere.

| Database              | Example URL                                                                 |
|-----------------------|-----------------------------------------------------------------------------|
| MySQL (local)         | `mysql+aiomysql://devuser:devpass@localhost:3306/devconnect`                |
| MySQL (PlanetScale)   | `mysql+aiomysql://user:pass@host.aws.connect.psdb.cloud/devconnect?ssl=1`  |
| MySQL (AWS RDS)       | `mysql+aiomysql://admin:pass@rds-endpoint.rds.amazonaws.com:3306/devconnect`|
| PostgreSQL (local)    | `postgresql+asyncpg://user:pass@localhost:5432/devconnect`                  |
| PostgreSQL (Supabase) | `postgresql+asyncpg://postgres:pass@db.xxx.supabase.co:5432/postgres`       |
| PostgreSQL (Neon)     | `postgresql+asyncpg://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb`      |

> For cloud MySQL requiring SSL, add `?ssl=true` or `?ssl_ca=/path/to/ca.pem` to the URL.

---

## PART 7 — Production Deployment Tips

### Backend

```bash
# Use gunicorn + uvicorn workers in production
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

Update `backend/.env` for production:
```dotenv
DEBUG=false
SECRET_KEY=<long-random-string>
CORS_ORIGINS=["https://your-frontend-domain.com"]
DATABASE_URL=<your-production-db-url>
GOOGLE_REDIRECT_URI=https://your-backend-domain.com/api/v1/auth/google/callback
GITHUB_REDIRECT_URI=https://your-backend-domain.com/api/v1/auth/github/callback
```

### Frontend

```bash
# Build static files
cd frontend
npm run build
# Deploy /build to Vercel, Netlify, S3, or any static host
```

Update `frontend/.env` before building:
```dotenv
REACT_APP_API_URL=https://your-backend-domain.com/api/v1
```

### Database Migrations (Production)

Instead of `init_db()` auto-create, use Alembic for safe schema upgrades:

```bash
cd backend
# Generate a migration after model changes
alembic revision --autogenerate -m "describe your change"
# Apply migrations
alembic upgrade head
```

---

## Common Issues & Fixes

| Problem                          | Solution                                                                    |
|----------------------------------|-----------------------------------------------------------------------------|
| `ModuleNotFoundError: aiomysql`  | `pip install aiomysql` (already in requirements.txt)                        |
| MySQL auth error                 | Double-check user/password in DATABASE_URL; try `mysql -u devuser -p`      |
| CORS error in browser            | Ensure `CORS_ORIGINS` in `.env` contains exactly `http://localhost:3000`   |
| OAuth redirect mismatch          | The redirect URI in `.env` must **exactly** match what you registered       |
| `SECRET_KEY` too short           | Must be 32+ characters; generate: `python -c "import secrets; print(secrets.token_hex(32))"` |
| Frontend 404 on refresh          | Configure your server to serve `index.html` for all routes                  |
| Port 8000 already in use         | `uvicorn app.main:app --reload --port 8001` and update `REACT_APP_API_URL`  |

---

## Environment Variable Reference

### Backend (`backend/.env`)

| Variable               | Default                        | Description                              |
|------------------------|--------------------------------|------------------------------------------|
| `APP_NAME`             | DevConnect                     | Application name (used in responses)     |
| `DEBUG`                | false                          | Enable /docs and verbose SQL logs        |
| `SECRET_KEY`           | *(must set)*                   | JWT signing key — keep secret!           |
| `ALGORITHM`            | HS256                          | JWT algorithm                            |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | 30                    | Access token lifetime                    |
| `REFRESH_TOKEN_EXPIRE_DAYS`   | 7                     | Refresh token lifetime                   |
| `DATABASE_URL`         | *(must set)*                   | Full async DB connection string          |
| `CORS_ORIGINS`         | `["http://localhost:3000"]`    | JSON array of allowed frontend origins   |
| `GOOGLE_CLIENT_ID`     | –                              | Google OAuth client ID                   |
| `GOOGLE_CLIENT_SECRET` | –                              | Google OAuth client secret               |
| `GITHUB_CLIENT_ID`     | –                              | GitHub OAuth client ID                   |
| `GITHUB_CLIENT_SECRET` | –                              | GitHub OAuth client secret               |

### Frontend (`frontend/.env`)

| Variable                  | Default                           | Description               |
|---------------------------|-----------------------------------|---------------------------|
| `REACT_APP_API_URL`       | http://localhost:8000/api/v1      | Backend API base URL      |
