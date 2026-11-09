create table if not exists public.kagzi_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 5 and 240),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) <= 180),
  excerpt text not null default '' check (char_length(excerpt) <= 500),
  content_markdown text not null default '' check (char_length(content_markdown) <= 100000),
  language text not null check (language in ('hi','en')),
  region text not null check (region in ('india','worldwide')),
  category text not null default 'general' check (char_length(category) between 1 and 80),
  trend_query text not null default '' check (char_length(trend_query) <= 300),
  trend_source text not null default '' check (char_length(trend_source) <= 500),
  trend_score integer not null default 0 check (trend_score between 0 and 100),
  source_urls text[] not null default '{}',
  seo_title text not null default '' check (char_length(seo_title) <= 70),
  meta_description text not null default '' check (char_length(meta_description) <= 170),
  status text not null default 'draft' check (status in ('draft','pending_review','approved','published','rejected')),
  created_by uuid not null references auth.users(id),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kagzi_articles_approval_consistency check (
    (status in ('approved','published') and approved_by is not null and approved_at is not null)
    or status not in ('approved','published')
  ),
  constraint kagzi_articles_publish_consistency check (
    (status = 'published' and published_at is not null)
    or status <> 'published'
  )
);

create index if not exists kagzi_articles_status_created_idx
  on public.kagzi_articles (status, created_at desc);
create index if not exists kagzi_articles_public_idx
  on public.kagzi_articles (published_at desc)
  where status = 'published';
create index if not exists kagzi_articles_region_language_idx
  on public.kagzi_articles (region, language, status);

alter table public.kagzi_articles enable row level security;

drop policy if exists "Published KAGZI articles are public" on public.kagzi_articles;
create policy "Published KAGZI articles are public"
  on public.kagzi_articles for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "KAGZI admins can read all articles" on public.kagzi_articles;
create policy "KAGZI admins can read all articles"
  on public.kagzi_articles for select
  to authenticated
  using (exists (
    select 1 from public.kagzi_library_admins a
    where a.user_id = (select auth.uid())
  ));

drop policy if exists "KAGZI admins can create articles" on public.kagzi_articles;
create policy "KAGZI admins can create articles"
  on public.kagzi_articles for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and exists (
      select 1 from public.kagzi_library_admins a
      where a.user_id = (select auth.uid())
    )
  );

drop policy if exists "KAGZI admins can update articles" on public.kagzi_articles;
create policy "KAGZI admins can update articles"
  on public.kagzi_articles for update
  to authenticated
  using (exists (
    select 1 from public.kagzi_library_admins a
    where a.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.kagzi_library_admins a
    where a.user_id = (select auth.uid())
  ));

grant select on public.kagzi_articles to anon, authenticated;
grant insert, update on public.kagzi_articles to authenticated;