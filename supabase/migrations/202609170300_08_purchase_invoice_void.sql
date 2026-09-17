-- =============================================================
-- 🦅 Falcon ERP - Migration 08: Purchase invoice void / soft delete
-- Adds cancellable purchase invoice support so a posted invoice can be
-- reversed without physical deletion (audit-safe).
-- =============================================================

alter table public.purchase_invoices
  add column if not exists is_deleted boolean not null default false,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.users(id) on delete set null,
  add column if not exists delete_reason text;

create index if not exists idx_purchase_invoices_active
  on public.purchase_invoices (org_id, created_at desc)
  where is_deleted = false;
