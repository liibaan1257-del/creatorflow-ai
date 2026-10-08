-- Adds the YouTube Script and Product Description content types (used by the
-- AI Writer and the Templates library) and their credit prices.

alter table public.generations drop constraint if exists generations_type_check;
alter table public.generations add constraint generations_type_check check (type in (
  'blog_post', 'blog_outline', 'social_post', 'youtube_title', 'youtube_description', 'youtube_script',
  'seo_title', 'meta_description', 'product_description', 'image', 'video_script', 'social_caption', 'other'
));

alter table public.projects drop constraint if exists projects_type_check;
alter table public.projects add constraint projects_type_check check (type in (
  'blog_post', 'blog_outline', 'social_post', 'youtube_title', 'youtube_description', 'youtube_script',
  'seo_title', 'meta_description', 'product_description', 'video_script', 'social_caption', 'image', 'other'
));

-- Price list (keep in sync with src/features/writer/config.ts and
-- src/features/images/config.ts, which only display prices).
create or replace function public.generation_cost(p_type text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case p_type
    when 'blog_post' then 5
    when 'youtube_script' then 4
    when 'blog_outline' then 2
    when 'youtube_description' then 2
    when 'social_post' then 1
    when 'youtube_title' then 1
    when 'seo_title' then 1
    when 'meta_description' then 1
    when 'product_description' then 1
    when 'image' then 4
    else null
  end;
$$;
