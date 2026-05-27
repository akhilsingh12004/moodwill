# ZenStack — Mental Wellness OS

> A unified mental wellness ecosystem for tech students living alone.
> Built on the MERN stack with real-time nudges, JWT auth, and a dark-mode-first UI.

---

## Project Structure

```
zenstack/
├── zenstack-backend/          Node.js + Express + MongoDB
│   ├── config/db.js
│   ├── src/
│   │   ├── server.js          Entry point
│   │   ├── models/            User · BragLog · Task · MoodLog
│   │   ├── controllers/       Auth · Brag · Task · Mood
│   │   ├── routes/            /api/auth · /api/brags · /api/tasks · /api/mood
│   │   ├── middleware/        JWT protect · errorHandler
│   │   ├── jobs/cronJobs.js   5 background schedules
│   │   └── utils/socket.js    Socket.io real-time bridge
│   └── render.yaml            Render deployment config
│
└── zenstack-frontend/         React 18 + Vite + React Query
    ├── src/
    │   ├── api/               axiosConfig · authService · services
    │   ├── context/           AuthContext · SocketContext
    │   ├── hooks/             useBrags · useTasks · useMood
    │   │                      usePomodoro · useChoreTimer · useBreathing
    │   ├── components/
    │   │   └── layout/        AppLayout (sidebar · nudge toasts · SOS overlay)
    │   ├── pages/             AuthPage · HomePage · TechPage · SoloPage · MindPage
    │   └── App.jsx            Router · QueryClient · Auth/Socket providers
    └── vercel.json            Vercel deployment config
```

---

## Quick Start (Local Dev)

### 1. Backend

```bash
cd zenstack-backend
npm install
cp .env.example .env
# Fill in MONGO_URI and JWT_SECRET in .env
npm run dev
# → http://localhost:5000
```

### 2. Frontend

```bash
cd zenstack-frontend
npm install
cp .env.example .env
# VITE_API_URL=http://localhost:5000/api
# VITE_SOCKET_URL=http://localhost:5000
npm run dev
# → http://localhost:3000
```

---

## What's Built

### Three Pillars

| Pillar | Feature | Tech |
|--------|---------|------|
| ⚡ Tech Core | Brag Stack (wins journal) | React Query + `/api/brags` |
| ⚡ Tech Core | Pomodoro focus timer (25/5) | `usePomodoro` hook + Socket.io events |
| ⚡ Tech Core | Project milestone tracker | Drag sliders wired to local state |
| ⚡ Tech Core | Compile-time eye/neck breaks | Static UI |
| 🌿 Solo Core | Daily Reset (Sleep/Eat/Water/Sun) | React Query + `/api/tasks` PATCH complete |
| 🌿 Solo Core | Speed-Run Chore Timer | `useChoreTimer` hook |
| 🌿 Solo Core | Smart Nudges (hydration/social/sun) | node-cron → Socket.io → toast UI |
| 🌿 Solo Core | Full task CRUD with categories | `/api/tasks` REST + optimistic updates |
| ◎ Sanctuary | 4-7-8 Breathing pacer | `useBreathing` hook + Framer Motion |
| ◎ Sanctuary | Mood Pulse (emoji + 7-day chart) | React Query + `/api/mood` + Recharts |
| ◎ Sanctuary | Developer Soundscapes mixer | Local state volume controls |
| ◎ Sanctuary | Digital fatigue routines | Static UI |
| 🆘 SOS | Full-screen anxiety relief | Framer Motion overlay |

### Auth & Real-time

- JWT in `localStorage` with auto-attach on every request via axios interceptor
- 401 → auto-logout and redirect to `/login`
- Socket.io authenticated per-user room (`user:<id>`)
- Cron nudges pushed live via `io.to(room).emit("nudge", ...)`

---

## Deployment

### Backend → Render

1. Push `zenstack-backend/` to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Point to your repo, set root dir to `zenstack-backend`
4. Set env vars in Render dashboard:
   - `MONGO_URI` — MongoDB Atlas connection string
   - `CLIENT_URL` — your Vercel frontend URL
5. Render auto-generates `JWT_SECRET` from `render.yaml`

### Frontend → Vercel

```bash
cd zenstack-frontend
npx vercel
```

Or connect the repo in the Vercel dashboard and set:
- `VITE_API_URL`    → `https://your-app.onrender.com/api`
- `VITE_SOCKET_URL` → `https://your-app.onrender.com`

### CI/CD (GitHub Actions)

Add these secrets to your GitHub repo:
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- `VITE_API_URL`, `VITE_SOCKET_URL`

Every push to `main` → syntax check backend + build frontend + deploy to Vercel.

---

## API Summary

| Method | Endpoint                | Auth | Description           |
|--------|-------------------------|------|-----------------------|
| POST   | `/api/auth/register`    | ✗    | Create account        |
| POST   | `/api/auth/login`       | ✗    | Login → JWT           |
| GET    | `/api/auth/me`          | ✓    | Current user          |
| PATCH  | `/api/auth/preferences` | ✓    | Update settings       |
| GET    | `/api/brags`            | ✓    | List wins             |
| POST   | `/api/brags`            | ✓    | Log a win             |
| GET    | `/api/brags/stats`      | ✓    | Wins by category      |
| DELETE | `/api/brags/:id`        | ✓    | Delete a win          |
| GET    | `/api/tasks`            | ✓    | List tasks            |
| POST   | `/api/tasks`            | ✓    | Create task           |
| PATCH  | `/api/tasks/:id/complete` | ✓  | Mark complete         |
| POST   | `/api/mood`             | ✓    | Log mood (upserts)    |
| GET    | `/api/mood/week`        | ✓    | 7-day chart data      |
| GET    | `/api/mood/today`       | ✓    | Today's mood          |
| GET    | `/api/health`           | ✗    | Health check          |

---

## Cron Jobs

| Job | Schedule | Action |
|-----|----------|--------|
| Hydration Nudge | Every 2h | Push water reminder to user's socket room |
| Social Ping | Every 1h | Check gap → push call-home nudge |
| Mood Reminder | 9 PM daily | Push if no mood logged today |
| Daily Reset | Midnight | Reset all Daily tasks → Pending |
| Sun Break | 9AM/3PM/6PM | Push outdoor break nudge |

---

## Roadmap

- [ ] Phase 4: PWA manifest + offline support
- [ ] Phase 4: Push notifications (Web Push API)
- [ ] Phase 4: Friend system for social accountability
- [ ] Phase 4: Export mood/brag data as PDF report
- [ ] Phase 4: VS Code extension for compile-time breaks
