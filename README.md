# Task Management System

Full-stack task management: Node.js + TypeScript backend with Prisma/SQLite, JWT auth (access + refresh), and Next.js (App Router) frontend with CRUD, filters, search, and toasts.

## Quick start

### Backend

```bash
cd backend
npm install
cp .env.example .env   # edit if needed
npx prisma generate
npx prisma db push
npm run dev
```

API: http://localhost:3001

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:3000

Use **http://localhost:3000** in the browser so the Next.js rewrite sends API calls to the backend.

## Backend API

- **Auth**: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`
- **Tasks**: `GET /tasks` (pagination, `status`, `search`), `POST /tasks`, `GET /tasks/:id`, `PATCH /tasks/:id`, `DELETE /tasks/:id`, `PATCH /tasks/:id/toggle`

## Tech

- **Backend**: Node.js, Express, TypeScript, Prisma, SQLite, JWT (access + refresh), bcrypt, Zod
- **Frontend**: Next.js 14 (App Router), TypeScript, react-hot-toast
