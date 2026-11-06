-- KAGZI Current Affairs access settings.
-- Public may read only the four non-sensitive tier values.
-- Only users explicitly listed in kagzi_library_admins may update them.
create table if not exists public.kagzi_current_affairs_access (
  section text primary key check (section in ('daily','weekly','monthly','yearly')),
  access_tier text not null check (access_tier in ('free','paid')),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
alter table public.kagzi_current_affairs_access enable row level security;
grant select on public.kagzi_current_affairs_access to anon, authenticated;
grant update on public.kagzi_current_affairs_access to authenticated;
drop policy if exists "Current affairs access is publicly readable" on public.kagzi_current_affairs_access;
create policy "Current affairs access is publicly readable"
on public.kagzi_current_affairs_access for select to anon, authenticated using (true);
drop policy if exists "Only KAGZI admins can update current affairs access" on public.kagzi_current_affairs_access;
create policy "Only KAGZI admins can update current affairs access"
on public.kagzi_current_affairs_access for update to authenticated
using (exists (select 1 from public.kagzi_library_admins a where a.user_id = (select auth.uid())))
with check (exists (select 1 from public.kagzi_library_admins a where a.user_id = (select auth.uid())));
insert into public.kagzi_current_affairs_access(section,access_tier) values
 ('daily','free'),('weekly','free'),('monthly','paid'),('yearly','paid')
on conflict (section) do nothing;
