-- ═══════════════════════════════════════════════════════════════════
-- 🦅 FALCON UNIVERSAL ERP — HR PROFILE FIELDS (Migration 07)
--
-- Adds the real HR profile columns the UI writes through the outbox:
--   1) users.department_id   -> real FK to public.departments
--   2) users.job_title       -> free-text job title
--   3) users.hire_date       -> employment start date
--   4) users.annual_leave_days -> yearly leave entitlement
--
-- All statements are idempotent and safe to re-run.
-- ═══════════════════════════════════════════════════════════════════

-- =============================================================
-- 1. HR profile columns on public.users
--    (departments is created in m05, so the FK target exists)
-- =============================================================
alter table public.users
  add column if not exists department_id uuid references public.departments(id) on delete set null,
  add column if not exists job_title text,
  add column if not exists hire_date date,
  add column if not exists annual_leave_days numeric(5,2) not null default 21;

create index if not exists idx_users_department on public.users(department_id);

-- =============================================================
-- 2. Ensure a department belongs to the same org as its employees
--    (defensive trigger, idempotent).
-- =============================================================
create or replace function public.enforce_employee_department_org()
returns trigger
language plpgsql
as $$
declare
  dept_org uuid;
begin
  if new.department_id is null then
    return new;
  end if;

  select org_id into dept_org
  from public.departments
  where id = new.department_id;

  if dept_org is distinct from new.org_id then
    raise exception 'department_id % does not belong to organization %',
      new.department_id, new.org_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_employee_department_org on public.users;
create trigger trg_enforce_employee_department_org
  before insert or update of department_id, org_id on public.users
  for each row execute function public.enforce_employee_department_org();

-- =============================================================
-- 3. Atomic leave-balance guard used by the HR module.
--    Returns the remaining entitled days for a given year.
-- =============================================================
create or replace function public.fn_employee_leave_remaining(
  p_employee_id uuid,
  p_year integer
)
returns numeric
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  entitled numeric;
  used numeric;
begin
  select coalesce(annual_leave_days, 21) into entitled
  from public.users
  where id = p_employee_id;

  select coalesce(sum(days_count), 0) into used
  from public.employee_leaves
  where employee_id = p_employee_id
    and leave_type = 'annual'
    and status = 'approved'
    and extract(year from start_date) = p_year;

  return coalesce(entitled, 21) - used;
end;
$$;

grant execute on function public.fn_employee_leave_remaining(uuid, integer) to authenticated;
