import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

interface RegisterPayload {
  pharmacyName?: string;
  ownerName?: string;
  email?: string;
  password?: string;
  phone?: string;
}

const DEFAULT_CHART: Array<{ code: string; name: string; account_type: string }> = [
  { code: '1101', name: 'الخزينة الرئيسية', account_type: 'asset' },
  { code: '1102', name: 'حساب البنك / فيزا', account_type: 'asset' },
  { code: '1103', name: 'حسابات التحويلات البنكية', account_type: 'asset' },
  { code: '1111', name: 'درج الكاشير الرئيسي', account_type: 'asset' },
  { code: '1201', name: 'حسابات العملاء', account_type: 'asset' },
  { code: '1202', name: 'حسابات العملاء والموردين', account_type: 'asset' },
  { code: '1301', name: 'مخزون الأدوية والأصناف', account_type: 'asset' },
  { code: '2101', name: 'حسابات الموردين', account_type: 'liability' },
  { code: '3101', name: 'رأس مال المؤسسة', account_type: 'equity' },
  { code: '4101', name: 'إيرادات مبيعات الأدوية', account_type: 'revenue' },
  { code: '5101', name: 'المشتريات', account_type: 'expense' },
  { code: '5201', name: 'المصروفات العامة التشغيلية', account_type: 'expense' },
  { code: '5202', name: 'تكلفة البضاعة المباعة (COGS)', account_type: 'expense' },
  { code: '5301', name: 'رواتب وأجور الموظفين', account_type: 'expense' },
];

const shortHex = () => Math.random().toString(16).slice(2, 14);

export async function POST(request: NextRequest) {
  let payload: RegisterPayload;
  try {
    payload = (await request.json()) as RegisterPayload;
  } catch {
    return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });
  }

  const pharmacyName = payload.pharmacyName?.trim();
  const ownerName = payload.ownerName?.trim();
  const email = payload.email?.trim().toLowerCase();
  const password = payload.password;
  const phone = payload.phone?.trim() || null;

  if (!pharmacyName || !ownerName || !email || !password) {
    return NextResponse.json({ error: 'يرجى استكمال جميع الحقول المطلوبة.' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const accountId = crypto.randomUUID();
  const branchId = `br_main_${shortHex()}`;
  const treasuryId = `tr_main_${shortHex()}`;
  const settingsId = `sett_${shortHex()}`;

  // 1. Create the Supabase Auth user (email/password) with tenant metadata.
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      account_id: accountId,
      assigned_branch_id: branchId,
      name: ownerName,
      role: 'owner',
    },
  });

  if (authError || !authData.user) {
    const message = authError?.message?.includes('already')
      ? 'هذا البريد الإلكتروني مسجّل بالفعل.'
      : authError?.message || 'تعذّر إنشاء حساب الدخول.';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const userId = authData.user.id;

  try {
    // 2. Owner profile row.
    const { error: userError } = await admin.from('users').insert({
      id: userId,
      account_id: accountId,
      assigned_branch_id: branchId,
      all_branches_access: true,
      allowed_branch_ids: [],
      name: ownerName,
      email,
      phone,
      role: 'owner',
      allow_login: true,
      is_active: true,
      is_deleted: false,
      sync_version: 1,
      created_at: now,
      last_modified: now,
    });
    if (userError) throw userError;

    // 3. Main branch.
    const { error: branchError } = await admin.from('branches').insert({
      id: branchId,
      account_id: accountId,
      name: pharmacyName,
      code: 'MAIN',
      is_main_branch: true,
      is_active: true,
      is_deleted: false,
      sync_version: 1,
      created_at: now,
      last_modified: now,
    });
    if (branchError) throw branchError;

    // 4. Main treasury.
    const { error: treasuryError } = await admin.from('treasuries').insert({
      id: treasuryId,
      account_id: accountId,
      branch_id: branchId,
      name: 'الخزينة الرئيسية',
      code: 'CASH-01',
      is_main: true,
      is_active: true,
      balance_piasters: 0,
      created_at: now,
      last_modified: now,
      is_deleted: false,
      sync_version: 1,
    });
    if (treasuryError) throw treasuryError;

    // 5. Pharmacy settings.
    const { error: settingsError } = await admin.from('app_settings').insert({
      id: settingsId,
      account_id: accountId,
      branch_id: branchId,
      pharmacy_name: pharmacyName,
      currency_symbol: 'ج.م',
      currency_position: 'after',
      enable_vat: false,
      vat_percentage: 0,
      enable_expiry_tracking: true,
      near_expiry_alert_days: 90,
      default_low_stock_threshold: 1,
      receipt_paper_size: 'thermal_80mm',
      barcode_symbology: 'CODE128',
      created_at: now,
      last_modified: now,
      is_deleted: false,
      sync_version: 1,
    });
    if (settingsError) throw settingsError;

    // 6. Default chart of accounts.
    const chartRows = DEFAULT_CHART.map((account, index) => ({
      id: `acc_${accountId.replace(/-/g, '').slice(0, 8)}${(index + 1).toString().padStart(4, '0')}`,
      account_id: accountId,
      code: account.code,
      name: account.name,
      account_type: account.account_type,
      balance_piasters: 0,
      is_active: true,
      created_at: now,
      last_modified: now,
      is_deleted: false,
      sync_version: 1,
    }));
    const { error: chartError } = await admin.from('chart_of_accounts').insert(chartRows);
    if (chartError) throw chartError;

    return NextResponse.json({ success: true, accountId, branchId });
  } catch (err) {
    // Roll back the auth user so the email can be reused.
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    const message = err instanceof Error ? err.message : 'تعذّر تجهيز بيانات الحساب.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
