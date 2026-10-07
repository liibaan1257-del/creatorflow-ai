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

1. **Keys:** Supabase → Project Settings → API Keys. Put the project URL and
   the publishable (or legacy anon) key in `.env.local`, and in Vercel →
   Settings → Environment Variables. `NEXT_PUBLIC_*` values are baked in at
   build time, so redeploy after changing them.
2. **Database:** run the files in `supabase/migrations/` in order (Supabase →
   SQL Editor, or `npx supabase db push` with the CLI).
3. **Auth URLs:** Supabase → Authentication → URL Configuration:
   - Site URL: your production URL
   - Redirect URLs: `http://localhost:3000/**` and `https://<your-domain>/**`

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
