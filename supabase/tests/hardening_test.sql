-- =============================================================================
-- Hardening test: RLS everywhere, least-privilege grants, rate limits.
--
-- Run in Supabase → SQL Editor AFTER all migrations. Rolled back at the end.
--   Success: "Success. No rows returned"   Failure: an error starting with "FAIL:".
-- =============================================================================

begin;

do $$
declare t text;
begin
  -- Every table in public has Row Level Security enabled.
  select string_agg(relname, ', ') into t from pg_class
  where relnamespace = 'public'::regnamespace and relkind = 'r' and not relrowsecurity;
  if t is not null then raise exception 'FAIL: RLS disabled on %', t; end if;

  -- API roles can't TRUNCATE (it bypasses RLS) or insert/delete profiles.
  select string_agg(table_name || ':' || grantee || ':' || privilege_type, ', ') into t
  from information_schema.role_table_grants
  where table_schema = 'public' and grantee in ('anon', 'authenticated')
    and (privilege_type in ('TRUNCATE', 'TRIGGER', 'REFERENCES')
         or (table_name = 'profiles' and privilege_type in ('INSERT', 'DELETE')));
  if t is not null then raise exception 'FAIL: excess privileges: %', t; end if;

  -- anon can only read the plan catalogue.
  select string_agg(table_name || ':' || privilege_type, ', ') into t
  from information_schema.role_table_grants
  where table_schema = 'public' and grantee = 'anon' and not (table_name = 'plans' and privilege_type = 'SELECT');
  if t is not null then raise exception 'FAIL: anon privileges: %', t; end if;
end $$;

insert into auth.users (id, email, aud, role)
values ('abababab-0000-4000-8000-0000000000ab', 'hardening-test@example.invalid', 'authenticated', 'authenticated');

set local role authenticated;
do $$
declare i integer; v integer;
begin
  perform set_config('request.jwt.claims', '{"sub":"abababab-0000-4000-8000-0000000000ab","role":"authenticated"}', true);
  for i in 1..6 loop
    v := public.hit_rate_limit('ai_image');
    if v <> 0 then raise exception 'FAIL: request % was limited', i; end if;
  end loop;
  if public.hit_rate_limit('ai_image') <= 0 then raise exception 'FAIL: 7th image request allowed'; end if;
  begin
    perform public.hit_rate_limit('anything');
    raise exception 'FAIL: unknown bucket accepted';
  exception when invalid_parameter_value then null;
  end;
  begin
    delete from public.rate_limits;
    raise exception 'FAIL: user could reset rate limits';
  exception when insufficient_privilege then null;
  end;
end $$;

rollback;
