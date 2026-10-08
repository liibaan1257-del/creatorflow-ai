-- =============================================================================
-- Account settings: writer preferences, uploaded avatars and self-service
-- account deletion.
--
-- Requires: 20261007160000_create_core_schema.sql (profiles.email sync).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Preferences (null = app default). Must match src/features/writer/config.ts.
-- -----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists default_tone text
    check (default_tone in ('professional', 'friendly', 'casual', 'persuasive')),
  add column if not exists default_language text
    check (default_language in (
      'English', 'Somali', 'Arabic', 'French', 'Spanish', 'Portuguese',
      'German', 'Italian', 'Dutch', 'Turkish', 'Swahili', 'Hindi'
    ));


-- -----------------------------------------------------------------------------
-- Avatars: either an https URL (e.g. from a sign-up provider) or a file in the
-- user's own storage folder (<user id>/avatars/...), served via signed URLs.
-- -----------------------------------------------------------------------------
update public.profiles
set avatar_url = null
where avatar_url is not null
  and avatar_url not like 'https://%'
  and avatar_url not like id::text || '/avatars/%';

alter table public.profiles drop constraint if exists profiles_avatar_url_check;
alter table public.profiles
  add constraint profiles_avatar_url_check check (
    avatar_url is null
    or (char_length(avatar_url) <= 500
        and (avatar_url like 'https://%'
             or (avatar_url like id::text || '/avatars/%' and avatar_url not like '%..%')))
  );

-- Users may update only these columns of their own row (RLS policy unchanged).
revoke update on public.profiles from anon, authenticated;
grant update (full_name, avatar_url, default_tone, default_language) on public.profiles to authenticated;


-- -----------------------------------------------------------------------------
-- Account deletion
--
-- Deletes the caller's auth user; every table referencing auth.users cascades
-- (profile, projects, generations, images, credits, ledger, subscription).
-- Storage files are removed by the app first, through the Storage API.
--
-- Requires a fresh sign-in: the session must have been authenticated within
-- the last 10 minutes (the app re-checks the password right before calling
-- this), so a stolen long-lived session can't delete the account on its own.
-- -----------------------------------------------------------------------------
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_last_auth bigint;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select max((m ->> 'timestamp')::bigint) into v_last_auth
  from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) m;

  if v_last_auth is null or v_last_auth < extract(epoch from now()) - 600 then
    raise exception 'reauthentication_required' using errcode = '28000';
  end if;

  delete from auth.users where id = v_user;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
