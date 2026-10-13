-- Fresh Supabase project (Oct 2026): pieces the code uses that supabase-schema.sql never defined.
-- Run AFTER supabase-schema.sql and the earlier migrations.

-- Checkout webhook writes purchased_items on user_products.
alter table public.user_products
  add column if not exists purchased_items jsonb default '[]'::jsonb;

-- QuickBooks-issued course coupons (server-only; no client access).
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  product_id uuid references public.products(id) on delete cascade,
  email text not null,
  discount_percent numeric(5,2) not null default 100,
  max_uses integer not null default 1,
  used_count integer not null default 0,
  status text not null default 'ACTIVE',
  quickbooks_payment_id text unique,
  purchase_id uuid references public.purchases(id) on delete set null,
  expires_at timestamptz,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.coupons enable row level security;

-- Pin search_path on the original functions.
alter function public.handle_new_user() set search_path = public;
alter function public.update_updated_at_column() set search_path = public;

-- Product files: PRIVATE bucket. Customers can only list/download files in
-- folders (named by product_slug) for products they actually own.
insert into storage.buckets (id, name, public)
values ('bundle-files', 'bundle-files', false)
on conflict (id) do update set public = false;

drop policy if exists "Owners can read their product files" on storage.objects;
create policy "Owners can read their product files" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'bundle-files'
    and exists (
      select 1
      from public.user_products up
      join public.products p on p.id = up.product_id
      where up.user_id = auth.uid()
        and up.is_active = true
        and (up.expires_at is null or up.expires_at > now())
        and p.product_slug = (storage.foldername(name))[1]
    )
  );

-- Trigger functions are not meant to be called through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.protect_profile_privileges() from public, anon, authenticated;
revoke execute on function public.protect_profile_privileges_insert() from public, anon, authenticated;
