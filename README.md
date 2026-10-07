# CreatorFlow AI

AI-powered content creation platform for bloggers, YouTubers, social media
creators, freelancers, and small businesses.

**Stack:** Next.js (App Router) · React · TypeScript · Tailwind CSS · Supabase (Postgres, Auth, Storage) · Vercel

## Getting started

Requires Node.js 22 (pinned in `package.json` `engines` so Vercel builds on the same major).

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

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
    api/health/           Liveness endpoint
    layout.tsx            Root layout, metadata, fonts
    error.tsx, not-found.tsx
  components/
    ui/                   Reusable primitives (Button, Container)
    layout/               Site chrome (header, footer)
  config/                 Static, non-secret configuration
  hooks/                  Client-side React hooks
  lib/                    Utilities and environment access
  services/               Server-only integrations (AI, payments)
  types/                  Shared TypeScript types
supabase/
  migrations/             SQL migrations (RLS on every table)
```

Planned route groups: `(auth)` for sign-in/sign-up and `(app)` for the
authenticated dashboard, each with its own layout.

## Environment variables

See `.env.example`. Only `NEXT_PUBLIC_*` variables reach the browser; every
secret stays server-side and is read only from modules marked
`import "server-only"`.
