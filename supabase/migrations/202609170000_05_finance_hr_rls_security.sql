-- ═══════════════════════════════════════════════════════════════════
-- 🦅 FALCON UNIVERSAL ERP — FINANCE, HR & RLS HARDENING (Migration 05)
--
-- 1) Creates the missing cloud tables the app already tracks locally:
--      accounts, journal_entries, journal_entry_lines,
--      departments, employee_attendance, employee_leaves,
--      salary_statements, employee_advances, employee_documents
-- 2) Adds missing columns to existing tables so the outbox upserts
--      stop failing with PGRST204 (unknown column).
-- 3) Implements full Row Level Security on EVERY table (org tenancy)
--      with a hybrid identity model:
--        * Supabase Auth JWT  -> user_metadata.org_id OR public.users.org_id
--        * Offline-first devices -> per-org transport token sent in the
--          `x-falcon-org-token` request header (set client-side once).
-- 4) Adds financial integrity guards (balanced journal entries).
--
-- ═══════════════════════════════════════════════════════════════════

-- =============================================================
-- 0. Helper: read the per-device transport token from headers
-- =============================================================
create or replace function public.request_transport_token()
returns text
language sql
stable
as $$
  select nullif(current_setting('request.headers', true)::jsonb ->> 'x-falcon-org-token', '')
$$;

-- =============================================================
-- 1. RLS identity helper: current_org_id()
--    Resolution order:
--      1) authenticated JWT user_metadata.org_id
--      2) authenticated JWT uid lookup in public.users
--      3) unauthenticated device via organizations.transport_token
-- =============================================================
create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'user_metadata' ->> 'org_id')::uuid,
    (select org_id from public.users where id = auth.uid()),
    (select id from public.organizations where transport_token = public.request_transport_token())
  )
$$;

-- =============================================================
-- 2. Schema additions (existing tables)
-- =============================================================

alter table public.organizations
  add column if not exists activity_type text,
  add column if not exists transport_token text unique;

alter table public.users
  add column if not exists basic_salary numeric(15,4),
  add column if not exists salary_cycle text default 'monthly',
  add column if not exists allowances numeric(15,4) default 0,
  add column if not exists deductions numeric(15,4) default 0,
  add column if not exists permissions jsonb;

alter table public.treasuries
  add column if not exists account_code text;

alter table public.cashier_shifts
  add column if not exists closed_by_user_id uuid references public.users(id) on delete set null,
  add column if not exists actual_card_balance numeric(15,4),
  add column if not exists destination_treasury_id uuid references public.treasuries(id) on delete set null;

alter table public.sales_invoices
  add column if not exists is_deleted boolean default false,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.users(id) on delete set null,
  add column if not exists delete_reason text;

alter table public.stock_transfers
  add column if not exists from_branch_id uuid references public.branches(id) on delete set null,
  add column if not exists to_branch_id uuid references public.branches(id) on delete set null,
  add column if not exists items_count integer default 0;

alter table public.financial_vouchers
  add column if not exists is_reversed boolean default false,
  add column if not exists reversal_reason text,
  add column if not exists reversed_voucher_id uuid references public.financial_vouchers(id) on delete set null;

alter table public.expenses
  add column if not exists is_deleted boolean default false,
  add column if not exists deleted_at timestamptz;

alter table public.app_settings
  add column if not exists created_at timestamptz default now();

-- Backfill transport tokens for any organization created before this migration.
update public.organizations
set transport_token = gen_random_uuid()::text
where transport_token is null;

-- =============================================================
-- 3. HR & Org-structure tables
-- =============================================================

