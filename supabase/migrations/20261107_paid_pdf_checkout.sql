-- Server-verified Razorpay checkout records for KAGZI paid PDFs.
-- Browser clients can read only their own order status; only server-side
-- service-role functions may create or settle payment records.
create table if not exists public.kagzi_payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resource_id uuid not null references public.kagzi_paid_resources(id) on delete restrict,
  gateway text not null default 'razorpay' check (gateway = 'razorpay'),
  razorpay_order_id text not null unique,
  razorpay_payment_id text unique,
  amount_inr integer not null check (amount_inr > 0),
  currency text not null default 'INR' check (currency = 'INR'),
  status text not null default 'pending' check (status in ('pending','paid','failed')),
  payment_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'paid') = (payment_verified_at is not null))
);
create index if not exists kagzi_payment_orders_user_idx
  on public.kagzi_payment_orders(user_id, status, created_at desc);
alter table public.kagzi_payment_orders enable row level security;
grant select on public.kagzi_payment_orders to authenticated;
drop policy if exists "Users view their own payment orders" on public.kagzi_payment_orders;
create policy "Users view their own payment orders"
  on public.kagzi_payment_orders for select to authenticated
  using (user_id = (select auth.uid()));

-- Never expose private object paths to public catalogue readers.
revoke select on public.kagzi_paid_resources from anon, authenticated;
grant select (id,title,description,price_inr,is_active,created_at,updated_at)
  on public.kagzi_paid_resources to anon, authenticated;
-- Admin uploads and resource management remain governed by the existing
-- KAGZI-admin RLS policy and existing INSERT/UPDATE/DELETE grants.
