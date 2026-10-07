-- =============================================================================
-- AI Images: pricing, image metadata and atomic credit spending for images.
--
-- Image files live in the private `user-uploads` bucket under
-- "<user id>/images/<file>". public.record_image_generation() charges credits
-- and records the generation + image in one transaction (same guarantees as
-- record_generation for text).
-- =============================================================================

-- Allow 'image' in the generation history.
alter table public.generations drop constraint if exists generations_type_check;
alter table public.generations add constraint generations_type_check check (type in (
  'blog_post', 'blog_outline', 'social_post', 'youtube_title', 'youtube_description',
  'seo_title', 'meta_description', 'image', 'video_script', 'social_caption', 'other'
));

-- Image metadata.
alter table public.generated_images
  add column if not exists generation_id uuid references public.generations (id) on delete set null,
  add column if not exists style text
    check (style in ('realistic', 'cinematic', 'illustration', '3d', 'minimal')),
  add column if not exists aspect_ratio text check (aspect_ratio in ('1:1', '16:9', '9:16')),
  add column if not exists width integer check (width > 0),
  add column if not exists height integer check (height > 0),
  add column if not exists model text check (char_length(model) <= 100);

-- Users may attach their own images to their own projects ("Save"). The
-- composite (project_id, user_id) foreign key guarantees the project is theirs.
grant update (project_id) on public.generated_images to authenticated;

create policy "Users can attach their own images to projects"
  on public.generated_images for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Price list (adds 'image'; keep in sync with src/features/images/config.ts).
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
    when 'image' then 4
    else null
  end;
$$;

create or replace function public.record_image_generation(
  p_prompt text,
  p_image_path text,
  p_style text,
  p_aspect_ratio text,
  p_width integer,
  p_height integer,
  p_model text
)
returns table (image_id uuid, generation_id uuid, credits_used integer, balance integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_cost integer := public.generation_cost('image');
  v_balance integer;
  v_generation uuid;
  v_image uuid;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  -- The file must be in the caller's own folder.
  if p_image_path is null or p_image_path not like v_user::text || '/images/%' or p_image_path like '%..%' then
    raise exception 'invalid_image_path' using errcode = '22023';
  end if;

  update public.credits c
  set balance = c.balance - v_cost
  where c.user_id = v_user and c.balance >= v_cost
  returning c.balance into v_balance;

  if not found then
    raise exception 'insufficient_credits' using errcode = 'P0001';
  end if;

  insert into public.generations (user_id, prompt, output, type, credits_used)
  values (v_user, p_prompt, p_image_path, 'image', v_cost)
  returning id into v_generation;

  insert into public.generated_images
    (user_id, prompt, image_url, generation_id, style, aspect_ratio, width, height, model)
  values
    (v_user, p_prompt, p_image_path, v_generation, p_style, p_aspect_ratio, p_width, p_height, p_model)
  returning id into v_image;

  return query select v_image, v_generation, v_cost, v_balance;
end;
$$;

revoke execute on function public.record_image_generation(text, text, text, text, integer, integer, text) from public, anon;
grant execute on function public.record_image_generation(text, text, text, text, integer, integer, text) to authenticated;
