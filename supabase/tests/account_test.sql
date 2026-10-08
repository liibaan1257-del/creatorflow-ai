-- =============================================================================
-- Account settings test: profile updates, preferences, avatars, deletion.
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
  ('eeeeeeee-0000-4000-8000-00000000000e', 'account-test-e@example.invalid', 'authenticated', 'authenticated'),
  ('ffffffff-0000-4000-8000-00000000000f', 'account-test-f@example.invalid', 'authenticated', 'authenticated');
insert into public.projects (user_id, title) values ('eeeeeeee-0000-4000-8000-00000000000e', 'E project');

set local role authenticated;
-- Session signed in 30 minutes ago (too old to delete the account).
do $$ begin perform set_config('request.jwt.claims', json_build_object(
  'sub', 'eeeeeeee-0000-4000-8000-00000000000e', 'role', 'authenticated',
  'amr', json_build_array(json_build_object('method', 'password', 'timestamp', extract(epoch from now())::bigint - 1800))
)::text, true); end $$;

do $$
declare n integer;
begin
  -- Own profile: name, preferences, own avatar path.
  update public.profiles
  set full_name = 'Test E', default_tone = 'casual', default_language = 'Somali',
      avatar_url = 'eeeeeeee-0000-4000-8000-00000000000e/avatars/a.webp'
  where id = 'eeeeeeee-0000-4000-8000-00000000000e';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: user could not update own profile'; end if;

  -- Another user's profile: invisible to RLS, so nothing changes.
  update public.profiles set full_name = 'hacked' where id = 'ffffffff-0000-4000-8000-00000000000f';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: user updated another profile'; end if;
end $$;

do $$
begin
  update public.profiles set default_tone = 'angry' where id = 'eeeeeeee-0000-4000-8000-00000000000e';
  raise exception 'FAIL: invalid tone accepted';
exception when check_violation then null;
end $$;

do $$
begin
  update public.profiles set avatar_url = 'ffffffff-0000-4000-8000-00000000000f/avatars/x.webp'
  where id = 'eeeeeeee-0000-4000-8000-00000000000e';
  raise exception 'FAIL: avatar pointing at another user''s folder accepted';
exception when check_violation then null;
end $$;

do $$
begin
  update public.profiles set avatar_url = 'javascript:alert(1)' where id = 'eeeeeeee-0000-4000-8000-00000000000e';
  raise exception 'FAIL: non-https avatar URL accepted';
exception when check_violation then null;
end $$;

do $$
begin
  update public.profiles set email = 'x@example.invalid' where id = 'eeeeeeee-0000-4000-8000-00000000000e';
  raise exception 'FAIL: user changed profiles.email directly';
exception when insufficient_privilege then null;
end $$;

-- Deletion needs a recent sign-in.
do $$
begin
  perform public.delete_my_account();
  raise exception 'FAIL: account deleted with an old session';
exception when invalid_authorization_specification then
  if sqlerrm <> 'reauthentication_required' then raise; end if;
end $$;

-- Fresh sign-in: deletion works and cascades.
do $$ begin perform set_config('request.jwt.claims', json_build_object(
  'sub', 'eeeeeeee-0000-4000-8000-00000000000e', 'role', 'authenticated',
  'amr', json_build_array(json_build_object('method', 'password', 'timestamp', extract(epoch from now())::bigint - 30))
)::text, true); end $$;
do $$ begin perform public.delete_my_account(); end $$;

reset role;
do $$
begin
  if exists (select 1 from auth.users where id = 'eeeeeeee-0000-4000-8000-00000000000e')
    then raise exception 'FAIL: auth user not deleted'; end if;
  if exists (select 1 from public.profiles where id = 'eeeeeeee-0000-4000-8000-00000000000e')
     or exists (select 1 from public.projects where user_id = 'eeeeeeee-0000-4000-8000-00000000000e')
     or exists (select 1 from public.credits where user_id = 'eeeeeeee-0000-4000-8000-00000000000e')
     or exists (select 1 from public.credit_transactions where user_id = 'eeeeeeee-0000-4000-8000-00000000000e')
    then raise exception 'FAIL: user data not deleted'; end if;
  if not exists (select 1 from auth.users where id = 'ffffffff-0000-4000-8000-00000000000f')
    then raise exception 'FAIL: another user was deleted'; end if;
end $$;

-- anon can't call it.
set local role anon;
do $$
begin
  perform public.delete_my_account();
  raise exception 'FAIL: anon called delete_my_account';
exception when insufficient_privilege then null;
end $$;

rollback;
