# ZenStack Backend — API Reference

## Stack
- **Runtime:** Node.js + Express.js
- **Database:** MongoDB + Mongoose ODM
- **Auth:** JWT (Bearer token)
- **Real-time:** Socket.io
- **Scheduling:** node-cron
- **Security:** helmet, bcryptjs, express-validator

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your MONGO_URI and JWT_SECRET

# 3. Run in development (auto-restarts)
npm run dev

# 4. Run in production
npm start
```

---

## Base URL
```
http://localhost:5000/api
```

---

## Authentication
All protected routes require:
```
Authorization: Bearer <token>
```

---

## Endpoints

### Auth  `/api/auth`

| Method | Path            | Auth | Description              |
|--------|-----------------|------|--------------------------|
| POST   | `/register`     | ✗    | Create account           |
| POST   | `/login`        | ✗    | Login, returns JWT       |
| GET    | `/me`           | ✓    | Get current user         |
| PATCH  | `/preferences`  | ✓    | Update user preferences  |
| PATCH  | `/password`     | ✓    | Change password          |

**Register body:**
```json
{ "name": "Akhil", "email": "akhil@example.com", "password": "securepass123" }
```

**Login body:**
```json
{ "email": "akhil@example.com", "password": "securepass123" }
```

**Preferences body:**
```json
{
  "theme": "dark",
  "focusDuration": 25,
  "breakDuration": 5,
  "socialGapHours": 48,
  "notifications": { "hydration": true, "socialPing": true, "moodReminder": true }
}
```

---

### Brag Stack  `/api/brags`  (Tech Core)

| Method | Path        | Auth | Description                  |
|--------|-------------|------|------------------------------|
| GET    | `/`         | ✓    | Get wins (paginated)         |
| POST   | `/`         | ✓    | Log a new win                |
| GET    | `/stats`    | ✓    | Win count by category        |
| GET    | `/:id`      | ✓    | Get single win               |
| PATCH  | `/:id`      | ✓    | Update win                   |
| DELETE | `/:id`      | ✓    | Delete win                   |

**POST body:**
```json
{
  "title": "Fixed the race condition in the auth middleware",
  "description": "Used mutex locks to prevent concurrent writes",
  "category": "Bug Fix"
}
```

**Categories:** `Bug Fix` | `New Skill` | `Milestone` | `PR Merged` | `Test Pass` | `Other`

**Query params (GET /):** `?category=Bug Fix&limit=20&page=1`

---

### Tasks  `/api/tasks`  (Solo Core)

| Method | Path              | Auth | Description              |
|--------|-------------------|------|--------------------------|
| GET    | `/`               | ✓    | Get all tasks            |
| POST   | `/`               | ✓    | Create task              |
| GET    | `/daily-reset`    | ✓    | Get today's needs list   |
| PATCH  | `/:id/complete`   | ✓    | Mark complete            |
| PATCH  | `/:id`            | ✓    | Update task              |
| DELETE | `/:id`            | ✓    | Delete task              |

**POST body:**
```json
{
  "title": "Do dishes",
  "category": "Chore",
  "frequency": "Daily",
  "targetDuration": 600
}
```

**Categories:** `Chore` | `Health` | `Social` | `Self-care`  
**Frequencies:** `Once` | `Daily` | `Weekly`

---

### Mood Pulse  `/api/mood`  (Sanctuary)

| Method | Path       | Auth | Description             |
|--------|------------|------|-------------------------|
| POST   | `/`        | ✓    | Log today's mood        |
| GET    | `/today`   | ✓    | Get today's mood        |
| GET    | `/week`    | ✓    | 7-day trend for chart   |
| GET    | `/`        | ✓    | Full mood history       |

**POST body:**
```json
{ "moodLevel": 4, "note": "Productive day, fixed 2 bugs!" }
```

`moodLevel` is 1–5 (maps to 😔 😕 😐 🙂 😄)

---

## Socket.io Events

### Client → Server
| Event              | Payload | Description                          |
|--------------------|---------|--------------------------------------|
| `water:log`        | —       | User drank water (resets cron timer) |
| `social:activity`  | —       | User had social contact              |
| `pomodoro:start`   | `{duration}` | Focus session started           |
| `pomodoro:end`     | `{completed}` | Focus session ended            |

**Connection auth:**
```js
const socket = io("http://localhost:5000", {
  auth: { token: "your_jwt_token" }
});
```

### Server → Client
| Event    | Payload                                 | Description          |
|----------|-----------------------------------------|----------------------|
| `nudge`  | `{ type, icon, message }`               | Smart reminder push  |

---

## Cron Jobs

| Job               | Schedule          | Action                              |
|-------------------|-------------------|-------------------------------------|
| Hydration Nudge   | Every 2 hours     | Push water reminder via Socket.io   |
| Social Ping       | Every hour        | Check 48h gap, push call-home nudge |
| Mood Reminder     | Daily at 9 PM     | Push mood log reminder              |
| Daily Task Reset  | Midnight daily    | Reset all Daily tasks to Pending    |
| Sun Break Nudge   | 9 AM, 3 PM, 6 PM  | Push outdoor break reminder         |

---

## Response Format

**Success:**
```json
{ "success": true, "data": { ... } }
```

**Error:**
```json
{ "success": false, "message": "Error description" }
```

---

## Project Structure

```
zenstack-backend/
├── config/
│   └── db.js                  MongoDB connection
├── src/
│   ├── server.js              Express app + Socket.io + entry point
│   ├── models/
│   │   ├── User.js            User schema (auth + preferences)
│   │   ├── BragLog.js         Tech Core — wins journal
│   │   ├── Task.js            Solo Core — life tasks
│   │   └── MoodLog.js         Sanctuary — mood pulse
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── bragController.js
│   │   ├── taskController.js
│   │   └── moodController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── brags.js
│   │   ├── tasks.js
│   │   └── mood.js
│   ├── middleware/
│   │   ├── auth.js            JWT protect + signToken
│   │   └── errorHandler.js    Central error handler
│   ├── jobs/
│   │   └── cronJobs.js        5 scheduled background jobs
│   └── utils/
│       └── socket.js          Socket.io init + auth middleware
└── .env.example
```
