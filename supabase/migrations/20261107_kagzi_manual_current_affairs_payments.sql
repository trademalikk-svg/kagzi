-- KAGZI manual UPI payment configuration and order intake.
-- Customers submit a transaction reference; an adult account owner/admin must independently verify it.
create table if not exists public.kagzi_manual_payment_settings (
  id boolean primary key default true check (id = true),
  enabled boolean not null default false,
  payee_name text not null default '',
  upi_id text not null default '',
  qr_image_url text not null default '',
  instructions text not null default 'UPI से भुगतान करें और Transaction ID जमा करें। भुगतान की पुष्टि Admin द्वारा की जाएगी।',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  constraint payment_settings_lengths check (
    char_length(payee_name) <= 120 and char_length(upi_id) <= 120 and
    char_length(qr_image_url) <= 1000 and char_length(instructions) <= 1000
  )
);
alter table public.kagzi_manual_payment_settings enable row level security;
grant select on public.kagzi_manual_payment_settings to anon, authenticated;
grant insert (id,enabled,payee_name,upi_id,qr_image_url,instructions,updated_at,updated_by) on public.kagzi_manual_payment_settings to authenticated;
grant update (enabled,payee_name,upi_id,qr_image_url,instructions,updated_at,updated_by) on public.kagzi_manual_payment_settings to authenticated;
drop policy if exists "Manual payment settings are readable when enabled" on public.kagzi_manual_payment_settings;
create policy "Manual payment settings are readable when enabled"
on public.kagzi_manual_payment_settings for select to anon, authenticated using (enabled = true or exists (select 1 from public.kagzi_library_admins a where a.user_id = (select auth.uid())));
drop policy if exists "Only KAGZI admins can insert manual payment settings" on public.kagzi_manual_payment_settings;
create policy "Only KAGZI admins can insert manual payment settings"
on public.kagzi_manual_payment_settings for insert to authenticated
with check (exists (select 1 from public.kagzi_library_admins a where a.user_id = (select auth.uid())));
drop policy if exists "Only KAGZI admins can update manual payment settings" on public.kagzi_manual_payment_settings;
create policy "Only KAGZI admins can update manual payment settings"
on public.kagzi_manual_payment_settings for update to authenticated
using (exists (select 1 from public.kagzi_library_admins a where a.user_id = (select auth.uid())))
with check (exists (select 1 from public.kagzi_library_admins a where a.user_id = (select auth.uid())));
insert into public.kagzi_manual_payment_settings(id,enabled) values (true,false) on conflict (id) do nothing;

create table if not exists public.kagzi_manual_payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  product_code text not null check (product_code in (
    'monthly-january','monthly-february','monthly-march','monthly-april','monthly-may','monthly-june',
    'monthly-july','monthly-august','monthly-september','monthly-october','monthly-november','monthly-december',
    'yearly'
  )),
  amount_inr integer generated always as (case when product_code = 'yearly' then 70 else 30 end) stored,
  transaction_ref text not null unique check (char_length(transaction_ref) between 8 and 100),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  admin_note text not null default '',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  constraint manual_payment_admin_note_length check (char_length(admin_note) <= 500)
);
create index if not exists kagzi_manual_payment_orders_user_created_idx
on public.kagzi_manual_payment_orders(user_id, created_at desc);
alter table public.kagzi_manual_payment_orders enable row level security;
grant select, insert on public.kagzi_manual_payment_orders to authenticated;
grant update (status,admin_note,reviewed_at,reviewed_by) on public.kagzi_manual_payment_orders to authenticated;
drop policy if exists "Customers can view their own payment orders and admins can view all" on public.kagzi_manual_payment_orders;
create policy "Customers can view their own payment orders and admins can view all"
on public.kagzi_manual_payment_orders for select to authenticated
using ((select auth.uid()) = user_id or exists (select 1 from public.kagzi_library_admins a where a.user_id = (select auth.uid())));
drop policy if exists "Customers can submit their own pending payment orders" on public.kagzi_manual_payment_orders;
create policy "Customers can submit their own pending payment orders"
on public.kagzi_manual_payment_orders for insert to authenticated
with check ((select auth.uid()) = user_id and status = 'pending' and reviewed_at is null and reviewed_by is null and admin_note = '');
drop policy if exists "Only KAGZI admins can review payment orders" on public.kagzi_manual_payment_orders;
create policy "Only KAGZI admins can review payment orders"
on public.kagzi_manual_payment_orders for update to authenticated
using (exists (select 1 from public.kagzi_library_admins a where a.user_id = (select auth.uid())))
with check (exists (select 1 from public.kagzi_library_admins a where a.user_id = (select auth.uid())));
