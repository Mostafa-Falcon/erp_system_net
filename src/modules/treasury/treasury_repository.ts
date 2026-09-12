import { v4 as uuidv4 } from 'uuid';
import { db } from '@/core/db/app_database';
import { SyncQueueManager } from '@/core/sync/sync_queue_manager';
import type {
  Treasury,
  Expense,
  ExpenseCategory,
  FinancialVoucher,
  TreasuryType,
  VoucherType,
} from '@/types';

export class TreasuryRepository {
  /**
   * Get all active treasuries for organization
   */
  public static async getTreasuries(orgId: string): Promise<Treasury[]> {
    return await db.treasuries
      .where('org_id')
      .equals(orgId)
      .and((t) => t.is_active)
      .toArray();
  }

  /**
   * Get main/default treasury
   */
  public static async getDefaultTreasury(orgId: string): Promise<Treasury | undefined> {
    return await db.treasuries
      .where('org_id')
      .equals(orgId)
      .and((t) => t.is_default && t.is_active)
      .first();
  }

  /**
   * Create a new treasury account (cash safe, bank account, or POS terminal)
   */
  public static async createTreasury(params: {
    orgId: string;
    branchId?: string | null;
    name: string;
    type: TreasuryType;
    openingBalance: number;
    isDefault: boolean;
  }): Promise<Treasury> {
    const now = new Date().toISOString();
    const treasuryId = uuidv4();

    const treasury: Treasury = {
      id: treasuryId,
      org_id: params.orgId,
      branch_id: params.branchId || undefined,
      name: params.name,
      type: params.type,
      current_balance: params.openingBalance,
      is_default: params.isDefault,
      is_active: true,
      created_at: now,
      updated_at: now,
      sync_status: 'pending',
    };

    await db.transaction('rw', [db.treasuries, db.sync_queue], async () => {
      if (params.isDefault) {
        const orgTreasuries = await db.treasuries.where('org_id').equals(params.orgId).toArray();
        for (const t of orgTreasuries) {
          if (t.is_default) {
            await db.treasuries.put({ ...t, is_default: false, updated_at: now, sync_status: 'pending' });
          }
        }
      }
      await db.treasuries.add(treasury);
      await SyncQueueManager.enqueue('treasuries', treasuryId, 'insert', treasury);
    });

    return treasury;
  }

  /**
   * Set a treasury as the default (main) one, clearing the flag on others
   */
  public static async setDefaultTreasury(treasuryId: string, orgId: string): Promise<void> {
    const now = new Date().toISOString();
    const target = await db.treasuries.get(treasuryId);
    if (!target || target.org_id !== orgId) throw new Error('الخزينة غير موجودة');

    await db.transaction('rw', [db.treasuries, db.sync_queue], async () => {
      const orgTreasuries = await db.treasuries.where('org_id').equals(orgId).toArray();
      for (const t of orgTreasuries) {
        const next = t.id === treasuryId ? { ...t, is_default: true } : { ...t, is_default: false };
        if (next.is_default !== t.is_default) {
          next.updated_at = now;
          next.sync_status = 'pending';
          await db.treasuries.put(next);
          await SyncQueueManager.enqueue('treasuries', next.id, 'update', next);
        }
      }
    });
  }

  /**
   * Toggle treasury active state (soft delete)
   */
  public static async toggleTreasuryActive(treasuryId: string): Promise<void> {
    const treasury = await db.treasuries.get(treasuryId);
    if (!treasury) throw new Error('الخزينة غير موجودة');
    if (treasury.is_default && treasury.is_active) {
      throw new Error('لا يمكن إيقاف الخزينة الرئيسية. عيّن خزينة رئيسية أخرى أولاً.');
    }

    const updated: Treasury = {
      ...treasury,
      is_active: !treasury.is_active,
      updated_at: new Date().toISOString(),
      sync_status: 'pending',
    };

    await db.transaction('rw', [db.treasuries, db.sync_queue], async () => {
      await db.treasuries.put(updated);
      await SyncQueueManager.enqueue('treasuries', treasuryId, 'update', updated);
    });
  }

