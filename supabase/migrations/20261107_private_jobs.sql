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
  minimum_age integer check (minimum_age is null or minimum_age >= 18),
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

-- Curated official career-page directory (50 companies). All remain pending permission review.
create unique index if not exists kagzi_private_job_sources_url_unique
  on public.kagzi_private_job_sources (careers_url);

insert into public.kagzi_private_job_sources
  (company_name,publisher,careers_url,source_type,terms_url,permission_status,automated_fetch_allowed,republish_allowed,attribution_required,check_frequency,is_active,admin_notes)
values
  ('Tata Group','Tata Group','https://www.tata.com/careers/jobs','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('Reliance Industries','Reliance Industries','https://careers.ril.com/','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('Godrej Group','Godrej Group','https://careers.godrejindustries.com/in/en','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('Maruti Suzuki','Maruti Suzuki','https://www.marutisuzuki.com/corporate/careers','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('HDFC Bank','HDFC Bank','https://www.hdfc.bank.in/careers','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('Axis Bank','Axis Bank','https://www.axis.bank.in/careers','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('Tata Consultancy Services','Tata Consultancy Services','https://www.tcs.com/careers/india','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('Swiggy','Swiggy','https://careers.swiggy.in/','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('HDFC Sales','HDFC Sales','https://www.hdfcsales.com/open-positions','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('Mahindra Group','Mahindra Group','https://www.mahindra.com/career','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('Infosys','Infosys','https://www.infosys.com/careers/apply/','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('Wipro','Wipro','https://careers.wipro.com/','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('Capgemini India','Capgemini India','https://capgeminitech.com/careers','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('Hero MotoCorp','Hero MotoCorp','https://jobs.heromotocorp.com/','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('Nestle India','Nestle India','https://www.nestle.in/jobs','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('Marico','Marico','https://marico.sensehq.com/careers','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('Bajaj Auto','Bajaj Auto','https://careers.bajajauto.com/','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('Tata Motors','Tata Motors','https://careers.tatamotors.com/viewalljobs/','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('Asian Paints','Asian Paints','https://careers.asianpaints.com/job/','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('ITC','ITC','https://recruitment.itcportal.com/jobs/Careers','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('Hindustan Unilever','Hindustan Unilever','https://careers.unilever.com/en/india','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('IDFC FIRST Bank','IDFC FIRST Bank','https://careers.idfcfirst.bank.in/in/en/','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('Adani Group','Adani Group','https://www.adani.com/careers','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('Larsen & Toubro','Larsen & Toubro','https://www.larsentoubro.com/careers','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('Sun Pharma','Sun Pharma','https://sunpharma.com/careers/','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('Cipla','Cipla','https://careers.cipla.com/','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('Biocon','Biocon','https://www.biocon.com/careers/','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('Kotak Mahindra Bank','Kotak Mahindra Bank','https://www.kotak.bank.in/en/about-us/careers.html','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('Amazon India','Amazon India','https://www.amazon.jobs/en/search?country%5B%5D=IND','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('Dr. Reddy''s Laboratories','Dr. Reddy''s Laboratories','https://careers.drreddys.com/jobs','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('Deloitte India','Deloitte India','https://southasiacareers.deloitte.com/go/Deloitte-India/718244','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('Federal Bank','Federal Bank','https://federal.bank.in/careers','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('Lupin','Lupin','https://careers.lupin.com/','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('DXC Technology','DXC Technology','https://careers.dxc.com/','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('Bandhan Bank','Bandhan Bank','https://bandhan.bank.in/careers','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('Tech Mahindra','Tech Mahindra','https://careers.techmahindra.com/','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('RBL Bank','RBL Bank','https://www.rbl.bank.in/careers','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('Vodafone Idea','Vodafone Idea','https://careers.vodafoneidea.com/go/All-Current-Job-Opportunities/4268701/','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('Reliance Jio','Reliance Jio','https://careers.jio.com/','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('SBI Life','SBI Life','https://www.sbilife.co.in/about-us/careers-opportunity','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('ICICI Life','ICICI Life','https://www.icicilife.com/insurance-careers.html','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('Eicher Group','Eicher Group','https://www.eicher.in/careers','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('BigBasket','BigBasket','https://www.bigbasket.com/fp/web/careers/','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('Microsoft India','Microsoft India','https://careers.microsoft.com/v2/global/en/locations/india.html','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('PwC India','PwC India','https://www.pwc.in/careers.html','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('EY India','EY India','https://www.ey.com/en_in/careers','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('Accenture India','Accenture India','https://www.accenture.com/in-en/careers','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('Dell Technologies','Dell Technologies','https://jobs.dell.com/','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('Adani Infra','Adani Infra','https://www.adaniinfra.com/careers','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.'),
  ('HCLTech','HCLTech','https://careers.hcltech.com/go/India/9553955/','official_career_page',null,'pending_review',false,false,true,'manual',true,'Official career page link checked 2026-11-07; source terms and reuse permission not yet reviewed. No automated fetching or republication.')
on conflict (careers_url) do nothing;

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
