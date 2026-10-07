# CreatorFlow AI

AI-powered content creation platform for bloggers, YouTubers, social media
creators, freelancers, and small businesses.

**Stack:** Next.js (App Router) · React · TypeScript · Tailwind CSS · Supabase (Postgres, Auth, Storage) · Vercel

## Getting started

Requires Node.js 22 (pinned in `package.json` `engines` so Vercel builds on the same major).

```bash
npm install
cp .env.example .env.local   # then fill in the Supabase values
npm run dev
```

Open http://localhost:3000.

## Supabase setup

1. **Keys:** Supabase → Project Settings → API. Set `NEXT_PUBLIC_SUPABASE_URL`
   and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)
   in `.env.local` and in Vercel → Settings → Environment Variables.
   `NEXT_PUBLIC_*` values are baked in at build time, so redeploy after changes.
   `SUPABASE_SERVICE_ROLE_KEY` is server-only and optional for now.
2. **Database & storage:** run the files in `supabase/migrations/` in order
   (Supabase → SQL Editor, or `npx supabase db push` with the CLI), then run
   `supabase/tests/rls_test.sql` to verify Row Level Security. It runs in a
   rolled-back transaction and reports `FAIL: ...` if anything leaks.
3. **Auth URLs:** Supabase → Authentication → URL Configuration:
   - Site URL: your production URL
   - Redirect URLs: `http://localhost:3000/**` and `https://<your-domain>/**`

### Client architecture

| File | Runs in | Key | Use for |
| --- | --- | --- | --- |
| `src/lib/supabase/client.ts` | Browser (Client Components) | anon/publishable | Realtime, client-side reads (RLS applies) |
| `src/lib/supabase/server.ts` | Server Components, Server Actions, Route Handlers | anon/publishable + user cookies | Everything done on behalf of the signed-in user (RLS applies) |
| `src/lib/supabase/proxy.ts` | `src/proxy.ts` | anon/publishable | Refreshing the session cookie on each request |
| `src/lib/supabase/admin.ts` | Server only (`server-only`) | service role | Trusted jobs only (webhooks, admin). **Bypasses RLS** |

- `src/lib/auth/dal.ts`: Data Access Layer (`getCurrentUser`, `requireUser`, profile queries).
- `src/lib/storage/`: bucket config and server helpers for the private
  `user-uploads` bucket (`<user id>/<file>` paths, owner-only RLS policies).
- `src/lib/env.ts` (public values) and `src/lib/server-env.ts` (secrets,
  `server-only`) are the only places that read environment variables.

## Database schema

| Table | Purpose | User access (RLS) |
| --- | --- | --- |
| `profiles` | Name, email, avatar | Read own; update name/avatar |
| `projects` | Content being worked on | Full CRUD on own rows |
| `generations` | AI text history | Read/delete own; written by server |
| `generated_images` | AI image history | Read/delete own; written by server |
| `credits` | Balance, monthly limit, reset date | Read own only |
| `subscriptions` | Plan and status | Read own only |

Signed-out visitors (`anon`) have no access to any table. New users get a
profile, credits and a free subscription automatically (signup trigger).

## Authentication

- Email + password via Supabase Auth, with email confirmation and password reset.
- `src/proxy.ts` refreshes the session cookie on each request and redirects
  signed-out users away from protected routes (a UX layer only).
- `src/lib/auth/dal.ts` is the Data Access Layer: every protected page and
  Server Action verifies the user there, and Row Level Security in Postgres
  enforces data access.
- Email links land on `/auth/confirm`, which supports both Supabase's default
  (`?code=`) links and `token_hash` links from custom email templates.

## Scripts

| Command             | Description                              |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Start the development server             |
| `npm run build`     | Production build                         |
| `npm run start`     | Serve the production build               |
| `npm run lint`      | ESLint                                   |
| `npm run typecheck` | Generate route types and run `tsc`       |

## Project structure

```
src/
  app/                    Routes (App Router)
    (marketing)/          Public pages (route group: no URL segment)
    (auth)/               Login, sign-up, password reset
    (app)/                Authenticated area (dashboard)
    auth/confirm/         Email link handler
    api/health/           Liveness endpoint
    layout.tsx            Root layout, metadata, fonts
    error.tsx, not-found.tsx
  components/
    ui/                   Reusable primitives (Button, Container)
    layout/               Site chrome (headers, footer, logo)
  features/               Feature modules (actions, components, validation)
    auth/
  config/                 Static, non-secret configuration
  hooks/                  Client-side React hooks
  lib/                    Utilities and environment access
    auth/                 Data Access Layer, redirect rules
    supabase/             Supabase clients (browser, server, proxy)
  proxy.ts                Session refresh + route protection
  services/               Server-only integrations (AI, payments)
  types/                  Shared TypeScript types (incl. database types)
supabase/
  migrations/             SQL migrations (RLS on every table)
```

## Environment variables

See `.env.example`. Only `NEXT_PUBLIC_*` variables reach the browser; every
secret stays server-side and is read only from modules marked
`import "server-only"`.

## Deployment (Vercel)

- Pushing to the production branch triggers a deploy automatically.
- `vercel.json` pins the framework preset to Next.js.
- After adding or changing environment variables, redeploy:
  `NEXT_PUBLIC_*` values are inlined at build time.
- Health check: `GET /api/health` returns `{"status":"ok"}`.
