-- =============================================================================
-- Row Level Security test for the CreatorFlow AI schema.
--
-- Run in Supabase → SQL Editor AFTER all migrations. Everything runs inside a
-- transaction that is ROLLED BACK at the end: the two test users and their
-- rows are never saved.
--
--   Success: "Success. No rows returned"
--   Failure: an error starting with "FAIL:" describing what leaked.
-- =============================================================================

begin;

-- Two throwaway users (rolled back). The signup trigger creates their
-- profile, credits and free subscription.
insert into auth.users (id, email, raw_user_meta_data, aud, role)
values
  ('aaaaaaaa-0000-4000-8000-00000000000a', 'rls-test-a@example.invalid', '{"full_name":"User A"}', 'authenticated', 'authenticated'),
  ('bbbbbbbb-0000-4000-8000-00000000000b', 'rls-test-b@example.invalid', '{"full_name":"User B"}', 'authenticated', 'authenticated');

-- Data owned by user B (created with admin rights).
insert into public.projects (id, user_id, title, type)
values ('bbbbbbbb-1111-4000-8000-00000000000b', 'bbbbbbbb-0000-4000-8000-00000000000b', 'B project', 'blog_post');
insert into public.generations (user_id, project_id, prompt, output, type, credits_used)
values ('bbbbbbbb-0000-4000-8000-00000000000b', 'bbbbbbbb-1111-4000-8000-00000000000b', 'B prompt', 'B output', 'blog_post', 2);
insert into public.generated_images (user_id, prompt, image_url)
values ('bbbbbbbb-0000-4000-8000-00000000000b', 'B image', 'bbbbbbbb-0000-4000-8000-00000000000b/x.png');

-- Signup trigger sanity checks.
do $$
begin
  if (select count(*) from public.profiles where id in ('aaaaaaaa-0000-4000-8000-00000000000a', 'bbbbbbbb-0000-4000-8000-00000000000b')) <> 2
    then raise exception 'FAIL: signup trigger did not create profiles'; end if;
  if (select email from public.profiles where id = 'aaaaaaaa-0000-4000-8000-00000000000a') <> 'rls-test-a@example.invalid'
    then raise exception 'FAIL: profile email not set'; end if;
  if (select count(*) from public.credits where user_id = 'aaaaaaaa-0000-4000-8000-00000000000a' and balance > 0) <> 1
    then raise exception 'FAIL: signup trigger did not create credits'; end if;
  if (select plan from public.subscriptions where user_id = 'aaaaaaaa-0000-4000-8000-00000000000a') <> 'free'
    then raise exception 'FAIL: signup trigger did not create a free subscription'; end if;
end $$;

-- A generation cannot link to a project owned by someone else.
do $$
begin
  insert into public.generations (user_id, project_id, prompt, type)
  values ('aaaaaaaa-0000-4000-8000-00000000000a', 'bbbbbbbb-1111-4000-8000-00000000000b', 'x', 'other');
  raise exception 'FAIL: generation linked to another user''s project';
exception when foreign_key_violation then null;
end $$;


-- ---------------------------------------------------------------------------
-- Act as user A
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-4000-8000-00000000000a","role":"authenticated"}', true);

-- profiles
do $$
declare n integer;
begin
  if (select count(*) from public.profiles) <> 1
    then raise exception 'FAIL: user can see other profiles'; end if;

  update public.profiles set full_name = 'hacked' where id = 'bbbbbbbb-0000-4000-8000-00000000000b';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: user updated another profile'; end if;

  update public.profiles set full_name = 'A renamed' where id = 'aaaaaaaa-0000-4000-8000-00000000000a';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: user cannot update own name'; end if;
end $$;

do $$
begin
  update public.profiles set email = 'spoof@example.invalid' where id = 'aaaaaaaa-0000-4000-8000-00000000000a';
  raise exception 'FAIL: user changed profile email directly';
exception when insufficient_privilege then null;
end $$;

-- projects
do $$
declare n integer;
begin
  insert into public.projects (title, type) values ('A project', 'video_script');
  if (select count(*) from public.projects) <> 1
    then raise exception 'FAIL: user sees projects other than their own'; end if;

  update public.projects set title = 'hacked' where id = 'bbbbbbbb-1111-4000-8000-00000000000b';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: user updated another user''s project'; end if;

  delete from public.projects where id = 'bbbbbbbb-1111-4000-8000-00000000000b';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: user deleted another user''s project'; end if;

  update public.projects set status = 'completed' where title = 'A project';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: user cannot update own project'; end if;
end $$;

do $$
begin
  insert into public.projects (user_id, title) values ('bbbbbbbb-0000-4000-8000-00000000000b', 'planted');
  raise exception 'FAIL: user created a project for someone else';
exception when insufficient_privilege then null;
end $$;

do $$
begin
  update public.projects set user_id = 'bbbbbbbb-0000-4000-8000-00000000000b' where title = 'A project';
  raise exception 'FAIL: user transferred a project to someone else';
exception when insufficient_privilege then null;
end $$;

-- generations & generated_images: read own only, no direct writes
do $$
begin
  if (select count(*) from public.generations) <> 0
    then raise exception 'FAIL: user can see other users'' generations'; end if;
  if (select count(*) from public.generated_images) <> 0
    then raise exception 'FAIL: user can see other users'' images'; end if;
end $$;

do $$
begin
  insert into public.generations (user_id, prompt, type) values ('aaaaaaaa-0000-4000-8000-00000000000a', 'free', 'other');
  raise exception 'FAIL: user inserted a generation directly';
exception when insufficient_privilege then null;
end $$;

do $$
begin
  insert into public.generated_images (user_id, prompt, image_url) values ('aaaaaaaa-0000-4000-8000-00000000000a', 'x', 'x');
  raise exception 'FAIL: user inserted an image directly';
exception when insufficient_privilege then null;
end $$;

-- credits: read own, never write
do $$
begin
  if (select count(*) from public.credits) <> 1
    then raise exception 'FAIL: user sees credits other than their own'; end if;
end $$;

do $$
begin
  update public.credits set balance = 1000000;
  raise exception 'FAIL: user changed their credit balance';
exception when insufficient_privilege then null;
end $$;

do $$
begin
  insert into public.credits (user_id, balance) values ('aaaaaaaa-0000-4000-8000-00000000000a', 999);
  raise exception 'FAIL: user inserted credits';
exception when insufficient_privilege then null;
end $$;

-- subscriptions: read own, never write
do $$
begin
  if (select count(*) from public.subscriptions) <> 1
    then raise exception 'FAIL: user sees subscriptions other than their own'; end if;
end $$;

do $$
begin
  update public.subscriptions set plan = 'business';
  raise exception 'FAIL: user upgraded their own plan';
exception when insufficient_privilege then null;
end $$;


-- ---------------------------------------------------------------------------
-- Act as a signed-out visitor (anon): no access at all
-- ---------------------------------------------------------------------------
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

do $$
declare t text;
begin
  foreach t in array array['profiles', 'projects', 'generations', 'generated_images', 'credits', 'subscriptions'] loop
    begin
      execute format('select count(*) from public.%I', t);
      raise exception 'FAIL: anon can read public.%', t;
    exception when insufficient_privilege then null;
    end;
  end loop;
end $$;

reset role;
rollback;
