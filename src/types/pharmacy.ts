/**
 * Falcon Pharmacy System - Domain Entities & Constants
 *
 * Thin, ergonomic aliases over the auto-generated database types
 * (`database.types.ts`). The generated file is the single source of truth
 * for the live `pharmacy_system` schema.
 */

import type { Database } from './database.types';

export type Json = Database['public']['Tables'] extends never ? never : unknown;

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// ---------------------------------------------------------------------------
// Core pharmacy entities
// ---------------------------------------------------------------------------
export type Medicine = Tables<'medicines'>;
export type MedicineInsert = TablesInsert<'medicines'>;
export type MedicineUpdate = TablesUpdate<'medicines'>;

export type MedicineCategory = Tables<'medicine_categories'>;
export type MedicineBrand = Tables<'medicine_brands'>;
export type MedicineUnit = Tables<'medicine_units'>;
export type MedicineUnitLevel = Tables<'medicine_unit_levels'>;
export type MedicineBarcode = Tables<'medicine_barcodes'>;
export type TherapeuticGroup = Tables<'therapeutic_groups'>;
export type ProductType = Tables<'product_types'>;

export type ItemBatch = Tables<'item_batches'>;
export type InventoryTransaction = Tables<'inventory_transactions'>;
export type StockAdjustment = Tables<'stock_adjustments'>;
export type StockTransfer = Tables<'stock_transfers'>;
export type StockTransferItem = Tables<'stock_transfer_items'>;
export type OpeningStock = Tables<'opening_stock'>;
export type DamagedStockLog = Tables<'damaged_stock_logs'>;
export type InventoryAudit = Tables<'inventory_audits'>;
export type InventoryAuditItem = Tables<'inventory_audit_items'>;

export type Customer = Tables<'customers'>;
export type CustomerInsert = TablesInsert<'customers'>;
export type Supplier = Tables<'suppliers'>;
export type SupplierInsert = TablesInsert<'suppliers'>;
export type SupplierCustomer = Tables<'supplier_customers'>;
export type Doctor = Tables<'doctors'>;
export type DoctorInsert = TablesInsert<'doctors'>;
export type ContactLedger = Tables<'contact_ledgers'>;
export type CustomerGroup = Tables<'customer_groups'>;

export type SaleInvoice = Tables<'sale_invoices'>;
export type SaleInvoiceInsert = TablesInsert<'sale_invoices'>;
export type SaleInvoiceItem = Tables<'sale_invoice_items'>;
export type SaleInvoiceItemInsert = TablesInsert<'sale_invoice_items'>;
export type InvoiceReturn = Tables<'invoice_returns'>;
export type InvoiceReturnItem = Tables<'invoice_return_items'>;
export type CashierShift = Tables<'cashier_shifts'>;
export type CashierShiftInsert = TablesInsert<'cashier_shifts'>;

export type PurchaseInvoice = Tables<'purchase_invoices'>;
export type PurchaseInvoiceInsert = TablesInsert<'purchase_invoices'>;
export type PurchaseInvoiceItem = Tables<'purchase_invoice_items'>;
export type PurchaseInvoiceItemInsert = TablesInsert<'purchase_invoice_items'>;
export type PurchaseReturn = Tables<'purchase_returns'>;
export type PurchaseOrder = Tables<'purchase_orders'>;
export type PurchaseOrderInsert = TablesInsert<'purchase_orders'>;
export type PurchaseOrderItem = Tables<'purchase_order_items'>;

export type Treasury = Tables<'treasuries'>;
export type TreasuryInsert = TablesInsert<'treasuries'>;
export type BankAccount = Tables<'bank_accounts'>;
export type Expense = Tables<'expenses'>;
export type ExpenseInsert = TablesInsert<'expenses'>;
export type ExpenseCategory = Tables<'expense_categories'>;
export type ExpenseCategoryInsert = TablesInsert<'expense_categories'>;
export type PaymentVoucher = Tables<'payment_vouchers'>;
export type PaymentVoucherInsert = TablesInsert<'payment_vouchers'>;
export type ChartOfAccount = Tables<'chart_of_accounts'>;
export type ChartOfAccountInsert = TablesInsert<'chart_of_accounts'>;
export type JournalEntry = Tables<'journal_entries'>;
export type JournalEntryInsert = TablesInsert<'journal_entries'>;
export type JournalEntryLine = Tables<'journal_entry_lines'>;

export type Branch = Tables<'branches'>;
export type PharmacyUser = Tables<'users'>;
export type AppSettings = Tables<'app_settings'>;
export type AppNotification = Tables<'app_notifications'>;
export type ActivityLog = Tables<'user_activity_logs'>;
export type Permission = Tables<'permissions'>;

export type EmployeeAttendance = Tables<'employee_attendance'>;
export type EmployeeLeave = Tables<'employee_leaves'>;
export type EmployeeAdvance = Tables<'employee_advances'>;
export type EmployeeDocument = Tables<'employee_documents'>;
export type EmployeePayroll = Tables<'employee_payrolls'>;
export type EmployeeMessage = Tables<'employee_messages'>;
export type Department = Tables<'departments'>;

// ---------------------------------------------------------------------------
// RPC result helpers
// ---------------------------------------------------------------------------
export type ProfitLossReport = Database['public']['Functions']['get_profit_loss_report']['Returns'][number];
export type FilteredMedicine = Database['public']['Functions']['get_filtered_medicines']['Returns'][number];
export type NearestExpiringBatch = Database['public']['Functions']['get_nearest_expiring_batches_for_pos']['Returns'][number];

// ---------------------------------------------------------------------------
// Domain constants
// ---------------------------------------------------------------------------
export const ACCOUNT_ID_META_KEY = 'account_id';
export const BRANCH_ID_META_KEY = 'assigned_branch_id';

export type UserRole = 'owner' | 'admin' | 'manager' | 'employee' | 'cashier' | 'accountant' | 'warehouse_keeper';

export const PAYMENT_METHODS = ['cash', 'card', 'credit', 'partial'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'نقدي',
  card: 'بطاقة',
  credit: 'آجل',
  partial: 'جزئي',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  paid: 'مدفوع',
  partial: 'مدفوع جزئياً',
  unpaid: 'غير مدفوع',
  pending: 'معلّق',
};

export const SHIPPING_STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
};

export const PURCHASE_STATUS_LABELS: Record<string, string> = {
  draft: 'مسودة',
  ordered: 'مطلوب',
  received: 'مستلم',
  partial: 'مستلم جزئياً',
  cancelled: 'ملغي',
};

/** Converts a stored piasters amount into a decimal EGP value. */
export const piastersToEgp = (piasters: number | null | undefined): number =>
  (piasters ?? 0) / 100;

/** Converts a decimal EGP value into the stored integer piasters amount. */
export const egpToPiasters = (egp: number): number => Math.round(egp * 100);
