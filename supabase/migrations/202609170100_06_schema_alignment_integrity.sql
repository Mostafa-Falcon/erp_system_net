-- ═══════════════════════════════════════════════════════════════════
-- 🦅 FALCON UNIVERSAL ERP — SCHEMA ALIGNMENT & INTEGRITY HARDENING (Migration 06)
--
-- Aligns the cloud schema with the outbox payload contract and hardens
-- financial integrity. All statements are idempotent and safe to apply
-- against an existing database (verified against already-applied m01-m03).
--
-- 1) product_categories.description        -> matches CLOUD_COLUMN_MAP
-- 2) stock_transfers.status                -> allow 'in_transit' (app writes it)
-- 3) journal_entries.type                  -> defensively allow 'adjustment'
-- 4) Document number integrity             -> unique (org_id, number) where safe
-- 5) Org-scoped performance indexes        -> pull sync + RLS policy filters
-- ═══════════════════════════════════════════════════════════════════

-- =============================================================
-- 1. Schema alignment (app writes these columns via the outbox)
-- =============================================================

alter table public.product_categories
  add column if not exists description text;

-- =============================================================
-- 2. stock_transfers.status must accept 'in_transit'
--    (StockTransferRepository writes it, m02 CHECK rejects it).
--    Rebuild the check constraint idempotently.
-- =============================================================
alter table public.stock_transfers
  drop constraint if exists stock_transfers_status_check;
alter table public.stock_transfers
  add constraint stock_transfers_status_check
    check (status in ('draft', 'pending', 'in_transit', 'completed', 'cancelled'));

-- =============================================================
-- 3. Defensive: journal_entries.type must accept 'adjustment'
--    (already fixed in m05; kept here in case m05 was applied
--     partially via the SQL editor before the fix).
-- =============================================================
do $$
begin
  if exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'journal_entries'
      and c.conname = 'journal_entries_type_check'
  ) then
    alter table public.journal_entries drop constraint journal_entries_type_check;
    alter table public.journal_entries add constraint journal_entries_type_check
      check (type in ('general', 'sales', 'purchases', 'expenses', 'opening', 'payroll', 'voucher', 'adjustment', 'reversal'));
  end if;
end;
$$;

-- =============================================================
-- 4. Document number integrity
--    Add unique (org_id, number) only when no duplicates exist, so a
--    legacy database with collisions never blocks the migration.
-- =============================================================

-- Sales invoices: uniqueness scope covers live documents only
-- (soft-deleted/cancelled invoices are archived and may reuse numbers).
do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and tablename = 'sales_invoices'
      and indexname = 'uq_sales_invoices_live_number'
  ) and not exists (
    select 1 from (
      select org_id, invoice_number
      from public.sales_invoices
      where is_deleted = false
      group by org_id, invoice_number
      having count(*) > 1
    ) d
  ) then
    create unique index uq_sales_invoices_live_number
      on public.sales_invoices(org_id, invoice_number)
      where is_deleted = false;
  end if;
end;
$$;

-- Purchase invoice numbers
do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and tablename = 'purchase_invoices'
      and indexname = 'uq_purchase_invoices_number'
  ) and not exists (
    select 1 from (
      select org_id, invoice_number
      from public.purchase_invoices
      group by org_id, invoice_number
      having count(*) > 1
    ) d
  ) then
    create unique index uq_purchase_invoices_number
      on public.purchase_invoices(org_id, invoice_number);
  end if;
end;
$$;

-- Sales return numbers
do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and tablename = 'sales_returns'
      and indexname = 'uq_sales_returns_number'
  ) and not exists (
    select 1 from (
      select org_id, return_number
      from public.sales_returns
      group by org_id, return_number
      having count(*) > 1
    ) d
  ) then
    create unique index uq_sales_returns_number
      on public.sales_returns(org_id, return_number);
  end if;
end;
$$;

-- Purchase return numbers
do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and tablename = 'purchase_returns'
      and indexname = 'uq_purchase_returns_number'
  ) and not exists (
    select 1 from (
      select org_id, return_number
      from public.purchase_returns
      group by org_id, return_number
      having count(*) > 1
    ) d
  ) then
    create unique index uq_purchase_returns_number
      on public.purchase_returns(org_id, return_number);
  end if;
end;
$$;

-- Financial voucher numbers
do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and tablename = 'financial_vouchers'
      and indexname = 'uq_financial_vouchers_no'
  ) and not exists (
    select 1 from (
      select org_id, voucher_no
      from public.financial_vouchers
      group by org_id, voucher_no
      having count(*) > 1
    ) d
  ) then
    create unique index uq_financial_vouchers_no
      on public.financial_vouchers(org_id, voucher_no);
  end if;
end;
$$;

-- =============================================================
-- 5. Org-scoped performance indexes
--    The outbox upsert, RLS policies and the pull sync all filter
--    by org_id; core tables from m01 had no secondary indexes.
-- =============================================================

create index if not exists idx_org_branches on public.branches(org_id);
create index if not exists idx_org_users on public.users(org_id, is_active);
create index if not exists idx_org_units on public.units(org_id);
create index if not exists idx_org_product_categories on public.product_categories(org_id, is_active);
create index if not exists idx_org_product_brands on public.product_brands(org_id);
create index if not exists idx_org_products on public.products(org_id, is_active);
create index if not exists idx_org_warehouses on public.warehouses(org_id, is_active);
create index if not exists idx_org_stock_levels on public.stock_levels(org_id, product_id);
create index if not exists idx_org_inventory_tx on public.inventory_transactions(org_id, created_at);
create index if not exists idx_org_contacts on public.contacts(org_id, type, is_active);
create index if not exists idx_org_contact_tx on public.contact_transactions(org_id, contact_id, created_at);
create index if not exists idx_org_treasuries on public.treasuries(org_id, is_active);
create index if not exists idx_org_categories on public.expense_categories(org_id);
create index if not exists idx_org_expenses on public.expenses(org_id, created_at);
create index if not exists idx_org_vouchers on public.financial_vouchers(org_id, created_at);
create index if not exists idx_org_sales_invoices on public.sales_invoices(org_id, invoice_date);
create index if not exists idx_org_sales_returns on public.sales_returns(org_id, return_date);
create index if not exists idx_org_purchase_invoices on public.purchase_invoices(org_id, invoice_date);
create index if not exists idx_org_purchase_returns on public.purchase_returns(org_id, return_date);
create index if not exists idx_org_activity_logs on public.activity_logs(org_id, created_at);

-- Child-table lookups by parent document id (already exist for FKs in
-- most cases; add the few that the reports/ledger queries rely on).
create index if not exists idx_sales_items_invoice on public.sales_invoice_items(invoice_id);
create index if not exists idx_purchase_items_invoice on public.purchase_invoice_items(invoice_id);
create index if not exists idx_units_product on public.product_units(product_id);