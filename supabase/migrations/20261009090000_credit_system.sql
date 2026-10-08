-- =============================================================================
-- Credit system: plans, a credit ledger, monthly resets and one shared,
-- race-free spending path.
--
-- Plans (monthly allowance):  free 100 · pro 1,000 · business 5,000
-- Costs:                      AI Writer 5 · AI Image 10 · Regeneration 5
--
-- Guarantees
--   * Every change to a balance happens inside a security definer function
--     that first locks the user's credits row (SELECT … FOR UPDATE). Two
--     concurrent requests are serialised, so the balance can never be spent
--     twice; the CHECK (balance >= 0) is a final safety net.
--   * The monthly reset runs lazily under that same lock (on the first read or
--     spend after reset_date), so a reset can't race a spend. reset_due_credits()
--     does the same for all due users and can run on a schedule (pg_cron).
--   * Unused credits do not roll over: a reset sets the balance to the
--     allowance of the user's effective plan (expired paid plans fall back to
--     free).
--   * Users can read their own credits and ledger but never write them.
--     Plan changes go through apply_plan_change(), callable only with the
--     service role (for a future payment webhook).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Plans: the public plan catalogue
-- -----------------------------------------------------------------------------
create table if not exists public.plans (
  id text primary key check (id in ('free', 'pro', 'business')),
  name text not null,
  monthly_credits integer not null check (monthly_credits >= 0),
  sort_order integer not null default 0
);

insert into public.plans (id, name, monthly_credits, sort_order) values
  ('free', 'Free', 100, 0),
  ('pro', 'Pro', 1000, 1),
  ('business', 'Business', 5000, 2)
on conflict (id) do update
  set name = excluded.name, monthly_credits = excluded.monthly_credits, sort_order = excluded.sort_order;

alter table public.plans enable row level security;
drop policy if exists "Anyone can read plans" on public.plans;
create policy "Anyone can read plans" on public.plans for select to anon, authenticated using (true);
revoke insert, update, delete on public.plans from anon, authenticated;

alter table public.subscriptions drop constraint if exists subscriptions_plan_fkey;
alter table public.subscriptions
  add constraint subscriptions_plan_fkey foreign key (plan) references public.plans (id);

alter table public.credits alter column monthly_limit set default 100;