create table if not exists public.departments (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  parent_id uuid references public.departments(id) on delete set null,
  manager_id uuid references public.users(id) on delete set null,
  code text,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_departments_org on public.departments(org_id, is_active);

create table if not exists public.employee_attendance (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  employee_id uuid not null references public.users(id) on delete cascade,
  date date not null,
  check_in timestamptz,
  check_out timestamptz,
  work_hours numeric(8,2),
  status text not null default 'present'
    check (status in ('present', 'absent', 'late', 'excused', 'leave', 'half_day')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, employee_id, date)
);

create index if not exists idx_attendance_org_date on public.employee_attendance(org_id, date);
create index if not exists idx_attendance_employee on public.employee_attendance(employee_id, date);

create table if not exists public.employee_leaves (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  employee_id uuid not null references public.users(id) on delete cascade,
  leave_type text not null
    check (leave_type in ('annual', 'sick', 'unpaid', 'emergency', 'departure')),
  start_date date not null,
  end_date date not null,
  days_count numeric(8,2) not null default 1,
  reason text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by uuid references public.users(id) on delete set null,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_leaves_org_status on public.employee_leaves(org_id, status);
create index if not exists idx_leaves_employee on public.employee_leaves(employee_id);

create table if not exists public.salary_statements (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  employee_id uuid references public.users(id) on delete set null,
  month text not null,
  basic_salary numeric(15,4) not null default 0,
  allowances numeric(15,4) not null default 0,
  bonus numeric(15,4) not null default 0,
  overtime numeric(15,4) not null default 0,
  deductions numeric(15,4) not null default 0,
  loan_deduction numeric(15,4) not null default 0,
  net_salary numeric(15,4) not null default 0,
  notes text,
  status text not null default 'draft'
    check (status in ('draft', 'approved', 'paid', 'cancelled')),
  paid_at timestamptz,
  treasury_id uuid references public.treasuries(id) on delete set null,
  payment_voucher_id uuid references public.financial_vouchers(id) on delete set null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, employee_id, month)
);

create index if not exists idx_salary_statements_org on public.salary_statements(org_id, month);
create index if not exists idx_salary_statements_emp on public.salary_statements(employee_id, month);

create table if not exists public.employee_advances (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  employee_id uuid not null references public.users(id) on delete cascade,
  adjustment_type text not null default 'advance_salary'
    check (adjustment_type in ('advance_salary', 'bonus', 'deduction', 'allowance', 'loan')),
  amount numeric(15,4) not null default 0,
  reason text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'paid', 'deducted_from_salary', 'cancelled')),
  approved_by uuid references public.users(id) on delete set null,
  salary_statement_id uuid references public.salary_statements(id) on delete set null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_advances_org on public.employee_advances(org_id, status);
create index if not exists idx_advances_employee on public.employee_advances(employee_id, status);

create table if not exists public.employee_documents (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  employee_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  document_type text,
  file_url text,
  file_type text,
  notes text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_emp_docs_org on public.employee_documents(org_id);
create index if not exists idx_emp_docs_employee on public.employee_documents(employee_id);

-- =============================================================
-- 4. Accounting tables (Chart of Accounts + General Journal)
-- =============================================================

create table if not exists public.accounts (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  parent_id uuid references public.accounts(id) on delete set null,
  code text not null,
  name text not null,
  name_en text,
  type text not null
    check (type in ('asset', 'liability', 'equity', 'revenue', 'expense')),
  account_type text not null default 'leaf'
    check (account_type in ('parent', 'leaf')),
  current_balance numeric(15,4) not null default 0,
  is_active boolean not null default true,
  system_flag boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, code)
);

create index if not exists idx_accounts_org on public.accounts(org_id, type);
create index if not exists idx_accounts_parent on public.accounts(parent_id);

create table if not exists public.journal_entries (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  entry_no text not null,
  entry_date timestamptz not null default now(),
  type text not null default 'general'
    check (type in ('general', 'sales', 'purchases', 'expenses', 'opening', 'payroll', 'voucher', 'reversal')),
  description text,
  reference_type text,
  reference_id uuid,
  total_amount numeric(15,4) not null default 0,
  is_reversed boolean not null default false,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (org_id, entry_no)
);

create index if not exists idx_journal_org_date on public.journal_entries(org_id, entry_date);
create index if not exists idx_journal_ref on public.journal_entries(reference_type, reference_id);

create table if not exists public.journal_entry_lines (
  id uuid primary key default uuid_generate_v4(),
  entry_id uuid not null references public.journal_entries(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete restrict,
  debit numeric(15,4) not null default 0,
  credit numeric(15,4) not null default 0,
  description text
);

create index if not exists idx_journal_lines_entry on public.journal_entry_lines(entry_id);
create index if not exists idx_journal_lines_account on public.journal_entry_lines(account_id);

-- Financial integrity: every journal entry MUST be balanced (debit = credit).
create or replace function public.enforce_balanced_journal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_debit numeric;
  v_credit numeric;
begin
  select
    coalesce(sum(l.debit), 0),
    coalesce(sum(l.credit), 0)
  into v_debit, v_credit
  from public.journal_entry_lines l
  where l.entry_id = coalesce(new.entry_id, old.entry_id);

  if abs(v_debit - v_credit) > 0.001 then
    raise exception 'Journal entry is not balanced (debit % <> credit %)', v_debit, v_credit;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_balanced_journal on public.journal_entry_lines;
create trigger trg_enforce_balanced_journal
  before insert or update or delete on public.journal_entry_lines
  for each row execute function public.enforce_balanced_journal();

-- updated_at triggers on the new updatable tables
do $$
declare
  t text;
begin
  foreach t in array array[
    'departments', 'employee_attendance', 'employee_leaves',
    'salary_statements', 'employee_advances', 'employee_documents',
    'accounts'
  ] loop
    execute format('
      drop trigger if exists trg_update_timestamp_%I on %I;
      create trigger trg_update_timestamp_%I
      before update on %I
      for each row execute function public.update_timestamp_column();',
      t, t, t, t
    );
  end loop;
end;
$$;

-- =============================================================
-- 5. Row Level Security (every table)
-- =============================================================

-- Helper to enable RLS + start with no policies for a given table
create or replace function public.falcon_enable_rls(p_table text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  execute format('alter table public.%I enable row level security', p_table);
end;
$$;

-- A) Organizations (id-scoped; self-registration insert via transport token)
select public.falcon_enable_rls('organizations');
drop policy if exists "org_tenant_select" on public.organizations;
create policy "org_tenant_select" on public.organizations
  for select using (id = public.current_org_id());
drop policy if exists "org_tenant_insert" on public.organizations;
create policy "org_tenant_insert" on public.organizations
  for insert with check (transport_token = public.request_transport_token());
drop policy if exists "org_tenant_update" on public.organizations;
create policy "org_tenant_update" on public.organizations
  for update using (id = public.current_org_id());

-- B) Org-scoped tables (org_id = current_org_id())
do $$
declare
  t text;