  /**
   * Get all financial vouchers (receipts & payments) for organization
   */
  public static async getVouchers(orgId: string): Promise<FinancialVoucher[]> {
    const list = await db.financial_vouchers.where('org_id').equals(orgId).toArray();
    return list.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  /**
   * Get all expenses for organization
   */
  public static async getExpenses(orgId: string): Promise<Expense[]> {
    const list = await db.expenses.where('org_id').equals(orgId).toArray();
    return list.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  /**
   * Create an expense category
   */
  public static async createExpenseCategory(orgId: string, name: string): Promise<ExpenseCategory> {
    const now = new Date().toISOString();
    const categoryId = uuidv4();

    const category: ExpenseCategory = {
      id: categoryId,
      org_id: orgId,
      name: name.trim(),
      is_active: true,
      created_at: now,
      updated_at: now,
      sync_status: 'pending',
    };

    await db.transaction('rw', [db.expense_categories, db.sync_queue], async () => {
      await db.expense_categories.add(category);
      await SyncQueueManager.enqueue('expense_categories', categoryId, 'insert', category);
    });

    return category;
  }

  /**
   * Toggle expense category active state
   */
  public static async toggleExpenseCategoryActive(categoryId: string): Promise<void> {
    const category = await db.expense_categories.get(categoryId);
    if (!category) throw new Error('الفئة غير موجودة');

    const updated: ExpenseCategory = {
      ...category,
      is_active: !category.is_active,
      updated_at: new Date().toISOString(),
      sync_status: 'pending',
    };

    await db.transaction('rw', [db.expense_categories, db.sync_queue], async () => {
      await db.expense_categories.put(updated);
      await SyncQueueManager.enqueue('expense_categories', categoryId, 'update', updated);
    });
  }

  /**
   * Modify treasury balance atomically
   */
  public static async adjustBalance(treasuryId: string, deltaAmount: number): Promise<number> {
    const treasury = await db.treasuries.get(treasuryId);
    if (!treasury) throw new Error('الخزينة غير موجودة');

    const newBalance = treasury.current_balance + deltaAmount;
    const now = new Date().toISOString();

    const updated: Treasury = {
      ...treasury,
      current_balance: newBalance,
      updated_at: now,
      sync_status: 'pending',
    };

    await db.treasuries.put(updated);
    await SyncQueueManager.enqueue('treasuries', treasuryId, 'update', updated);

    return newBalance;
  }

  /**
   * Record Financial Voucher (Receipt or Payment)
   */
  public static async createVoucher(params: {
    orgId: string;
    type: VoucherType;
    treasuryId: string;
    contactId?: string | null;
    shiftId?: string | null;
    amount: number;
    description: string;
    referenceNo?: string;
    userId: string;
  }): Promise<FinancialVoucher> {
    const now = new Date().toISOString();
    const voucherId = uuidv4();
    const count = await db.financial_vouchers.count();
    const prefix = params.type === 'receipt' ? 'RV' : 'PV';
    const voucherNo = `${prefix}-${String(count + 1).padStart(5, '0')}`;

    const voucher: FinancialVoucher = {
      id: voucherId,
      org_id: params.orgId,
      voucher_no: voucherNo,
      type: params.type,
      treasury_id: params.treasuryId,
      contact_id: params.contactId,
      shift_id: params.shiftId,
      amount: params.amount,
      description: params.description,
      reference_no: params.referenceNo,
      created_by: params.userId,
      created_at: now,
      sync_status: 'pending',
    };

    await db.transaction('rw', [db.financial_vouchers, db.treasuries, db.sync_queue], async () => {
      await db.financial_vouchers.add(voucher);
      await SyncQueueManager.enqueue('financial_vouchers', voucherId, 'insert', voucher);

      // Receipt increases balance, Payment decreases balance
      const delta = params.type === 'receipt' ? params.amount : -params.amount;
      await this.adjustBalance(params.treasuryId, delta);
    });

    return voucher;
  }

  /**
   * Record operational expense
   */
  public static async recordExpense(params: {
    orgId: string;
    categoryId: string;
    treasuryId: string;
    shiftId?: string | null;
    amount: number;
    description: string;
    receiptNumber?: string;
    userId: string;
  }): Promise<Expense> {
    const now = new Date().toISOString();
    const expenseId = uuidv4();

    const expense: Expense = {
      id: expenseId,
      org_id: params.orgId,
      category_id: params.categoryId,
      treasury_id: params.treasuryId,
      shift_id: params.shiftId,
      amount: params.amount,
      description: params.description,
      receipt_number: params.receiptNumber,
      created_by: params.userId,
      created_at: now,
      sync_status: 'pending',
    };

    await db.transaction('rw', [db.expenses, db.treasuries, db.sync_queue], async () => {
      await db.expenses.add(expense);
      await SyncQueueManager.enqueue('expenses', expenseId, 'insert', expense);

      // Deduct from treasury
      await this.adjustBalance(params.treasuryId, -params.amount);
    });

    return expense;
  }

  /**
   * Get all expense categories
   */
  public static async getExpenseCategories(orgId: string): Promise<ExpenseCategory[]> {
    return await db.expense_categories.where('org_id').equals(orgId).toArray();
  }
}
