-- ═══════════════════════════════════════════════════════════════
-- 🦅 FALCON UNIVERSAL ERP — PURCHASE RETURNS
-- Adds the missing `purchase_returns` document table that the
-- application already tracks locally (Dexie v3) and pushes through
-- the outbox to `public.purchase_returns`.
-- Without this table the cloud upsert fails with
-- "relation purchase_returns does not exist", breaking the
-- purchase -> return chain for synchronized branches.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.purchase_returns (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete restrict,
  warehouse_id uuid not null references public.warehouses(id) on delete restrict,
  original_invoice_id uuid references public.purchase_invoices(id) on delete set null,
  supplier_id uuid not null references public.contacts(id) on delete restrict,
  return_number text not null,
  return_date timestamptz not null default now(),
  total numeric(15,4) not null default 0,
  refunded_amount numeric(15,4) not null default 0,
  treasury_id uuid references public.treasuries(id) on delete set null,
  reason text,
  created_by uuid references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (org_id, return_number)
);

create index if not exists idx_purchase_returns_org on public.purchase_returns(org_id, return_date);
create index if not exists idx_purchase_returns_invoice on public.purchase_returns(original_invoice_id);
create index if not exists idx_purchase_returns_supplier on public.purchase_returns(supplier_id);

-- Realtime publication is intentionally not enabled: operational
-- (transactional) writes are pushed from the outbox.