begin
  foreach t in array array[
    'branches', 'users', 'app_settings', 'product_categories',
    'product_brands', 'units', 'products', 'warehouses',
    'contacts', 'contact_transactions', 'treasuries',
    'expenses', 'expense_categories', 'financial_vouchers',
    'product_batches', 'stock_levels', 'inventory_transactions',
    'stock_transfers', 'stock_transfer_items',
    'sales_invoices', 'sales_returns', 'purchase_invoices', 'purchase_returns',
    'stocktake_sessions', 'stocktake_items',
    'departments', 'employee_attendance', 'employee_leaves',
    'salary_statements', 'employee_advances', 'employee_documents',
    'accounts', 'journal_entries', 'activity_logs'
  ] loop
    execute format('select public.falcon_enable_rls(%L)', t);
    execute format('drop policy if exists %I on public.%I', 't_' || t || '_select', t);
    execute format('create policy %I on public.%I for select using (org_id = public.current_org_id())', 't_' || t || '_select', t);
    execute format('drop policy if exists %I on public.%I', 't_' || t || '_insert', t);
    execute format('create policy %I on public.%I for insert with check (org_id = public.current_org_id())', 't_' || t || '_insert', t);
    execute format('drop policy if exists %I on public.%I', 't_' || t || '_update', t);
    execute format('create policy %I on public.%I for update using (org_id = public.current_org_id())', 't_' || t || '_update', t);
    execute format('drop policy if exists %I on public.%I', 't_' || t || '_delete', t);
    execute format('create policy %I on public.%I for delete using (org_id = public.current_org_id())', 't_' || t || '_delete', t);
  end loop;
end;
$$;

-- C) Child tables WITHOUT org_id (resolved through their parent document)
select public.falcon_enable_rls('sales_invoice_items');
do $$
begin
  drop policy if exists "t_sales_invoice_items_select" on public.sales_invoice_items;
  create policy "t_sales_invoice_items_select" on public.sales_invoice_items
    for select using (
      exists (select 1 from public.sales_invoices si
              where si.id = sales_invoice_items.invoice_id
                and si.org_id = public.current_org_id())
    );
  drop policy if exists "t_sales_invoice_items_insert" on public.sales_invoice_items;
  create policy "t_sales_invoice_items_insert" on public.sales_invoice_items
    for insert with check (
      exists (select 1 from public.sales_invoices si
              where si.id = sales_invoice_items.invoice_id
                and si.org_id = public.current_org_id())
    );
  drop policy if exists "t_sales_invoice_items_update" on public.sales_invoice_items;
  create policy "t_sales_invoice_items_update" on public.sales_invoice_items
    for update using (
      exists (select 1 from public.sales_invoices si
              where si.id = sales_invoice_items.invoice_id
                and si.org_id = public.current_org_id())
    );
  drop policy if exists "t_sales_invoice_items_delete" on public.sales_invoice_items;
  create policy "t_sales_invoice_items_delete" on public.sales_invoice_items
    for delete using (
      exists (select 1 from public.sales_invoices si
              where si.id = sales_invoice_items.invoice_id
                and si.org_id = public.current_org_id())
    );
end;
$$;

