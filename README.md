# CreatorFlow AI

AI-powered content creation platform for bloggers, YouTubers, social media
creators, freelancers and small businesses: write articles, scripts and social
posts, generate images, start from templates and keep everything in one
private workspace, paid for with monthly credits.

**Live:** https://creatorflow-ai-sable.vercel.app

## Features

- **AI Writer:** blog posts, outlines, social posts, YouTube titles,
  descriptions and scripts, SEO titles, meta and product descriptions, in 4
  tones and 12 languages (Anthropic Claude). Edit, copy, regenerate, save.
- **AI Images:** 5 styles and 3 aspect ratios (OpenAI GPT Image), stored
  privately, downloadable, savable as projects.
- **My Projects:** search, filter, sort, edit, regenerate and delete content.
- **Templates:** 9 ready-made briefs that preset the AI Writer.
- **Credits:** Free 100 / Pro 1,000 / Business 5,000 per month; writer 5,
  image 10, regeneration 5. Atomic, race-free, with a ledger and monthly reset.
- **Accounts:** email sign-up with confirmation, login, password reset,
  settings (name, photo, email, password, preferences, sessions, deletion).
- **Production basics:** Row Level Security everywhere, rate limits, security
  headers, SEO metadata, sitemap, Open Graph image, accessible UI, dark mode.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Components, Server Actions, Partial Prerendering) |
| Language / UI | TypeScript, React 19, Tailwind CSS 4 (no UI library) |
| Backend | Supabase: Postgres (RLS), Auth, Storage |
| AI | Anthropic SDK (text), OpenAI SDK (images), behind provider interfaces in `src/lib/ai` |
| Images | `sharp` (server-side cropping and re-encoding) |
| Hosting | Vercel (Node.js 22) |

## Local setup

Requires Node.js 22 (`.nvmrc`, and `engines` in `package.json` so Vercel uses
the same major) and a Supabase project (hosted, or local with the Supabase CLI).

```bash
git clone https://github.com/liibaan1257-del/creatorflow-ai.git
cd creatorflow-ai
npm install
cp .env.example .env.local   # fill in the values (see Environment variables)
npm run dev                  # http://localhost:3000
```

Then set up the database (next section). Without AI keys the app runs and
shows "not configured" notices on the AI pages.

## Environment variables

| Variable | Where | Required | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | yes | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server | yes | anon or publishable key (`sb_publishable_…`); `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` also accepted. Safe to expose: data is protected by RLS |
| `NEXT_PUBLIC_APP_URL` | browser + server | recommended | Canonical URL for metadata and email links; falls back to the Vercel URL |
| `ANTHROPIC_API_KEY` | server only | for AI Writer | **Secret** |
| `OPENAI_API_KEY` | server only | for AI Images | **Secret** |
| `AI_PROVIDER`, `AI_MODEL`, `IMAGE_PROVIDER`, `IMAGE_MODEL` | server only | no | Overrides (defaults: anthropic / claude-opus-5-5, openai / gpt-image-1) |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | no | **Secret.** Bypasses RLS; reserved for future webhooks. Not needed today |

Never prefix a secret with `NEXT_PUBLIC_` (that ships it to the browser).
Secrets are read only in `src/lib/server-env.ts` (`server-only`). `.env*`
files are git-ignored; only `.env.example` (no values) is committed.

## Supabase setup

1. **Keys:** copy the project URL and anon/publishable key into `.env.local`
   and into Vercel (see Deployment).
2. **Database:** in Supabase → SQL Editor, run every file in
   `supabase/migrations/` **in filename order** (or `npx supabase db push`):

   | Migration | Adds |
   | --- | --- |
   | `20261007120000_create_profiles.sql` | profiles + signup trigger |
   | `20261007150000_create_storage_buckets.sql` | private `user-uploads` bucket + policies |
   | `20261007160000_create_core_schema.sql` | projects, generations, images, credits, subscriptions + RLS |
   | `20261008090000_ai_writer.sql` | atomic `record_generation()` |
   | `20261008120000_ai_images.sql` | image metadata + `record_image_generation()` |
   | `20261008150000_project_brief.sql` | stored briefs for Regenerate |
   | `20261008180000_more_content_types.sql` | YouTube script, meta and product types |
   | `20261009090000_credit_system.sql` | plans, ledger, prices, monthly reset |
   | `20261009120000_account_settings.sql` | preferences, avatars, account deletion |
   | `20261009150000_hardening.sql` | least-privilege grants, indexes, rate limits |

   All migrations are safe to re-run.
3. **Verify:** run the files in `supabase/tests/` (`rls_test`, `credits_test`,
   `account_test`, `hardening_test`). Each runs in a rolled-back transaction
   and returns "Success. No rows returned", or an error starting with `FAIL:`.
4. **Auth → URL Configuration:**
   - Site URL: your production URL (e.g. `https://creatorflow-ai-sable.vercel.app`)
   - Redirect URLs: `http://localhost:3000/**` and `https://<production-domain>/**`