-- -----------------------------------------------------------------------------
-- Ledger: one row per balance change
-- -----------------------------------------------------------------------------
create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Negative = spent, positive = granted.
  amount integer not null check (amount <> 0),
  balance_after integer not null check (balance_after >= 0),
  reason text not null check (reason in (
    'signup_grant', 'monthly_reset', 'generation', 'regeneration',
    'image', 'image_regeneration', 'plan_change', 'adjustment'
  )),
  generation_id uuid references public.generations (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.credit_transactions is 'Credit ledger. Read-only for users; written only by credit functions.';

create index if not exists credit_transactions_user_id_created_at_idx
  on public.credit_transactions (user_id, created_at desc);

alter table public.credit_transactions enable row level security;
drop policy if exists "Users can view their own credit history" on public.credit_transactions;
create policy "Users can view their own credit history"
  on public.credit_transactions for select to authenticated
  using ((select auth.uid()) = user_id);
revoke all on public.credit_transactions from anon;
revoke insert, update, delete on public.credit_transactions from authenticated;


-- -----------------------------------------------------------------------------
-- Prices (single source of truth; the app only displays them)
-- -----------------------------------------------------------------------------
create or replace function public.generation_cost(p_type text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case
    when p_type in (
      'blog_post', 'blog_outline', 'social_post', 'youtube_title', 'youtube_description',
      'youtube_script', 'seo_title', 'meta_description', 'product_description'
    ) then 5
    when p_type = 'regeneration' then 5
    when p_type = 'image' then 10
    when p_type = 'image_regeneration' then 5
    else null
  end;
$$;


-- -----------------------------------------------------------------------------
-- Internal helpers (not callable through the API)
-- -----------------------------------------------------------------------------

-- The plan that currently applies: an active/trialing, unexpired subscription,
-- otherwise free.
create or replace function public._effective_plan(p_user uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select s.plan from public.subscriptions s
      where s.user_id = p_user
        and s.status in ('active', 'trialing')
        and (s.expires_at is null or s.expires_at > now())),
    'free'
  );
$$;

-- Locks the user's credits row and applies a due monthly reset. Every other
-- credit function goes through here, so resets and spends are serialised.
create or replace function public._lock_credits(p_user uuid)
returns public.credits
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.credits;
  v_allowance integer;
  v_next timestamptz;
begin
  select * into r from public.credits where user_id = p_user for update;

  if not found then
    -- Self-heal a missing row (normally created by the signup trigger).
    select p.monthly_credits into v_allowance from public.plans p where p.id = public._effective_plan(p_user);
    insert into public.credits (user_id, balance, monthly_limit, reset_date)
    values (p_user, v_allowance, v_allowance, now() + interval '1 month')
    on conflict (user_id) do nothing;
    select * into r from public.credits where user_id = p_user for update;
    if v_allowance > 0 then
      insert into public.credit_transactions (user_id, amount, balance_after, reason)
      values (p_user, v_allowance, r.balance, 'signup_grant');
    end if;
  end if;

  if r.reset_date <= now() then
    select p.monthly_credits into v_allowance from public.plans p where p.id = public._effective_plan(p_user);
    -- Advance in whole months so the reset day stays stable, even after
    -- several inactive months.
    v_next := r.reset_date;
    while v_next <= now() loop
      v_next := v_next + interval '1 month';
    end loop;

    if v_allowance <> r.balance then
      insert into public.credit_transactions (user_id, amount, balance_after, reason)
      values (p_user, v_allowance - r.balance, v_allowance, 'monthly_reset');
    end if;

    update public.credits
    set balance = v_allowance, monthly_limit = v_allowance, reset_date = v_next
    where user_id = p_user
    returning * into r;
  end if;

  return r;
end;
$$;

-- Spends credits atomically or raises insufficient_credits. Returns the new balance.
create or replace function public._spend_credits(
  p_user uuid,
  p_amount integer,
  p_reason text,
  p_generation uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.credits;
  v_balance integer;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'invalid_amount' using errcode = '22023';
  end if;

  r := public._lock_credits(p_user);
  if r.balance < p_amount then
    raise exception 'insufficient_credits' using errcode = 'P0001';
  end if;

  update public.credits set balance = balance - p_amount
  where user_id = p_user
  returning balance into v_balance;

  insert into public.credit_transactions (user_id, amount, balance_after, reason, generation_id)
  values (p_user, -p_amount, v_balance, p_reason, p_generation);

  return v_balance;
end;
$$;

revoke execute on function public._effective_plan(uuid) from public, anon, authenticated;
revoke execute on function public._lock_credits(uuid) from public, anon, authenticated;
revoke execute on function public._spend_credits(uuid, integer, text, uuid) from public, anon, authenticated;


-- -----------------------------------------------------------------------------
-- API functions for signed-in users
-- -----------------------------------------------------------------------------

-- Current balance (applying a due monthly reset) and plan.
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
  r := public._lock_credits(v_user);
  v_plan := public._effective_plan(v_user);
  return query
    select r.balance, r.monthly_limit, r.reset_date, v_plan, (select p.name from public.plans p where p.id = v_plan);
end;
$$;

-- Text generation: charge + record in one transaction.
drop function if exists public.record_generation(text, text, text, uuid);
create or replace function public.record_generation(
  p_type text,
  p_prompt text,
  p_output text,
  p_project_id uuid default null,
  p_is_regeneration boolean default false
)
returns table (generation_id uuid, credits_used integer, balance integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_cost integer;
  v_id uuid;
  v_balance integer;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if public.generation_cost(p_type) is null or p_type = 'image' then
    raise exception 'invalid_generation_type' using errcode = '22023';
  end if;
  if coalesce(char_length(p_output), 0) = 0 then
    raise exception 'empty_output' using errcode = '22023';
  end if;

  v_cost := public.generation_cost(case when p_is_regeneration then 'regeneration' else p_type end);

  -- The insert and the charge share one transaction: if the charge fails,
  -- the generation row is rolled back too.
  insert into public.generations (user_id, project_id, prompt, output, type, credits_used)
  values (v_user, p_project_id, p_prompt, p_output, p_type, v_cost)
  returning id into v_id;

  v_balance := public._spend_credits(v_user, v_cost, case when p_is_regeneration then 'regeneration' else 'generation' end, v_id);

  return query select v_id, v_cost, v_balance;
end;
$$;

-- Image generation: charge + record generation and image in one transaction.
-- A regeneration must name one of the caller's existing images.
drop function if exists public.record_image_generation(text, text, text, text, integer, integer, text);
create or replace function public.record_image_generation(
  p_prompt text,
  p_image_path text,
  p_style text,
  p_aspect_ratio text,
  p_width integer,
  p_height integer,
  p_model text,
  p_source_image_id uuid default null
)
returns table (image_id uuid, generation_id uuid, credits_used integer, balance integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_regen boolean := p_source_image_id is not null;
  v_cost integer;
  v_generation uuid;
  v_image uuid;
  v_balance integer;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_image_path is null or p_image_path not like v_user::text || '/images/%' or p_image_path like '%..%' then
    raise exception 'invalid_image_path' using errcode = '22023';
  end if;
  if v_regen and not exists (
    select 1 from public.generated_images i where i.id = p_source_image_id and i.user_id = v_user
  ) then
    raise exception 'invalid_source_image' using errcode = '22023';
  end if;

  v_cost := public.generation_cost(case when v_regen then 'image_regeneration' else 'image' end);

  insert into public.generations (user_id, prompt, output, type, credits_used)
  values (v_user, p_prompt, p_image_path, 'image', v_cost)
  returning id into v_generation;

  insert into public.generated_images
    (user_id, prompt, image_url, generation_id, style, aspect_ratio, width, height, model)
  values
    (v_user, p_prompt, p_image_path, v_generation, p_style, p_aspect_ratio, p_width, p_height, p_model)
  returning id into v_image;

  v_balance := public._spend_credits(v_user, v_cost, case when v_regen then 'image_regeneration' else 'image' end, v_generation);

  return query select v_image, v_generation, v_cost, v_balance;
end;
$$;

revoke execute on function public.get_my_credits() from public, anon;
grant execute on function public.get_my_credits() to authenticated;
revoke execute on function public.record_generation(text, text, text, uuid, boolean) from public, anon;
grant execute on function public.record_generation(text, text, text, uuid, boolean) to authenticated;
revoke execute on function public.record_image_generation(text, text, text, text, integer, integer, text, uuid) from public, anon;
grant execute on function public.record_image_generation(text, text, text, text, integer, integer, text, uuid) to authenticated;
grant execute on function public.generation_cost(text) to authenticated;


-- -----------------------------------------------------------------------------
-- Service-role functions (scheduled jobs and the future payment webhook)
-- -----------------------------------------------------------------------------

-- Applies due monthly resets for every user. Safe to run often (idempotent).
-- Example schedule with pg_cron:
--   select cron.schedule('reset-credits', '15 * * * *', 'select public.reset_due_credits()');
create or replace function public.reset_due_credits()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_count integer := 0;
begin
  for v_user in select c.user_id from public.credits c where c.reset_date <= now() loop
    perform public._lock_credits(v_user);
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- Sets a user's plan (e.g. from a payment webhook) and adjusts credits:
-- an upgrade adds the allowance difference now; a downgrade caps the balance
-- at the new allowance. Future resets use the new plan.
create or replace function public.apply_plan_change(
  p_user uuid,
  p_plan text,
  p_status text default 'active',
  p_expires_at timestamptz default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.credits;
  v_old integer;
  v_new integer;
  v_balance integer;
begin
  if not exists (select 1 from public.plans where id = p_plan) then
    raise exception 'invalid_plan' using errcode = '22023';
  end if;

  r := public._lock_credits(p_user);
  v_old := r.monthly_limit;

  insert into public.subscriptions (user_id, plan, status, started_at, expires_at)
  values (p_user, p_plan, p_status, now(), p_expires_at)
  on conflict (user_id) do update
    set plan = excluded.plan, status = excluded.status, started_at = now(), expires_at = excluded.expires_at;

  select p.monthly_credits into v_new from public.plans p where p.id = public._effective_plan(p_user);

  v_balance := case when v_new > v_old then r.balance + (v_new - v_old) else least(r.balance, v_new) end;
  update public.credits set monthly_limit = v_new, balance = v_balance where user_id = p_user;

  if v_balance <> r.balance then
    insert into public.credit_transactions (user_id, amount, balance_after, reason)
    values (p_user, v_balance - r.balance, v_balance, 'plan_change');
  end if;

  return v_balance;
end;
$$;

revoke execute on function public.reset_due_credits() from public, anon, authenticated;
revoke execute on function public.apply_plan_change(uuid, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.reset_due_credits() to service_role;
grant execute on function public.apply_plan_change(uuid, text, text, timestamptz) to service_role;


-- -----------------------------------------------------------------------------
-- Signup: Free plan allowance + ledger entry
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_allowance integer;
begin
  select p.monthly_credits into v_allowance from public.plans p where p.id = 'free';

  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    nullif(left(trim(new.raw_user_meta_data ->> 'full_name'), 100), ''),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active')
  on conflict (user_id) do nothing;

  insert into public.credits (user_id, balance, monthly_limit, reset_date)
  values (new.id, v_allowance, v_allowance, now() + interval '1 month')
  on conflict (user_id) do nothing;

  if found and v_allowance > 0 then
    insert into public.credit_transactions (user_id, amount, balance_after, reason)
    values (new.id, v_allowance, v_allowance, 'signup_grant');
  end if;

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;


-- -----------------------------------------------------------------------------
-- Existing users: move to the new allowance (free 20 → 100). The difference
-- is granted now and recorded in the ledger.
-- -----------------------------------------------------------------------------
with before as (
  select c.user_id, p.monthly_credits - c.monthly_limit as delta
  from public.credits c
  join public.plans p on p.id = public._effective_plan(c.user_id)
  where p.monthly_credits > c.monthly_limit
),
changed as (
  update public.credits c
  set balance = c.balance + b.delta,
      monthly_limit = c.monthly_limit + b.delta,
      updated_at = now()
  from before b
  where c.user_id = b.user_id
  returning c.user_id, b.delta, c.balance
)
insert into public.credit_transactions (user_id, amount, balance_after, reason)
select user_id, delta, balance, 'adjustment'
from changed;
