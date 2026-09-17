-- ═══════════════════════════════════════════════════════════════
-- 🦅 FALCON UNIVERSAL ERP — STOCKTAKE SESSIONS & ITEMS
-- Adds `stocktake_sessions` and `stocktake_items` tables for
-- inventory stocktaking, cycle counting, and variance adjustments.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.stocktake_sessions (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete restrict,
  warehouse_id uuid not null references public.warehouses(id) on delete restrict,
  session_number text not null,
  status text not null default 'draft' check (status in ('draft', 'completed', 'cancelled')),
  notes text,
  total_difference_value numeric(15,4) not null default 0,
  created_by uuid references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (org_id, session_number)
);

create table if not exists public.stocktake_items (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references public.stocktake_sessions(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  batch_id uuid references public.product_batches(id) on delete set null,
  expected_quantity numeric(15,4) not null default 0,
  actual_quantity numeric(15,4) not null default 0,
  difference_quantity numeric(15,4) not null default 0,
  unit_cost numeric(15,4) not null default 0,
  difference_value numeric(15,4) not null default 0
);

create index if not exists idx_stocktake_sessions_org on public.stocktake_sessions(org_id, created_at);
create index if not exists idx_stocktake_sessions_wh on public.stocktake_sessions(warehouse_id);
create index if not exists idx_stocktake_items_session on public.stocktake_items(session_id);
create index if not exists idx_stocktake_items_prod on public.stocktake_items(product_id);
