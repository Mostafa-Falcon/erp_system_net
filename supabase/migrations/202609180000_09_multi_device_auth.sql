-- =========================================================================
-- Falcon ERP - Multi-Device Authentication RPC
-- Allows authorized accounts to log in seamlessly from multiple devices,
-- retrieve organization transport tokens for RLS, and bootstrap local Dexie.
-- =========================================================================

create or replace function public.falcon_authenticate_device(
  p_identifier text,
  p_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clean_id text;
  v_user record;
  v_org record;
  v_branch record;
begin
  v_clean_id := lower(trim(p_identifier));

  if v_clean_id = '' or p_password is null or p_password = '' then
    return jsonb_build_object(
      'success', false,
      'error', 'يرجى إدخال اسم المستخدم أو البريد الإلكتروني وكلمة المرور'
    );
  end if;

  -- 1. Search for user by email or username (case-insensitive)
  select * into v_user
  from public.users
  where (lower(trim(email)) = v_clean_id or lower(trim(username)) = v_clean_id)
    and is_active = true
  limit 1;

  if v_user.id is null then
    return jsonb_build_object(
      'success', false,
      'error', 'بيانات الدخول غير صحيحة أو المستخدم غير موجود'
    );
  end if;

  -- 2. Verify password / pin (pin_code_hash stores the credential)
  if v_user.pin_code_hash is null or v_user.pin_code_hash != trim(p_password) then
    return jsonb_build_object(
      'success', false,
      'error', 'كلمة المرور غير صحيحة. يرجى التحقق من كلمة المرور والمحاولة مجدداً.'
    );
  end if;

  -- 3. Load active organization
  select * into v_org
  from public.organizations
  where id = v_user.org_id
    and is_active = true
  limit 1;

  if v_org.id is null then
    return jsonb_build_object(
      'success', false,
      'error', 'المنشأة التابع لها هذا الحساب غير مفعّلة أو غير متوفرة'
    );
  end if;

  -- Ensure transport token exists on organization
  if v_org.transport_token is null or v_org.transport_token = '' then
    update public.organizations
    set transport_token = gen_random_uuid()::text, updated_at = now()
    where id = v_org.id
    returning * into v_org;
  end if;

  -- 4. Load the user's branch or main branch
  select * into v_branch
  from public.branches
  where org_id = v_org.id
    and (id = v_user.branch_id or is_main = true)
    and is_active = true
  order by (case when id = v_user.branch_id then 0 when is_main then 1 else 2 end)
  limit 1;

  return jsonb_build_object(
    'success', true,
    'user', to_jsonb(v_user),
    'organization', to_jsonb(v_org),
    'branch', case when v_branch.id is not null then to_jsonb(v_branch) else null end,
    'transport_token', v_org.transport_token
  );
end;
$$;

grant execute on function public.falcon_authenticate_device(text, text) to anon, authenticated, service_role;
