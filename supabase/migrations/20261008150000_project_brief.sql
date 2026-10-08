-- Stores the AI Writer brief (type, topic, tone, language, keywords,
-- instructions) a project was created from, so it can be regenerated.
-- Written by the app's server actions only after server-side validation;
-- the constraint just bounds shape and size.
alter table public.projects
  add column if not exists brief jsonb
    check (brief is null or (jsonb_typeof(brief) = 'object' and pg_column_size(brief) <= 8192));

-- brief is user-editable content of their own project (RLS still applies).
grant update (brief) on public.projects to authenticated;

-- Supports sorting by creation date per user.
create index if not exists projects_user_id_created_at_idx on public.projects (user_id, created_at desc);
