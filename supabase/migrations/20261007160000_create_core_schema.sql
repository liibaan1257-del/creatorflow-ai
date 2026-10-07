-- =============================================================================
-- CreatorFlow AI — core application schema
--
-- Tables: profiles (extended), projects, generations, generated_images,
--         credits, subscriptions
--
-- Security model (Row Level Security on every table):
--   * Users can only ever see rows where user_id = auth.uid().
--   * projects:        full CRUD on own rows.
--   * generations,
--     generated_images: read + delete own rows. Rows are written by trusted
--                       server code (together with the credit deduction).
--   * credits,
--     subscriptions:   read-only for users. Only trusted server code
--                       (service role / security definer functions) writes,
--                       so users can never grant themselves credits or plans.
--   * anon (signed-out visitors) has no access to any of these tables.
--
-- Requires: 20261007120000_create_profiles.sql (profiles, set_updated_at()).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- profiles: add email (kept in sync with auth.users by triggers below)
-- -----------------------------------------------------------------------------
alter table public.profiles add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is distinct from u.email;

create index if not exists profiles_email_idx on public.profiles (lower(email));

revoke all on public.profiles from anon;


-- -----------------------------------------------------------------------------
-- projects: a piece of content the user is working on
-- -----------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  type text not null default 'blog_post'
    check (type in ('blog_post', 'video_script', 'social_caption', 'image', 'other')),
  content text not null default '' check (char_length(content) <= 200000),
  status text not null default 'draft'
    check (status in ('draft', 'in_progress', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Lets child tables reference (id, user_id) so a row can only point at a
  -- project owned by the same user.
  unique (id, user_id)
);

comment on table public.projects is 'User content projects (blog posts, scripts, captions, ...).';

create index projects_user_id_updated_at_idx on public.projects (user_id, updated_at desc);
create index projects_user_id_status_idx on public.projects (user_id, status);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

alter table public.projects enable row level security;

create policy "Users can view their own projects"
  on public.projects for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own projects"
  on public.projects for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own projects"
  on public.projects for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own projects"
  on public.projects for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.projects from anon;
-- Only content fields are editable; id, owner and timestamps are not.
revoke update on public.projects from authenticated;
grant update (title, type, content, status) on public.projects to authenticated;


-- -----------------------------------------------------------------------------
-- generations: history of AI text generations
-- -----------------------------------------------------------------------------
create table public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid,
  prompt text not null check (char_length(prompt) between 1 and 20000),
  output text,
  type text not null
    check (type in ('blog_post', 'video_script', 'social_caption', 'other')),
  credits_used integer not null default 0 check (credits_used >= 0),
  created_at timestamptz not null default now(),
  -- The project (if any) must belong to the same user. Deleting the project
  -- keeps the history but clears the link.
  foreign key (project_id, user_id)
    references public.projects (id, user_id)
    on delete set null (project_id)
);

comment on table public.generations is 'AI text generation history. Written by trusted server code only.';

create index generations_user_id_created_at_idx on public.generations (user_id, created_at desc);
create index generations_project_id_idx on public.generations (project_id) where project_id is not null;

alter table public.generations enable row level security;

create policy "Users can view their own generations"
  on public.generations for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can delete their own generations"
  on public.generations for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.generations from anon;
revoke insert, update on public.generations from authenticated;


-- -----------------------------------------------------------------------------
-- generated_images: AI images (files live in the private user-uploads bucket)
-- -----------------------------------------------------------------------------
create table public.generated_images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid,
  prompt text not null check (char_length(prompt) between 1 and 4000),
  -- Storage object path ("<user id>/<file>") or URL of the image.
  image_url text not null check (char_length(image_url) between 1 and 2048),
  created_at timestamptz not null default now(),
  foreign key (project_id, user_id)
    references public.projects (id, user_id)
    on delete set null (project_id)
);

comment on table public.generated_images is 'AI image generation history. Written by trusted server code only.';

create index generated_images_user_id_created_at_idx on public.generated_images (user_id, created_at desc);
create index generated_images_project_id_idx on public.generated_images (project_id) where project_id is not null;

alter table public.generated_images enable row level security;

create policy "Users can view their own images"
  on public.generated_images for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can delete their own images"
  on public.generated_images for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.generated_images from anon;
revoke insert, update on public.generated_images from authenticated;


-- -----------------------------------------------------------------------------
-- credits: one balance row per user
-- -----------------------------------------------------------------------------
create table public.credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  -- Free plan allowance; change the default here when pricing is final.
  monthly_limit integer not null default 20 check (monthly_limit >= 0),
  reset_date timestamptz not null default (now() + interval '1 month'),
  updated_at timestamptz not null default now()
);

comment on table public.credits is 'Credit balance per user. Read-only for users; written by trusted server code.';

create trigger credits_set_updated_at
  before update on public.credits
  for each row execute function public.set_updated_at();

alter table public.credits enable row level security;

create policy "Users can view their own credits"
  on public.credits for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.credits from anon;
revoke insert, update, delete on public.credits from authenticated;


-- -----------------------------------------------------------------------------
-- subscriptions: one current plan per user
-- -----------------------------------------------------------------------------
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro', 'business')),
  status text not null default 'active'
    check (status in ('active', 'trialing', 'past_due', 'canceled', 'expired')),
  started_at timestamptz not null default now(),
  -- null = no end date (e.g. the free plan).
  expires_at timestamptz,
  updated_at timestamptz not null default now(),
  check (expires_at is null or expires_at > started_at)
);

comment on table public.subscriptions is 'Current plan per user. Read-only for users; written by trusted server code (e.g. payment webhooks).';

create index subscriptions_status_expires_at_idx on public.subscriptions (status, expires_at);

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

alter table public.subscriptions enable row level security;

create policy "Users can view their own subscription"
  on public.subscriptions for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.subscriptions from anon;
revoke insert, update, delete on public.subscriptions from authenticated;


-- -----------------------------------------------------------------------------
-- New users: profile + credits + free subscription, created atomically.
-- security definer: runs as the owner because the signing-up user has no
-- write access to these tables. search_path is pinned for safety.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  free_monthly_credits constant integer := 20;
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    nullif(left(trim(new.raw_user_meta_data ->> 'full_name'), 100), ''),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.credits (user_id, balance, monthly_limit)
  values (new.id, free_monthly_credits, free_monthly_credits)
  on conflict (user_id) do nothing;

  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Keep profiles.email in sync when a user changes their email.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- Trigger functions are not meant to be called directly via the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_user_email_change() from public, anon, authenticated;


-- -----------------------------------------------------------------------------
-- Existing users (created before this migration) get their credits and free
-- subscription rows. Real accounts only; no sample data is created.
-- -----------------------------------------------------------------------------
insert into public.credits (user_id, balance, monthly_limit)
select u.id, 20, 20 from auth.users u
on conflict (user_id) do nothing;

insert into public.subscriptions (user_id, plan, status)
select u.id, 'free', 'active' from auth.users u
on conflict (user_id) do nothing;