5. **Auth → Emails → SMTP (production):** Supabase's built-in email is limited
   to a few emails per hour. Configure custom SMTP (e.g. Resend with your
   domain), then raise Auth → Rate Limits → emails per hour.
6. **Auth → Rate Limits:** sign-ins come from the app's servers, so raise
   "sign-ups and sign-ins" (e.g. 100 per 5 minutes).

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
| `credits` | Balance, monthly allowance, reset date | Read own only |
| `credit_transactions` | Credit ledger (every grant, spend and reset) | Read own only |
| `subscriptions` | Plan and status | Read own only |
| `plans` | Plan catalogue and monthly allowances | Read by everyone |

Signed-out visitors (`anon`) can only read `plans`. New users get a profile,
a free subscription and the Free allowance automatically (signup trigger).

## Credits

| Plan | Credits / month | | Action | Cost |
| --- | --- | --- | --- | --- |
| Free | 100 | | AI Writer | 5 |
| Pro | 1,000 | | AI Image | 10 |
| Business | 5,000 | | Regeneration | 5 |

- The database is the source of truth: `public.plans` (allowances) and
  `public.generation_cost()` (prices). `src/config/credits.ts` is for display.
- Balances change only inside `security definer` functions, never from the
  client. Each one locks the user's `credits` row (`SELECT … FOR UPDATE`),
  re-checks the balance, deducts, records the generation and writes a
  `credit_transactions` row in one transaction, so simultaneous requests
  cannot overspend. `CHECK (balance >= 0)` is the final guard.
- Server helpers: `src/lib/credits` (`checkCredits`, `getCreditCost`,
  `fetchMyCredits`) give a fast pre-check before calling an AI provider;
  `getCurrentCredits` / `getCreditHistory` in the DAL feed the UI.
- Monthly reset: applied lazily under the same row lock the first time the
  user's credits are read or spent after `reset_date` (balance = allowance of
  the effective plan; unused credits don't roll over; the reset day stays
  fixed). Optionally run `select public.reset_due_credits()` on a schedule
  (pg_cron) with the service role.
- Payments (later): a webhook running with the service role calls
  `public.apply_plan_change(user, plan, status, expires_at)`. Upgrades add the
  allowance difference immediately; downgrades cap the balance. Expired paid
  plans fall back to Free at the next reset.
- Tests: `supabase/tests/credits_test.sql` (run in the SQL Editor; rolled back).

## AI Writer

- UI: `/writer` (`src/features/writer`). Endpoint: `POST /api/ai/generate`.
- Provider abstraction in `src/lib/ai/` (`AIProvider` interface). The default
  provider is Anthropic (Claude, `claude-opus-5-5`) via the official SDK; set
  `ANTHROPIC_API_KEY` (server-only) and optionally `AI_MODEL`. To add another
  provider, implement `AIProvider` in `src/lib/ai/providers/` and register it
  in `src/lib/ai/index.ts`.
- Credits: the endpoint verifies the Supabase session, checks the balance,
  generates, then calls `public.record_generation()`, which prices the
  generation server-side (5 credits; `regenerate: true` is charged as a
  regeneration), deducts credits atomically under a row lock and records the
  generation. Failed or refused generations are not charged. Users cannot
  write credits or generations directly.

## AI Images

- UI: `/images` (`src/features/images`). Endpoint: `POST /api/ai/images`.
- Provider: OpenAI GPT Image via the official SDK (`OPENAI_API_KEY`,
  optional `IMAGE_MODEL`, default `gpt-image-1`), behind the `ImageProvider`
  interface in `src/lib/ai/`. Wide/tall images from fixed-size models are
  centre-cropped to exact 16:9 / 9:16 with `sharp`.
- Flow: verify session → validate → check credits (10 per image; 5 to
  regenerate one of your images via `{ sourceImageId }`) → generate →
  store in the private `user-uploads` bucket (`<user id>/images/…`) →
  `public.record_image_generation()` charges credits and records the
  generation and image atomically (file removed and nothing charged on
  failure). The browser only receives short-lived signed URLs.

## Templates

- `/templates`: searchable, category-filtered library. Templates are static
  data in `src/features/templates/data.ts` (same for every user, versioned
  with the code), so there is no database table.
- "Use Template" opens `/writer?template=<id>`; the writer resolves the id on
  the server and preselects content type, tone and instructions (editable).

## My Projects

- `/projects`: search by title, filter by type and status, sort by recently
  updated / newest / oldest (GET form, shareable URLs).
- `/projects/[id]`: edit title, content and status; copy; delete; and
  Regenerate for projects saved from the AI Writer (the validated brief is
  stored in `projects.brief`; regenerations are charged and linked to the
  project). Missing or foreign ids show "Project not found" in the app shell.
- All reads and writes run as the signed-in user (server-derived, never a
  client-sent `user_id`) and are enforced by RLS.

## Settings

- `/settings` (`src/features/settings`): profile (name, photo, email),
  preferences (default tone and language for the AI Writer), password,
  sessions (log out / log out of all devices), account deletion, plan,
  credits and credit history.
- All changes run as the signed-in user via Server Actions; RLS and column
  grants limit writes to the user's own profile row (`full_name`,
  `avatar_url`, `default_tone`, `default_language`).
