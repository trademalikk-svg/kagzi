-- KAGZI Private Jobs: combine public/admin read access and index admin foreign keys.
-- This keeps RLS policy evaluation to one SELECT policy per role/action.

create index if not exists kagzi_private_jobs_created_by_idx
  on public.kagzi_private_jobs (created_by);
create index if not exists kagzi_private_job_sources_created_by_idx
  on public.kagzi_private_job_sources (created_by);

drop policy if exists "Public can view verified permitted private jobs" on public.kagzi_private_jobs;
drop policy if exists "KAGZI admins manage private jobs" on public.kagzi_private_jobs;

create policy "View permitted private jobs and admin records"
on public.kagzi_private_jobs for select to anon, authenticated
using (
  (
    is_published = true
    and verification_status in ('verified','expired')
    and source_permission_status in ('licensed','written_permission')
  )
  or exists (
    select 1 from public.kagzi_library_admins a
    where a.user_id = (select auth.uid())
  )
);

create policy "KAGZI admins insert private jobs"
on public.kagzi_private_jobs for insert to authenticated
with check (exists (
  select 1 from public.kagzi_library_admins a where a.user_id = (select auth.uid())
));

create policy "KAGZI admins update private jobs"
on public.kagzi_private_jobs for update to authenticated
using (exists (
  select 1 from public.kagzi_library_admins a where a.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.kagzi_library_admins a where a.user_id = (select auth.uid())
));

create policy "KAGZI admins delete private jobs"
on public.kagzi_private_jobs for delete to authenticated
using (exists (
  select 1 from public.kagzi_library_admins a where a.user_id = (select auth.uid())
));
