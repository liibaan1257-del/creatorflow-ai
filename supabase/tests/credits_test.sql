-- =============================================================================
-- Credit system test.
--
-- Run in Supabase → SQL Editor AFTER all migrations. Everything runs inside a
-- transaction that is ROLLED BACK at the end: nothing is saved.
--
--   Success: "Success. No rows returned"
--   Failure: an error starting with "FAIL:".
-- =============================================================================

begin;

insert into auth.users (id, email, aud, role)
values
  ('cccccccc-0000-4000-8000-00000000000c', 'credit-test-c@example.invalid', 'authenticated', 'authenticated'),
  ('dddddddd-0000-4000-8000-00000000000d', 'credit-test-d@example.invalid', 'authenticated', 'authenticated');

-- Signup: Free allowance + ledger entry; prices.
do $$
begin
  if (select balance || '/' || monthly_limit from public.credits where user_id = 'cccccccc-0000-4000-8000-00000000000c') <> '100/100'
    then raise exception 'FAIL: new user did not receive 100 credits'; end if;
  if (select count(*) from public.credit_transactions where user_id = 'cccccccc-0000-4000-8000-00000000000c' and reason = 'signup_grant' and amount = 100) <> 1
    then raise exception 'FAIL: signup grant not recorded'; end if;
  if public.generation_cost('blog_post') <> 5 or public.generation_cost('seo_title') <> 5
     or public.generation_cost('image') <> 10 or public.generation_cost('regeneration') <> 5
     or public.generation_cost('image_regeneration') <> 5 or public.generation_cost('nope') is not null
    then raise exception 'FAIL: wrong prices'; end if;
end $$;


-- ---------------------------------------------------------------------------
-- As user C
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-4000-8000-00000000000c","role":"authenticated"}', true);

do $$
declare r record;
begin
  -- Writer 5, regeneration 5, image 10, image regeneration 5.
  select * into r from public.record_generation('blog_post', 'p', 'out');
  if r.credits_used <> 5 or r.balance <> 95 then raise exception 'FAIL: writer charge %', r; end if;
  select * into r from public.record_generation('seo_title', 'p', 'out', null, true);
  if r.credits_used <> 5 or r.balance <> 90 then raise exception 'FAIL: regeneration charge %', r; end if;
  select * into r from public.record_image_generation('p', 'cccccccc-0000-4000-8000-00000000000c/images/a.webp', 'realistic', '1:1', 1024, 1024, 'm');
  if r.credits_used <> 10 or r.balance <> 80 then raise exception 'FAIL: image charge %', r; end if;
  select * into r from public.record_image_generation('p', 'cccccccc-0000-4000-8000-00000000000c/images/b.webp', 'realistic', '1:1', 1024, 1024, 'm', r.image_id);
  if r.credits_used <> 5 or r.balance <> 75 then raise exception 'FAIL: image regeneration charge %', r; end if;

  if (select string_agg(reason || ':' || amount || ':' || balance_after, ',' order by balance_after desc)
      from public.credit_transactions where reason <> 'signup_grant')
     <> 'generation:-5:95,regeneration:-5:90,image:-10:80,image_regeneration:-5:75'
    then raise exception 'FAIL: ledger rows wrong'; end if;
  if exists (select 1 from public.credit_transactions t where t.reason <> 'signup_grant' and t.generation_id is null)
    then raise exception 'FAIL: ledger rows not linked to generations'; end if;

  select * into r from public.get_my_credits();
  if r.balance <> 75 or r.plan <> 'free' or r.plan_name <> 'Free' then raise exception 'FAIL: get_my_credits %', r; end if;
end $$;

-- Regenerating someone else's (or a made-up) image is refused.
do $$
begin
  perform public.record_image_generation('p', 'cccccccc-0000-4000-8000-00000000000c/images/c.webp', 'realistic', '1:1', 1, 1, 'm', gen_random_uuid());
  raise exception 'FAIL: regenerated an unknown image';
exception when invalid_parameter_value then null;
end $$;

-- Users cannot write credits, the ledger or plans, nor call internal functions.
do $$
declare n integer;
begin
  update public.credits set balance = 999999; get diagnostics n = row_count;
  raise exception 'FAIL: user updated credits (% rows)', n;
exception when insufficient_privilege then null;
end $$;
do $$
begin
  insert into public.credit_transactions (user_id, amount, balance_after, reason)
  values ('cccccccc-0000-4000-8000-00000000000c', 1000, 1000, 'adjustment');
  raise exception 'FAIL: user wrote the ledger';
exception when insufficient_privilege then null;
end $$;
do $$
begin
  update public.plans set monthly_credits = 1000000;
  raise exception 'FAIL: user changed a plan';
exception when insufficient_privilege then null;
end $$;
do $$
declare fn text;
begin
  foreach fn in array array[
    'select public._spend_credits(''cccccccc-0000-4000-8000-00000000000c'', -500, ''adjustment'', null)',
    'select public._lock_credits(''cccccccc-0000-4000-8000-00000000000c'')',
    'select public.apply_plan_change(''cccccccc-0000-4000-8000-00000000000c'', ''business'')',
    'select public.reset_due_credits()'
  ] loop
    begin
      execute fn;
      raise exception 'FAIL: user could run %', fn;
    exception when insufficient_privilege then null;
    end;
  end loop;
