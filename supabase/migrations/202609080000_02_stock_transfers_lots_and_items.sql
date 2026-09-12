-- ═══════════════════════════════════════════════════════════════
-- 🦅 FALCON UNIVERSAL ERP — STOCK TRANSFERS, LOTS & TRANSFER ITEMS
-- Universal retail/trade inventory operations: inter-warehouse
-- transfers and batch/lot tracking (food, pharma, chemicals).
-- Mirrors the local Dexie tables (`stock_transfers`,
-- `product_batches`, `stock_transfer_items`).
-- ═══════════════════════════════════════════════════════════════

-- 1) Cross-warehouse stock transfer headers
create table if not exists public.stock_transfers (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  transfer_no text not null,
  from_warehouse_id uuid not null references public.warehouses(id) on delete restrict,
  to_warehouse_id uuid not null references public.warehouses(id) on delete restrict,
  status text not null default 'draft'
    check (status in ('draft', 'pending', 'completed', 'cancelled')),
  notes text,
  created_by uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (org_id, transfer_no)
);

create index if not exists idx_stock_transfers_org on public.stock_transfers(org_id, status);
create index if not exists idx_stock_transfers_from on public.stock_transfers(from_warehouse_id);
create index if not exists idx_stock_transfers_to on public.stock_transfers(to_warehouse_id);

-- 2) Lot/batch ledger for expiry-tracked products
create table if not exists public.product_batches (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  batch_number text not null,
  expiry_date date,
  initial_quantity numeric(15,4) not null default 0,
  current_quantity numeric(15,4) not null default 0,
  purchase_price numeric(15,4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, product_id, warehouse_id, batch_number)
);

create index if not exists idx_product_batches_product_wh on public.product_batches(product_id, warehouse_id);
create index if not exists idx_product_batches_expiry on public.product_batches(expiry_date);

-- 3) Stock transfer line items
create table if not exists public.stock_transfer_items (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  transfer_id uuid not null references public.stock_transfers(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  batch_id uuid references public.product_batches(id) on delete set null,
  unit_id uuid references public.units(id) on delete restrict,
  conversion_factor numeric(10,4) not null default 1,
  quantity numeric(15,4) not null default 0,
  base_quantity numeric(15,4) not null default 0,
  unit_cost numeric(15,4) not null default 0,
  total_cost numeric(15,4) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_stock_transfer_items_transfer on public.stock_transfer_items(transfer_id);
create index if not exists idx_stock_transfer_items_product on public.stock_transfer_items(product_id);
create index if not exists idx_stock_transfer_items_org on public.stock_transfer_items(org_id);

-- 4) Guards & triggers

-- Keep transfer status consistent with its lines.
create or replace function public.check_stock_transfer_items()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_status text;
begin
  select org_id, status into v_org, v_status
  from public.stock_transfers
  where id = coalesce(new.transfer_id, old.transfer_id);

  if v_status = 'completed' then
    raise exception 'لا يمكن تعديل بنود تحويل مكتمل';
  end if;

  if new.org_id is distinct from v_org then
    raise exception 'Org mismatch between transfer and its line items';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_stock_transfer_items_check on public.stock_transfer_items;
create trigger trg_stock_transfer_items_check
  before insert or update on public.stock_transfer_items
  for each row execute function public.check_stock_transfer_items();

-- updated_at maintenance.
drop trigger if exists trg_update_timestamp_stock_transfers on public.stock_transfers;
create trigger trg_update_timestamp_stock_transfers
  before update on public.stock_transfers
  for each row execute function public.update_timestamp_column();

drop trigger if exists trg_update_timestamp_product_batches on public.product_batches;
create trigger trg_update_timestamp_product_batches
  before update on public.product_batches
  for each row execute function public.update_timestamp_column();

-- Realtime publication is intentionally not enabled for operational
-- (transactional) tables: cloud writes are pushed from the outbox.