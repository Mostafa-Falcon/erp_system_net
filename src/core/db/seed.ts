import { v4 as uuidv4 } from 'uuid';
import { db } from './app_database';
import type {
  Organization,
  Branch,
  Warehouse,
  Treasury,
  Unit,
  ExpenseCategory,
  User,
  AppSetting,
} from '@/types';

/**
 * ضمان بداية نظيفة وخالية من أي بيانات افتراضية إذا لم تكن هناك أصناف مسجلة
 */
export async function ensureCleanLookupState(): Promise<void> {
  try {
    if (typeof window !== 'undefined' && !localStorage.getItem('falcon_catalog_clean_v1')) {
      const prodCount = await db.products.count();
      if (prodCount === 0) {
        await db.product_categories.clear();
        await db.product_types.clear();
        await db.product_brands.clear();
      }
      localStorage.setItem('falcon_catalog_clean_v1', 'true');
    }
  } catch (err) {
    console.warn('ensureCleanLookupState notice:', err);
  }
}

/**
 * 🦅 Falcon ERP - Local Database Seeder
 * Seeds essential lookup data for first-time boot offline.
 */
export async function seedInitialData(): Promise<void> {
  await ensureCleanLookupState();
  const orgCount = await db.organizations.count();
  if (orgCount > 0) {
    return; // Already seeded
  }

  const now = new Date().toISOString();
  const orgId = uuidv4();
  const branchId = uuidv4();
  const warehouseId = uuidv4();
  const treasuryId = uuidv4();
  const adminUserId = uuidv4();

  // 1. Organization
  const org: Organization = {
    id: orgId,
    name: 'المؤسسة التجارية الحديثة',
    legal_name: 'شركة التجارة والحلول المتكاملة ش.ذ.م.م',
    tax_number: '100-200-300',
    commercial_reg_no: '45678',
    currency: 'EGP',
    phone: '01000000000',
    address: 'المقر الرئيسي - القاهرة',
    is_active: true,
    created_at: now,
    updated_at: now,
    sync_status: 'pending',
  };

  // 2. Main Branch
  const branch: Branch = {
    id: branchId,
    org_id: orgId,
    code: 'BR-01',
    name: 'الفرع الرئيسي',
    is_main: true,
    is_active: true,
    created_at: now,
    updated_at: now,
    sync_status: 'pending',
  };

  // 3. Main Warehouse
  const warehouse: Warehouse = {
    id: warehouseId,
    org_id: orgId,
    branch_id: branchId,
    code: 'WH-01',
    name: 'المستودع الرئيسي',
    location: 'المقر الرئيسي',
    is_main: true,
    is_active: true,
    created_at: now,
    updated_at: now,
    sync_status: 'pending',
  };

  // 4. Main Treasury
  const treasury: Treasury = {
    id: treasuryId,
    org_id: orgId,
    branch_id: branchId,
    name: 'الخزينة الرئيسية',
    type: 'safe',
    current_balance: 0,
    is_default: true,
    is_active: true,
    created_at: now,
    updated_at: now,
    sync_status: 'pending',
  };

  // 5. Default Standard Units
  const defaultUnits: Unit[] = [
    { id: uuidv4(), org_id: orgId, name: 'قطعة', symbol: 'قطعة', is_active: true, created_at: now, updated_at: now, sync_status: 'pending' },
    { id: uuidv4(), org_id: orgId, name: 'علبة', symbol: 'علبة', is_active: true, created_at: now, updated_at: now, sync_status: 'pending' },
    { id: uuidv4(), org_id: orgId, name: 'دستة', symbol: 'دستة', is_active: true, created_at: now, updated_at: now, sync_status: 'pending' },
    { id: uuidv4(), org_id: orgId, name: 'كرتونة', symbol: 'كرتونة', is_active: true, created_at: now, updated_at: now, sync_status: 'pending' },
    { id: uuidv4(), org_id: orgId, name: 'كيلوجرام', symbol: 'كجم', is_active: true, created_at: now, updated_at: now, sync_status: 'pending' },
    { id: uuidv4(), org_id: orgId, name: 'جرام', symbol: 'جرام', is_active: true, created_at: now, updated_at: now, sync_status: 'pending' },
    { id: uuidv4(), org_id: orgId, name: 'لتر', symbol: 'لتر', is_active: true, created_at: now, updated_at: now, sync_status: 'pending' },
    { id: uuidv4(), org_id: orgId, name: 'متر', symbol: 'م', is_active: true, created_at: now, updated_at: now, sync_status: 'pending' },
  ];

  // 6. Default Expense Categories
  const defaultExpenseCategories: ExpenseCategory[] = [
    { id: uuidv4(), org_id: orgId, name: 'إيجارات ومقرات', code: 'EXP-01', is_active: true, created_at: now, updated_at: now, sync_status: 'pending' },
    { id: uuidv4(), org_id: orgId, name: 'كهرباء ومياه ومرافق', code: 'EXP-02', is_active: true, created_at: now, updated_at: now, sync_status: 'pending' },
    { id: uuidv4(), org_id: orgId, name: 'رواتب وأجور', code: 'EXP-03', is_active: true, created_at: now, updated_at: now, sync_status: 'pending' },
    { id: uuidv4(), org_id: orgId, name: 'صيانة وتشغيل', code: 'EXP-04', is_active: true, created_at: now, updated_at: now, sync_status: 'pending' },
    { id: uuidv4(), org_id: orgId, name: 'نقل وشحن ولوجستيات', code: 'EXP-05', is_active: true, created_at: now, updated_at: now, sync_status: 'pending' },
    { id: uuidv4(), org_id: orgId, name: 'مصروفات عمومية وإدارية', code: 'EXP-06', is_active: true, created_at: now, updated_at: now, sync_status: 'pending' },
  ];

  // 7. System Settings
  const defaultSettings: AppSetting[] = [
    { id: 'vat_rate', org_id: orgId, value: '14', description: 'نسبة ضريبة القيمة المضافة الافتراضية (%)', updated_at: now, sync_status: 'pending' },
    { id: 'allow_negative_stock', org_id: orgId, value: 'false', description: 'السماح بالبيع بالسالب', updated_at: now, sync_status: 'pending' },
    { id: 'default_low_stock_threshold', org_id: orgId, value: '5', description: 'حد تنبيه الرصيد المنخفض الافتراضي', updated_at: now, sync_status: 'pending' },
    { id: 'active_org_id', org_id: orgId, value: orgId, description: 'المؤسسة النشطة محلياً', updated_at: now, sync_status: 'pending' },
    { id: 'active_branch_id', org_id: orgId, value: branchId, description: 'الفرع النشط محلياً', updated_at: now, sync_status: 'pending' },
  ];

  // 8. Super Admin User
  const adminUser: User = {
    id: adminUserId,
    org_id: orgId,
    branch_id: branchId,
    username: 'admin',
    full_name: 'مدير النظام الرئيسي',
    role: 'super_admin',
    pin_code_hash: '1234', // Default offline PIN: 1234
    is_active: true,
    created_at: now,
    updated_at: now,
    sync_status: 'pending',
  };

  // Atomic database seed execution
  await db.transaction(
    'rw',
    [
      db.organizations,
      db.branches,
      db.warehouses,
      db.treasuries,
      db.units,
      db.expense_categories,
      db.app_settings,
      db.users,
    ],
    async () => {
      await db.organizations.put(org);
      await db.branches.put(branch);
      await db.warehouses.put(warehouse);
      await db.treasuries.put(treasury);
      await db.units.bulkPut(defaultUnits);
      await db.expense_categories.bulkPut(defaultExpenseCategories);
      await db.app_settings.bulkPut(defaultSettings);
      await db.users.put(adminUser);
    }
  );
}
