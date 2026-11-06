-- KAGZI eBook access tiers
-- Apply this migration in the Supabase SQL Editor before using paid/free controls.
-- Existing published books remain free and keep working.
alter table public.kagzi_library_files
  add column if not exists access_tier text not null default 'free',
  add column if not exists price_inr integer not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.kagzi_library_files'::regclass
      and conname = 'kagzi_library_files_access_tier_check'
  ) then
    alter table public.kagzi_library_files
      add constraint kagzi_library_files_access_tier_check
      check (access_tier in ('free', 'paid'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.kagzi_library_files'::regclass
      and conname = 'kagzi_library_files_price_inr_check'
  ) then
    alter table public.kagzi_library_files
      add constraint kagzi_library_files_price_inr_check
      check (
        (access_tier = 'free' and price_inr = 0)
        or (access_tier = 'paid' and price_inr > 0)
      );
  end if;
end $$;

create index if not exists kagzi_library_files_access_tier_published_idx
  on public.kagzi_library_files (access_tier, is_published, created_at desc);
