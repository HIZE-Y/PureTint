# Pure Tint API

Backend foundation for `NestJS + Prisma + Postgres + JWT auth`.

## Stack

- NestJS
- Prisma
- PostgreSQL
- JWT auth

## First setup

1. Copy `.env.example` to `.env`
2. Set `DATABASE_URL`
3. Set `JWT_SECRET`
4. Install dependencies
5. Run Prisma generate and migrations
6. Start the API

## Commands

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run start:dev
```

## Render deploy

Use `Render` for the live NestJS backend and keep `Netlify` for the frontend.

### Option 1: Blueprint

This repo includes [render.yaml](/Users/yahya/Documents/New%20project/render.yaml).

In Render:

1. Create a new `Blueprint` service from your GitHub repo.
2. Confirm the `puretint-api` web service.
3. Set these environment variables:
   - `FRONTEND_ORIGIN`
   - `DATABASE_URL`
   - `JWT_SECRET`
4. Deploy.

### Option 2: Manual web service

If you prefer manual setup in Render:

- Root directory: `backend`
- Build command: `corepack enable && pnpm install --frozen-lockfile && pnpm prisma:generate && pnpm build`
- Start command: `pnpm start:prod`
- Health check path: `/api/health`

Environment variables:

- `NODE_ENV=production`
- `FRONTEND_ORIGIN=https://your-live-frontend-domain`
- `DATABASE_URL=your-supabase-database-url`
- `JWT_SECRET=your-long-random-secret`
- `JWT_EXPIRES_IN=7d`

## Planned modules

- `auth`
- `users`
- `quotes`
- `customers`
- `projects`
- `employees`
- `appointments`

## Current endpoints

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/quotes`
- `GET /api/quotes`
- `GET /api/quotes/:id`
- `PATCH /api/quotes/:id/status`