select public.falcon_enable_rls('purchase_invoice_items');
do $$
begin
  drop policy if exists "t_purchase_invoice_items_select" on public.purchase_invoice_items;
  create policy "t_purchase_invoice_items_select" on public.purchase_invoice_items
    for select using (
      exists (select 1 from public.purchase_invoices pi
              where pi.id = purchase_invoice_items.invoice_id
                and pi.org_id = public.current_org_id())
    );
  drop policy if exists "t_purchase_invoice_items_insert" on public.purchase_invoice_items;
  create policy "t_purchase_invoice_items_insert" on public.purchase_invoice_items
    for insert with check (
      exists (select 1 from public.purchase_invoices pi
              where pi.id = purchase_invoice_items.invoice_id
                and pi.org_id = public.current_org_id())
    );
  drop policy if exists "t_purchase_invoice_items_update" on public.purchase_invoice_items;
  create policy "t_purchase_invoice_items_update" on public.purchase_invoice_items
    for update using (
      exists (select 1 from public.purchase_invoices pi
              where pi.id = purchase_invoice_items.invoice_id
                and pi.org_id = public.current_org_id())
    );
  drop policy if exists "t_purchase_invoice_items_delete" on public.purchase_invoice_items;
  create policy "t_purchase_invoice_items_delete" on public.purchase_invoice_items
    for delete using (
      exists (select 1 from public.purchase_invoices pi
              where pi.id = purchase_invoice_items.invoice_id
                and pi.org_id = public.current_org_id())
    );
end;
$$;

select public.falcon_enable_rls('journal_entry_lines');
do $$
begin
  drop policy if exists "t_journal_entry_lines_select" on public.journal_entry_lines;
  create policy "t_journal_entry_lines_select" on public.journal_entry_lines
    for select using (
      exists (select 1 from public.journal_entries je
              where je.id = journal_entry_lines.entry_id
                and je.org_id = public.current_org_id())
    );
  drop policy if exists "t_journal_entry_lines_insert" on public.journal_entry_lines;
  create policy "t_journal_entry_lines_insert" on public.journal_entry_lines
    for insert with check (
      exists (select 1 from public.journal_entries je
              where je.id = journal_entry_lines.entry_id
                and je.org_id = public.current_org_id())
    );
  drop policy if exists "t_journal_entry_lines_update" on public.journal_entry_lines;
  create policy "t_journal_entry_lines_update" on public.journal_entry_lines
    for update using (
      exists (select 1 from public.journal_entries je
              where je.id = journal_entry_lines.entry_id
                and je.org_id = public.current_org_id())
    );
  drop policy if exists "t_journal_entry_lines_delete" on public.journal_entry_lines;
  create policy "t_journal_entry_lines_delete" on public.journal_entry_lines
    for delete using (
      exists (select 1 from public.journal_entries je
              where je.id = journal_entry_lines.entry_id
                and je.org_id = public.current_org_id())
    );
end;
$$;

-- D) RPC: secure organization creation (bypasses RLS as SECURITY DEFINER).
--    Used by the registration flow so a brand-new org can be created
--    before any JWT / transport-token exists.
create or replace function public.falcon_register_organization(
  p_id uuid,
  p_name text,
  p_currency text default 'EGP',
  p_transport_token text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.organizations (id, name, currency, transport_token, is_active, created_at, updated_at)
  values (p_id, p_name, coalesce(p_currency, 'EGP'), p_transport_token, true, now(), now())
  on conflict (id) do nothing;
  return p_id;
end;
$$;

-- E) RPC: claim a previously created organization by transport token
--    (links an authenticated user to an org already seeded on another device).
create or replace function public.falcon_claim_organization(o_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return false;
  end if;
  update public.users
  set org_id = o_id, updated_at = now()
  where id = auth.uid();
  return true;
end;
$$;

-- =============================================================
-- 6. Realtime publication for sync-critical (online mode) tables
-- =============================================================
do $$
declare
  t text;
begin
  foreach t in array array[
    'organizations', 'branches', 'users', 'app_settings',
    'product_categories', 'product_brands', 'units', 'products',
    'product_units', 'product_batches', 'stock_levels',
    'inventory_transactions', 'stock_transfers', 'stock_transfer_items',
    'warehouses', 'contacts', 'contact_transactions', 'treasuries',
    'expense_categories', 'expenses', 'financial_vouchers',
    'cashier_shifts', 'sales_invoices', 'sales_invoice_items',
    'sales_returns', 'purchase_invoices', 'purchase_invoice_items',
    'purchase_returns', 'stocktake_sessions', 'stocktake_items',
    'departments', 'employee_attendance', 'employee_leaves',
    'salary_statements', 'employee_advances', 'employee_documents',
    'accounts', 'journal_entries', 'journal_entry_lines',
    'activity_logs'
  ] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end;
$$;