- Photo: resized in the browser, then re-encoded on the server with `sharp`
  (256×256 WebP, metadata such as GPS removed) and stored privately in
  `<user id>/avatars/`; shown via signed URLs.
- Email and password changes require the current password. Email changes use
  Supabase Auth confirmation links (both addresses with "Secure email
  change"); `profiles.email` follows via a trigger once confirmed. A password
  change signs out other devices.
- Account deletion: password + typing `DELETE`. The app removes the user's
  storage files, then `public.delete_my_account()` deletes the auth user
  (everything else cascades). The function refuses unless the session signed
  in within the last 10 minutes. No service-role key is needed.
- Tests: `supabase/tests/account_test.sql`.

## Security

- **Auth & authorization:** every protected page, Server Action and API route
  verifies the user on the server (`src/lib/auth/dal.ts`); the proxy redirect
  is only a UX layer. The user id always comes from the session, never from
  the request. Row Level Security is enabled on every table, and API roles get
  only the privileges they need (no `TRUNCATE`, column-level `UPDATE`).
- **Credits:** only changed inside locked `security definer` functions (see
  Credits). Prices and limits live in the database.
- **Rate limits:** `public.hit_rate_limit()` caps AI requests per user (20
  text / 6 images per minute; limits are fixed in SQL). Supabase Auth limits
  sign-in, sign-up and email sending.
- **Input:** all request bodies and forms are validated on the server; AI
  endpoints accept JSON only (cross-site form posts get 415) and Server Actions
  check the Origin. Output is rendered as text (no `dangerouslySetInnerHTML`).
- **Headers** (`next.config.ts`): CSP (no framing, plugins or foreign form
  targets; network only to this site and Supabase), `X-Frame-Options`,
  `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS. Partial
  Prerendering rules out a nonce-based CSP, so inline scripts are allowed.
- **Secrets:** server-only modules (`server-only`), never `NEXT_PUBLIC_`;
  `.env*` is git-ignored.
- Tests: `supabase/tests/hardening_test.sql`.

## Authentication

- Email + password via Supabase Auth, with email confirmation and password reset.
- `src/proxy.ts` refreshes the session cookie on each request and redirects
  signed-out users away from protected routes (a UX layer only).
- `src/lib/auth/dal.ts` is the Data Access Layer: every protected page and
  Server Action verifies the user there, and Row Level Security in Postgres
  enforces data access.
- Email links land on `/auth/confirm`, which supports both Supabase's default
  (`?code=`) links and `token_hash` links from custom email templates.

## Development commands

| Command | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run typecheck` | Generate route types and run `tsc` |
| `npm run lint` | ESLint |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |

Run `typecheck`, `lint` and `build` before pushing; all three must pass.

## Project structure

```
src/
  app/                    Routes (App Router)
    (marketing)/          Landing page (+ internal /design-system gallery, noindex)
    (auth)/               Login, sign-up, forgot/reset password
    (app)/                Signed-in area: dashboard, writer, images, projects,
                          templates, settings
    api/ai/               POST /api/ai/generate, POST /api/ai/images
    api/health/           Liveness endpoint
    auth/confirm/         Email link handler
    robots.ts, sitemap.ts, opengraph-image.tsx
  components/ui/          Design-system primitives (Button, Card, Dialog, …)
  components/layout/      App shell, navigation, headers, footer
  features/<name>/        Feature modules: actions, queries, services,
                          validation and components (auth, writer, images,
                          projects, templates, settings, marketing)
  config/                 Site, navigation and credit display constants
  lib/
    ai/                   AI provider interfaces + Anthropic/OpenAI providers
    auth/                 Data Access Layer (current user, credits), redirects
    credits/              Server-side credit checks
    storage/              Private file helpers (signed URLs)
    supabase/             Supabase clients (browser, server, proxy, admin)
    env.ts, server-env.ts Environment access (public / server-only)
    rate-limit.ts         Per-user rate limits
  proxy.ts                Session refresh + route protection
  types/database.ts       Database types
supabase/
  migrations/             SQL migrations (run in order)
  tests/                  SQL tests (rolled back)
```

## Deployment (Vercel)

The project is connected to Vercel through GitHub: every push to the
production branch builds and deploys automatically.

First-time setup for a new Vercel project:

1. Vercel → **Add New → Project** → import `liibaan1257-del/creatorflow-ai`.
   The framework is detected as Next.js (`vercel.json` pins it).
2. **Settings → Environment Variables** (Production, and Preview if used):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` (mark the API keys **Sensitive**),
   optionally `NEXT_PUBLIC_APP_URL`. Paste values only, without quotes or
   backticks.
3. **Deploy**, then open `https://<your-app>/api/health`: it should return
   `{"status":"ok", "supabase":"ok"}`.
4. Add the production URL to Supabase Auth → URL Configuration (Site URL and
   Redirect URLs with `/**`).

After changing environment variables, **redeploy**: `NEXT_PUBLIC_*` values are
inlined at build time. Security headers (CSP, HSTS, …) are set in
`next.config.ts`.
