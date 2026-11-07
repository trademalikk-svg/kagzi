-- Publish a concise, manually verified NPCI vacancy using link-only factual metadata.
-- No employer job-description text is copied; users are directed to the employer's own listing.

insert into public.kagzi_private_job_sources
  (company_name,publisher,careers_url,source_type,permission_status,automated_fetch_allowed,republish_allowed,attribution_required,check_frequency,is_active,admin_notes)
values
  ('NPCI','National Payments Corporation of India','https://careers.npci.org.in/jobs/Careers/','official_career_page','pending_review',false,false,true,'manual',true,
   'Official career portal. Terms/republication review pending; no automated fetching or copied descriptions.')
on conflict (careers_url) do nothing;

drop policy if exists "View permitted private jobs and admin records" on public.kagzi_private_jobs;
create policy "View permitted private jobs and admin records"
on public.kagzi_private_jobs for select to anon, authenticated
using (
  (
    is_published = true
    and verification_status in ('verified','expired')
    and source_permission_status in ('link_only','licensed','written_permission')
  )
  or exists (
    select 1 from public.kagzi_library_admins a
    where a.user_id = (select auth.uid())
  )
);

insert into public.kagzi_private_jobs
  (company_name,job_title,summary,region,location,qualification,experience_level,category,employment_type,
   salary_disclosure,salary_note,application_url,source_name,source_url,source_permission_status,
   source_checked_at,verification_status,last_date,is_published,published_at)
select
  'NPCI',
  'Senior Associate - Identity and Access Management',
  'Full-time information-security role covering enterprise identity management and privileged-access operations. The official listing mentions DLP and PAM tooling; check the employer notice for complete eligibility and skills.',
  'all_india',
  'Mumbai, Maharashtra',
  'See official posting; confirm education and complete eligibility on the employer page.',
  'experienced',
  'it',
  'full_time',
  'not_disclosed',
  'Salary not disclosed in the checked official listing.',
  'https://careers.npci.org.in/jobs/Careers/190737000004885408/Senior-Associate---Identity-and-Access-Management?source=CareerSite',
  'National Payments Corporation of India (NPCI)',
  'https://careers.npci.org.in/jobs/Careers/190737000004885408/Senior-Associate---Identity-and-Access-Management?source=CareerSite',
  'link_only',
  now(),
  'verified',
  null,
  true,
  now()
where not exists (
  select 1 from public.kagzi_private_jobs
  where application_url = 'https://careers.npci.org.in/jobs/Careers/190737000004885408/Senior-Associate---Identity-and-Access-Management?source=CareerSite'
);
