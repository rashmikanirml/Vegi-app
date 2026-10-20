-- Veggie Marketplace MVP schema, RLS, RPCs, and storage.

create extension if not exists "pgcrypto";

create type public.user_role as enum ('buyer', 'seller', 'admin');
create type public.listing_status as enum ('active', 'paused', 'sold_out');
create type public.order_status as enum (
  'pending', 'accepted', 'ready', 'completed', 'rejected', 'cancelled', 'refunded'
);
create type public.payment_method as enum ('online', 'cash');
create type public.payment_status as enum ('pending', 'paid', 'released', 'refunded', 'failed');

create table public.app_config (
  key text primary key,
  value numeric not null
);

insert into public.app_config (key, value) values ('platform_fee_percent', 0);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text,
  role public.user_role not null default 'buyer',
  address text,
  farm_name text,
  approved boolean not null default true,
  payout_account text,
  created_at timestamptz not null default now()
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  category text not null,
  description text,
  image_url text,
  price_per_kg numeric(12, 2) not null check (price_per_kg >= 0),
  quantity_kg numeric(12, 2) not null check (quantity_kg >= 0),
  harvest_date date,
  area text,
  status public.listing_status not null default 'active',
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id),
  buyer_id uuid not null references public.profiles (id),
  seller_id uuid not null references public.profiles (id),
  quantity_kg numeric(12, 2) not null check (quantity_kg > 0),
  unit_price numeric(12, 2) not null,
  total numeric(12, 2) not null,
  status public.order_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  amount numeric(12, 2) not null,
  platform_fee numeric(12, 2) not null default 0,
  method public.payment_method not null default 'cash',
  provider_ref text,
  status public.payment_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index listings_status_created_idx on public.listings (status, created_at desc);
create index listings_seller_idx on public.listings (seller_id);
create index orders_buyer_idx on public.orders (buyer_id, created_at desc);
create index orders_seller_idx on public.orders (seller_id, created_at desc);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

create or replace function public.is_approved_seller()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'seller' and p.approved = true
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
  resolved_role public.user_role;
