# TaskNest: Cloud-Based Task Management App

A full-stack task manager with JWT authentication, a REST API, MongoDB Atlas storage and cloud deployment on Render.

**Stack:** Node.js, Express, MongoDB (Mongoose), JWT, bcrypt, vanilla JS frontend served by Express.

## Architecture

Browser (public/index.html) → REST API (Express on Render) → MongoDB Atlas

## Project structure

```
server.js    app setup, middleware, DB connection, static hosting
routes.js    auth middleware + all REST endpoints
models.js    Mongoose schemas: User, Project, Task
public/      frontend (Kanban board, login, dashboard)
```

## Run locally

1. Install Node.js 18 or newer.
2. `npm install`
3. Copy `.env.example` to `.env` and fill in `MONGODB_URI` and `JWT_SECRET`.
4. `npm start`, then open http://localhost:3000

## REST API

All routes except `/auth/*` and `/health` need the header `Authorization: Bearer <token>`.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/auth/signup | Create account, returns JWT |
| POST | /api/auth/login | Sign in, returns JWT |
| GET | /api/bootstrap | Current user, projects, members and tasks |
| POST | /api/projects | Create a project |
| POST | /api/projects/:id/members | Add a registered user (owner only) |
| POST | /api/projects/:id/tasks | Create a task |
| PUT | /api/tasks/:id | Update a task (edit or move column) |
| DELETE | /api/tasks/:id | Delete a task |
| GET | /api/health | Uptime check |

## Deployment (free tier)

**1. Database: MongoDB Atlas**
1. Create a free account and an M0 cluster at mongodb.com/atlas.
2. Database Access: add a user with a password.
3. Network Access: add `0.0.0.0/0` so Render can connect.
4. Connect, then Drivers: copy the connection string, put your password in it and add `/tasknest` before the `?`.

**2. Code: GitHub**
```
git init && git add . && git commit -m "TaskNest"
git remote add origin <your-repo-url> && git push -u origin main
```

**3. Hosting: Render**
1. New, then Web Service, then connect your GitHub repo.
2. Build command: `npm install`. Start command: `npm start`.
3. Environment variables: `MONGODB_URI` (from Atlas) and `JWT_SECRET` (a long random string).
4. Deploy. Your live link looks like `https://tasknest.onrender.com`.

Free Render services sleep when idle, so the first request after a pause takes about 30 seconds.

## Security measures

- Passwords hashed with bcrypt (10 salt rounds), never stored in plain text
- Stateless JWT sessions that expire after 7 days
- Every task and project route checks that the user is a project member
- Only the project owner can add members (role-based access)
- Rate limiting on login and signup, and input validation on every write
- Secrets are kept in environment variables, not in code

## Limitations and future work

Comments on tasks, email reminders, real-time sync (Socket.io), file attachments and automated tests are not included yet.
