-- =============================================================================
-- AI Writer: content types, credit pricing and atomic credit spending.
--
-- Credits are spent ONLY through public.record_generation(), which runs as a
-- security definer and, in one transaction:
--   1. prices the generation from its type (server-side; callers can't pick
--      the cost),
--   2. deducts the credits only if the balance covers them (row lock, so
--      concurrent requests can't overspend),
--   3. records the generation for the calling user.
-- Users still have no direct write access to credits or generations, and the
-- function can only ever lower the caller's own balance.
-- =============================================================================

-- New content types (old values kept for compatibility).
alter table public.generations drop constraint if exists generations_type_check;
alter table public.generations add constraint generations_type_check check (type in (
  'blog_post', 'blog_outline', 'social_post', 'youtube_title', 'youtube_description',
  'seo_title', 'meta_description', 'video_script', 'social_caption', 'other'
));

alter table public.projects drop constraint if exists projects_type_check;
alter table public.projects add constraint projects_type_check check (type in (
  'blog_post', 'blog_outline', 'social_post', 'youtube_title', 'youtube_description',
  'seo_title', 'meta_description', 'video_script', 'social_caption', 'image', 'other'
));


-- Credit price per generation type. Keep in sync with
-- src/features/writer/config.ts (which only displays prices).
create or replace function public.generation_cost(p_type text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case p_type
    when 'blog_post' then 5
    when 'blog_outline' then 2
    when 'youtube_description' then 2
    when 'social_post' then 1
    when 'youtube_title' then 1
    when 'seo_title' then 1
    when 'meta_description' then 1
    else null
  end;
$$;


create or replace function public.record_generation(
  p_type text,
  p_prompt text,
  p_output text,
  p_project_id uuid default null
)
returns table (generation_id uuid, credits_used integer, balance integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_cost integer := public.generation_cost(p_type);
  v_balance integer;
  v_id uuid;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if v_cost is null then
    raise exception 'invalid_generation_type' using errcode = '22023';
  end if;
  if coalesce(char_length(p_output), 0) = 0 then
    raise exception 'empty_output' using errcode = '22023';
  end if;

  -- Atomic check-and-deduct: the update only matches when the balance
  -- covers the cost, and the row lock serialises concurrent requests.
  update public.credits c
  set balance = c.balance - v_cost
  where c.user_id = v_user and c.balance >= v_cost
  returning c.balance into v_balance;

  if not found then
    raise exception 'insufficient_credits' using errcode = 'P0001';
  end if;

  insert into public.generations (user_id, project_id, prompt, output, type, credits_used)
  values (v_user, p_project_id, p_prompt, p_output, p_type, v_cost)
  returning id into v_id;

  return query select v_id, v_cost, v_balance;
end;
$$;

revoke execute on function public.record_generation(text, text, text, uuid) from public, anon;
grant execute on function public.record_generation(text, text, text, uuid) to authenticated;
grant execute on function public.generation_cost(text) to authenticated;