end $$;

-- Users only see their own ledger.
do $$
begin
  if exists (select 1 from public.credit_transactions where user_id <> 'cccccccc-0000-4000-8000-00000000000c')
    then raise exception 'FAIL: user sees another user''s ledger'; end if;
end $$;

-- Insufficient credits: refused, nothing recorded, balance never negative.
reset role;
update public.credits set balance = 4 where user_id = 'cccccccc-0000-4000-8000-00000000000c';
set local role authenticated;
do $$
declare n integer;
begin
  select count(*) into n from public.generations;
  begin
    perform public.record_generation('seo_title', 'p', 'out');
    raise exception 'FAIL: generation allowed with 4 credits';
  exception when raise_exception then
    if sqlerrm <> 'insufficient_credits' then raise; end if;
  end;
  if (select count(*) from public.generations) <> n then raise exception 'FAIL: refused generation was recorded'; end if;
  if (select balance from public.credits) <> 4 then raise exception 'FAIL: balance changed on refusal'; end if;
end $$;


-- ---------------------------------------------------------------------------
-- Monthly reset, plan changes (service role / admin)
-- ---------------------------------------------------------------------------
reset role;

-- Lazy reset after three missed months: balance = allowance, reset day kept.
update public.credits
set balance = 7, reset_date = now() - interval '2 months 3 days'
where user_id = 'cccccccc-0000-4000-8000-00000000000c';
set local role authenticated;
do $$
declare r record;
begin
  select * into r from public.get_my_credits();
  if r.balance <> 100 then raise exception 'FAIL: reset balance %', r.balance; end if;
  if r.reset_date <= now() or r.reset_date > now() + interval '1 month' then raise exception 'FAIL: next reset %', r.reset_date; end if;
  if (select count(*) from public.credit_transactions where reason = 'monthly_reset' and amount = 93 and balance_after = 100) <> 1
    then raise exception 'FAIL: reset not recorded'; end if;
  -- A second read does not reset again.
  perform public.get_my_credits();
  if (select count(*) from public.credit_transactions where reason = 'monthly_reset') <> 1
    then raise exception 'FAIL: reset applied twice'; end if;
end $$;

reset role;
set local role service_role;
do $$
declare v integer;
begin
  -- Upgrade: the allowance difference is added now.
  v := public.apply_plan_change('dddddddd-0000-4000-8000-00000000000d', 'pro');
  if v <> 1000 then raise exception 'FAIL: upgrade balance %', v; end if;
  v := public.apply_plan_change('dddddddd-0000-4000-8000-00000000000d', 'business');
  if v <> 5000 then raise exception 'FAIL: business balance %', v; end if;
  -- Downgrade: capped at the new allowance.
  v := public.apply_plan_change('dddddddd-0000-4000-8000-00000000000d', 'free');
  if v <> 100 then raise exception 'FAIL: downgrade balance %', v; end if;
  begin
    perform public.apply_plan_change('dddddddd-0000-4000-8000-00000000000d', 'platinum');
    raise exception 'FAIL: unknown plan accepted';
  exception when invalid_parameter_value then null;
  end;
end $$;
reset role;

-- An expired Pro plan resets to the Free allowance.
select public.apply_plan_change('dddddddd-0000-4000-8000-00000000000d', 'pro', 'active', now() + interval '1 hour');
update public.subscriptions set started_at = now() - interval '1 month', expires_at = now() - interval '1 minute' where user_id = 'dddddddd-0000-4000-8000-00000000000d';
update public.credits set reset_date = now() - interval '1 minute' where user_id = 'dddddddd-0000-4000-8000-00000000000d';
do $$
declare n integer;
begin
  n := public.reset_due_credits();
  if n < 1 then raise exception 'FAIL: reset_due_credits found nothing'; end if;
  if (select balance || '/' || monthly_limit from public.credits where user_id = 'dddddddd-0000-4000-8000-00000000000d') <> '100/100'
    then raise exception 'FAIL: expired pro did not fall back to free'; end if;
end $$;

-- Database constraints are the last line of defence.
do $$
begin
  update public.credits set balance = -1 where user_id = 'dddddddd-0000-4000-8000-00000000000d';
  raise exception 'FAIL: negative balance accepted';
exception when check_violation then null;
end $$;

-- anon can read plans, nothing else.
set local role anon;
do $$
begin
  if (select string_agg(id || '=' || monthly_credits, ',' order by sort_order) from public.plans) <> 'free=100,pro=1000,business=5000'
    then raise exception 'FAIL: anon cannot read plans'; end if;
  begin
    perform 1 from public.credit_transactions;
    raise exception 'FAIL: anon read the ledger';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.get_my_credits();
    raise exception 'FAIL: anon called get_my_credits';
  exception when insufficient_privilege then null;
  end;
end $$;

rollback;
