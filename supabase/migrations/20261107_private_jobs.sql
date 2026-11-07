-- KAGZI Private Jobs: public, verified job listings and admin-only source registry.
-- No third-party content is automatically republished unless source permission is recorded.

create table if not exists public.kagzi_private_jobs (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  job_title text not null,
  summary text not null default '',
  region text not null default 'all_india' check (region in ('uttar_pradesh','all_india','other_state')),
  location text not null default 'All India',
  qualification text not null default '',
  experience_level text not null default 'both' check (experience_level in ('fresher','experienced','both','internship')),
  category text not null default 'other',
  employment_type text not null default 'full_time' check (employment_type in ('full_time','part_time','contract','internship','apprenticeship')),
  minimum_age integer,
  salary_min_inr bigint check (salary_min_inr is null or salary_min_inr >= 0),
  salary_max_inr bigint check (salary_max_inr is null or salary_max_inr >= 0),
  salary_period text check (salary_period is null or salary_period in ('monthly','annual','stipend')),
  annual_ctc_min_inr bigint check (annual_ctc_min_inr is null or annual_ctc_min_inr >= 0),
  annual_ctc_max_inr bigint check (annual_ctc_max_inr is null or annual_ctc_max_inr >= 0),
  in_hand_min_inr bigint check (in_hand_min_inr is null or in_hand_min_inr >= 0),
  in_hand_max_inr bigint check (in_hand_max_inr is null or in_hand_max_inr >= 0),
  salary_disclosure text not null default 'not_disclosed' check (salary_disclosure in ('official','estimated','not_disclosed')),
  salary_note text not null default '',
  salary_source_url text,
  application_url text not null,
  source_name text not null,
  source_url text not null,
  source_terms_url text,
  source_permission_status text not null default 'pending_review'
    check (source_permission_status in ('link_only','licensed','written_permission','pending_review','disallowed')),
  source_checked_at timestamptz,
  verification_status text not null default 'pending'
    check (verification_status in ('pending','verified','needs_recheck','expired','withheld')),
  last_date date,
  is_published boolean not null default false,
  published_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (salary_min_inr is null or salary_max_inr is null or salary_min_inr <= salary_max_inr),
  check (annual_ctc_min_inr is null or annual_ctc_max_inr is null or annual_ctc_min_inr <= annual_ctc_max_inr),
  check (in_hand_min_inr is null or in_hand_max_inr is null or in_hand_min_inr <= in_hand_max_inr)
);

create index if not exists kagzi_private_jobs_public_idx
  on public.kagzi_private_jobs (is_published, verification_status, last_date, published_at desc);
create index if not exists kagzi_private_jobs_region_idx
  on public.kagzi_private_jobs (region, experience_level, category);

create table if not exists public.kagzi_private_job_sources (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  publisher text not null,
  careers_url text not null,
  source_type text not null default 'official_career_page'
    check (source_type in ('official_career_page','rss','api','open_data','manual')),
  terms_url text,
  permission_status text not null default 'pending_review'
    check (permission_status in ('pending_review','link_only','automated_fetch_allowed','republish_allowed','disallowed')),
  automated_fetch_allowed boolean not null default false,
  republish_allowed boolean not null default false,
  attribution_required boolean not null default true,
  check_frequency text not null default 'manual' check (check_frequency in ('manual','daily','weekly')),
  last_checked_at timestamptz,
  next_check_at timestamptz,
  is_active boolean not null default true,
  admin_notes text not null default '',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists kagzi_private_job_sources_check_idx
  on public.kagzi_private_job_sources (is_active, permission_status, next_check_at);

alter table public.kagzi_private_jobs enable row level security;
alter table public.kagzi_private_job_sources enable row level security;

-- New Supabase projects no longer expose new public tables automatically.
grant select on public.kagzi_private_jobs to anon, authenticated;
grant insert, update, delete on public.kagzi_private_jobs to authenticated;
revoke all on public.kagzi_private_job_sources from anon, authenticated;
grant select, insert, update, delete on public.kagzi_private_job_sources to authenticated;

drop policy if exists "Public can view verified permitted private jobs" on public.kagzi_private_jobs;
create policy "Public can view verified permitted private jobs"
on public.kagzi_private_jobs for select to anon, authenticated
using (
  is_published = true
  and verification_status in ('verified','expired')
  and source_permission_status in ('licensed','written_permission')
);

drop policy if exists "KAGZI admins manage private jobs" on public.kagzi_private_jobs;
create policy "KAGZI admins manage private jobs"
on public.kagzi_private_jobs for all to authenticated
using (exists (
  select 1 from public.kagzi_library_admins a where a.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.kagzi_library_admins a where a.user_id = (select auth.uid())
));

drop policy if exists "KAGZI admins manage private job sources" on public.kagzi_private_job_sources;
create policy "KAGZI admins manage private job sources"
on public.kagzi_private_job_sources for all to authenticated
using (exists (
  select 1 from public.kagzi_library_admins a where a.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.kagzi_library_admins a where a.user_id = (select auth.uid())
));
