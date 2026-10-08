-- =============================================================================
-- Production hardening: least-privilege grants, missing indexes, a lock-free
-- credits read, and per-user rate limits for the AI endpoints.
--
-- Safe to run more than once.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Least privilege. Supabase grants ALL on new tables to anon/authenticated;
-- RLS already blocks rows, but TRUNCATE bypasses RLS, so remove what the API
-- roles never need.
-- -----------------------------------------------------------------------------
revoke truncate, trigger, references on all tables in schema public from anon, authenticated;
-- Profiles are created by the signup trigger and removed with the account.
revoke insert, delete on public.profiles from anon, authenticated;

-- Same defaults for tables created later by this role.
alter default privileges in schema public revoke truncate, trigger, references on tables from anon, authenticated;


-- -----------------------------------------------------------------------------
-- Indexes for foreign keys used by ON DELETE SET NULL (deleting a generation).
-- -----------------------------------------------------------------------------
create index if not exists credit_transactions_generation_id_idx
  on public.credit_transactions (generation_id) where generation_id is not null;
create index if not exists generated_images_generation_id_idx
  on public.generated_images (generation_id) where generation_id is not null;


-- -----------------------------------------------------------------------------
-- get_my_credits: plain read; lock the row only when a monthly reset is due.
-- Every page render shows the balance, so this avoids a row lock per request.
-- -----------------------------------------------------------------------------
create or replace function public.get_my_credits()
returns table (balance integer, monthly_limit integer, reset_date timestamptz, plan text, plan_name text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  r public.credits;
  v_plan text;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into r from public.credits c where c.user_id = v_user;
  if not found or r.reset_date <= now() then
    r := public._lock_credits(v_user);
  end if;

  v_plan := public._effective_plan(v_user);
  return query
    select r.balance, r.monthly_limit, r.reset_date, v_plan, (select p.name from public.plans p where p.id = v_plan);
end;
$$;


-- -----------------------------------------------------------------------------
-- Rate limits: fixed-window counters per user and action. Limits live here
-- (not in the call) so a client calling the RPC directly can't loosen them.
-- -----------------------------------------------------------------------------
create table if not exists public.rate_limits (
  user_id uuid not null references auth.users (id) on delete cascade,
  bucket text not null,
  window_start timestamptz not null,
  hits integer not null check (hits > 0),
  primary key (user_id, bucket)
);

comment on table public.rate_limits is 'Per-user request counters. Only written by public.hit_rate_limit().';

alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;

-- Records one request. Returns 0 when allowed, otherwise the seconds to wait.
create or replace function public.hit_rate_limit(p_bucket text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_limit integer;
  v_window integer;
  r public.rate_limits;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select l.max_hits, l.window_seconds into v_limit, v_window
  from (values
    ('ai_writer', 20, 60),   -- 20 text generations per minute
    ('ai_image', 6, 60)      -- 6 images per minute
  ) as l (bucket, max_hits, window_seconds)
  where l.bucket = p_bucket;

  if v_limit is null then
    raise exception 'unknown_rate_limit_bucket' using errcode = '22023';
  end if;

  insert into public.rate_limits as rl (user_id, bucket, window_start, hits)
  values (v_user, p_bucket, now(), 1)
  on conflict (user_id, bucket) do update
    set window_start = case when rl.window_start + make_interval(secs => v_window) <= now() then now() else rl.window_start end,
        hits = case when rl.window_start + make_interval(secs => v_window) <= now() then 1 else rl.hits + 1 end
  returning * into r;

  if r.hits > v_limit then
    return greatest(1, ceil(extract(epoch from (r.window_start + make_interval(secs => v_window) - now())))::integer);
  end if;
  return 0;
end;
$$;

revoke execute on function public.hit_rate_limit(text) from public, anon;
grant execute on function public.hit_rate_limit(text) to authenticated;