begin
  requested_role := coalesce(new.raw_user_meta_data->>'role', 'buyer');
  if requested_role in ('buyer', 'seller') then
    resolved_role := requested_role::public.user_role;
  else
    resolved_role := 'buyer';
  end if;

  insert into public.profiles (
    id, full_name, phone, role, address, farm_name, approved
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'phone',
    resolved_role,
    new.raw_user_meta_data->>'address',
    new.raw_user_meta_data->>'farm_name',
    resolved_role <> 'seller'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role or new.approved is distinct from old.approved then
    if not public.is_admin() then
      raise exception 'You cannot change role or approval status';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_fields
  before update on public.profiles
  for each row execute procedure public.protect_profile_fields();

create or replace function public.restore_listing_quantity(p_listing_id uuid, p_qty numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.listings
  set
    quantity_kg = quantity_kg + p_qty,
    status = case
      when status = 'sold_out' then 'active'::public.listing_status
      else status
    end
  where id = p_listing_id;
end;
$$;

create or replace function public.create_order(p_listing_id uuid, p_quantity_kg numeric)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  listing_row public.listings%rowtype;
  seller_approved boolean;
  fee_percent numeric;
  fee numeric;
  order_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if p_quantity_kg is null or p_quantity_kg <= 0 then
    raise exception 'Quantity must be greater than zero';
  end if;

  select * into listing_row
  from public.listings
  where id = p_listing_id
  for update;

  if not found then
    raise exception 'Listing not found';
  end if;
  if listing_row.status <> 'active' then
    raise exception 'Listing is not available';
  end if;
  if listing_row.quantity_kg < p_quantity_kg then
    raise exception 'Not enough quantity available';
  end if;
  if listing_row.seller_id = auth.uid() then
    raise exception 'You cannot order your own listing';
  end if;

  select approved into seller_approved
  from public.profiles
  where id = listing_row.seller_id;

  if coalesce(seller_approved, false) = false then
    raise exception 'Seller is not approved';
  end if;

  insert into public.orders (
    listing_id, buyer_id, seller_id, quantity_kg, unit_price, total, status
  ) values (
    listing_row.id,
    auth.uid(),
    listing_row.seller_id,
    p_quantity_kg,
    listing_row.price_per_kg,
    round(p_quantity_kg * listing_row.price_per_kg, 2),
    'pending'
  )
  returning id into order_id;

  update public.listings
  set
    quantity_kg = quantity_kg - p_quantity_kg,
    status = case
      when quantity_kg - p_quantity_kg <= 0 then 'sold_out'::public.listing_status
      else status
    end
  where id = listing_row.id;

  select value into fee_percent from public.app_config where key = 'platform_fee_percent';
  fee := round(coalesce(fee_percent, 0) / 100 * (p_quantity_kg * listing_row.price_per_kg), 2);

  insert into public.payments (order_id, amount, platform_fee, method, status)
  values (order_id, round(p_quantity_kg * listing_row.price_per_kg, 2), fee, 'cash', 'pending');

  return order_id;
end;
$$;

create or replace function public.record_cash_payment(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  order_row public.orders%rowtype;
begin
  select * into order_row from public.orders where id = p_order_id;
  if not found then
    raise exception 'Order not found';
  end if;
  if order_row.status <> 'completed' then
    raise exception 'Payment can only be recorded for completed orders';
  end if;
  if not (
    public.is_admin()
    or order_row.buyer_id = auth.uid()
    or order_row.seller_id = auth.uid()
  ) then
    raise exception 'Not allowed';
  end if;

  update public.payments
  set status = 'released'
  where order_id = p_order_id;
end;
$$;

create or replace function public.update_order_status(p_order_id uuid, p_status public.order_status)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  order_row public.orders%rowtype;
  old_status public.order_status;
  is_seller boolean;
  is_buyer boolean;
  allowed boolean := false;
begin
  select * into order_row from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found';
  end if;

  old_status := order_row.status;
  is_seller := order_row.seller_id = auth.uid();
  is_buyer := order_row.buyer_id = auth.uid();

  if public.is_admin() then
    allowed := true;
  elsif is_seller then
    allowed :=
      (old_status = 'pending' and p_status in ('accepted', 'rejected'))
      or (old_status = 'accepted' and p_status = 'ready');
  elsif is_buyer then
    allowed :=
      (old_status = 'pending' and p_status = 'cancelled')
      or (old_status = 'ready' and p_status = 'completed');
  end if;

  if not allowed then
    raise exception 'This status change is not allowed';
  end if;

  update public.orders
  set status = p_status
  where id = p_order_id
  returning * into order_row;

  if p_status in ('rejected', 'cancelled') then
    perform public.restore_listing_quantity(order_row.listing_id, order_row.quantity_kg);
    update public.payments set status = 'failed' where order_id = p_order_id;
  elsif p_status = 'refunded' then
    if old_status in ('pending', 'accepted', 'ready') then
      perform public.restore_listing_quantity(order_row.listing_id, order_row.quantity_kg);
    end if;
    update public.payments set status = 'refunded' where order_id = p_order_id;
  elsif p_status = 'completed' then
    perform public.record_cash_payment(p_order_id);
  end if;

  return order_row;
end;
$$;

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.orders enable row level security;
alter table public.payments enable row level security;
alter table public.app_config enable row level security;

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

-- Buyers need farmer name/location on listing detail.
create policy "profiles_select_approved_sellers"
  on public.profiles for select
  to authenticated
  using (role = 'seller' and approved = true);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy "listings_select"
  on public.listings for select
  to authenticated
  using (
    status = 'active'
    or seller_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.listing_id = listings.id
        and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
    )
  );

create policy "listings_insert_approved_seller"
  on public.listings for insert
  to authenticated
  with check (seller_id = auth.uid() and public.is_approved_seller());

create policy "listings_update_own_or_admin"
  on public.listings for update
  to authenticated
  using (seller_id = auth.uid() or public.is_admin())
  with check (seller_id = auth.uid() or public.is_admin());

create policy "listings_delete_own_or_admin"
  on public.listings for delete
  to authenticated
  using (seller_id = auth.uid() or public.is_admin());

create policy "orders_select_party_or_admin"
  on public.orders for select
  to authenticated
  using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());

create policy "payments_select_party_or_admin"
  on public.payments for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = payments.order_id
        and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
    )
  );

create policy "app_config_select_authenticated"
  on public.app_config for select
  to authenticated
  using (true);

create policy "app_config_admin_write"
  on public.app_config for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant execute on function public.create_order(uuid, numeric) to authenticated;
grant execute on function public.update_order_status(uuid, public.order_status) to authenticated;
grant execute on function public.record_cash_payment(uuid) to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_approved_seller() to authenticated;

insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

create policy "listing_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'listing-photos');

create policy "listing_photos_seller_upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'listing-photos'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "listing_photos_owner_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'listing-photos'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "listing_photos_owner_or_admin_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'listing-photos'
    and (split_part(name, '/', 1) = auth.uid()::text or public.is_admin())
  );

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;
