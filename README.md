# CardSync Backend (MongoDB + Express + TypeScript)

Drop-in REST API for CardSync using **MongoDB (Mongoose)** and **JWT auth**. Optional **Supabase** forwarding for analytics.

## Quick Start
1) Copy `.env.example` → `.env` and fill values (Mongo `MONGODB_URI`, `JWT_SECRET`, etc.).
2) Install & run:
```bash
npm i
npm run dev
```
3) Health check: `GET http://localhost:8080/health`

### Auth
- Register: `POST /v1/auth/register` { name, email, password }
- Login: `POST /v1/auth/login` { email, password }
- Me: `GET /v1/auth/me` with `Authorization: Bearer <JWT>`

### Main Routes
- `/v1/profile` GET/PUT
- `/v1/cards` CRUD
- `/v1/connections` list/create/patch
- `/v1/analytics/event` (stores to Mongo; forwards to Supabase if configured)

## Data Model
Mongo collections:
- users
- cards (userId ref)
- connections (userId ref)
- events (analytics)

Indexes are applied for common queries.

## Notes
- Strong Zod validation on inputs.
- Centralized error handler.
- CORS allowlist via `CORS_ORIGIN`.
- JWT expiry configurable via `JWT_EXPIRES_IN`.
