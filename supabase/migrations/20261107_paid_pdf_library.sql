-- Private Paid PDF library: entitlement-gated downloads.
create table if not exists public.kagzi_paid_resources (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '' check (char_length(description) <= 2000),
  storage_path text not null unique,
  price_inr integer not null default 0 check (price_inr >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.kagzi_paid_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resource_id uuid not null references public.kagzi_paid_resources(id) on delete cascade,
  status text not null default 'active' check (status in ('active','revoked')),
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  granted_by uuid references auth.users(id),
  unique(user_id, resource_id),
  check (expires_at is null or expires_at > granted_at)
);
create index if not exists kagzi_paid_entitlements_user_idx on public.kagzi_paid_entitlements(user_id,status);
alter table public.kagzi_paid_resources enable row level security;
alter table public.kagzi_paid_entitlements enable row level security;
grant select on public.kagzi_paid_resources to anon, authenticated;
grant select on public.kagzi_paid_entitlements to authenticated;
grant insert, update, delete on public.kagzi_paid_resources to authenticated;
grant insert, update, delete on public.kagzi_paid_entitlements to authenticated;
drop policy if exists "Active paid resources are listed" on public.kagzi_paid_resources;
create policy "Active paid resources are listed" on public.kagzi_paid_resources for select to anon, authenticated using (is_active = true);
drop policy if exists "KAGZI admins manage paid resources" on public.kagzi_paid_resources;
create policy "KAGZI admins manage paid resources" on public.kagzi_paid_resources for all to authenticated
using (exists (select 1 from public.kagzi_library_admins a where a.user_id=(select auth.uid())))
with check (exists (select 1 from public.kagzi_library_admins a where a.user_id=(select auth.uid())));
drop policy if exists "Users view their own paid entitlements" on public.kagzi_paid_entitlements;
create policy "Users view their own paid entitlements" on public.kagzi_paid_entitlements for select to authenticated using (user_id=(select auth.uid()));
drop policy if exists "KAGZI admins manage paid entitlements" on public.kagzi_paid_entitlements;
create policy "KAGZI admins manage paid entitlements" on public.kagzi_paid_entitlements for all to authenticated
using (exists (select 1 from public.kagzi_library_admins a where a.user_id=(select auth.uid())))
with check (exists (select 1 from public.kagzi_library_admins a where a.user_id=(select auth.uid())));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('kagzi-paid-pdfs','kagzi-paid-pdfs',false,52428800,array['application/pdf'])
on conflict (id) do update set public=false,file_size_limit=52428800,allowed_mime_types=array['application/pdf'];
drop policy if exists "Paid PDF owners can download entitled resources" on storage.objects;
create policy "Paid PDF owners can download entitled resources" on storage.objects for select to authenticated
using (bucket_id='kagzi-paid-pdfs' and exists (
 select 1 from public.kagzi_paid_entitlements e join public.kagzi_paid_resources r on r.id=e.resource_id
 where e.user_id=(select auth.uid()) and e.status='active'
 and (e.expires_at is null or e.expires_at>now()) and r.is_active=true and r.storage_path=storage.objects.name
));
drop policy if exists "KAGZI admins upload paid PDFs" on storage.objects;
create policy "KAGZI admins upload paid PDFs" on storage.objects for insert to authenticated
with check (bucket_id='kagzi-paid-pdfs' and exists (select 1 from public.kagzi_library_admins a where a.user_id=(select auth.uid())));
drop policy if exists "KAGZI admins update paid PDFs" on storage.objects;
create policy "KAGZI admins update paid PDFs" on storage.objects for update to authenticated
using (bucket_id='kagzi-paid-pdfs' and exists (select 1 from public.kagzi_library_admins a where a.user_id=(select auth.uid())))
with check (bucket_id='kagzi-paid-pdfs' and exists (select 1 from public.kagzi_library_admins a where a.user_id=(select auth.uid())));
drop policy if exists "KAGZI admins delete paid PDFs" on storage.objects;
create policy "KAGZI admins delete paid PDFs" on storage.objects for delete to authenticated
using (bucket_id='kagzi-paid-pdfs' and exists (select 1 from public.kagzi_library_admins a where a.user_id=(select auth.uid())));
