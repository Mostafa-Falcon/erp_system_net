/**
 * 🦅 LOGIXA FALCON ERP CORE TYPES
 * Universal Standard ERP Entities & Domain Models
 * Designed for offline-first local Dexie.js + cloud Supabase sync
 */

export type EntityId = string;
export type ISODateString = string;

// ==========================================
// 1. ORGANIZATIONAL & SYSTEM
// ==========================================

export interface Organization {
  id: EntityId;
  name: string;
  legal_name?: string;
  tax_number?: string;
  commercial_reg_no?: string;
  currency: string; // e.g. EGP, SAR, USD
  phone?: string;
  email?: string;
  address?: string;
  logo_url?: string;
  created_at: ISODateString;
  updated_at: ISODateString;
  is_active: boolean;
  sync_status?: 'synced' | 'pending' | 'failed';
}

export interface Branch {
  id: EntityId;
  org_id: EntityId;
  code: string;
  name: string;
  phone?: string;
  address?: string;
  is_main: boolean;
  is_active: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
  sync_status?: 'synced' | 'pending' | 'failed';
}

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'cashier' | 'accountant' | 'warehouse_keeper';

export interface User {
  id: EntityId;
  org_id: EntityId;
  branch_id?: EntityId;
  username: string;
  full_name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  pin_code_hash?: string; // For rapid cashier shift switch offline
  is_active: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
  sync_status?: 'synced' | 'pending' | 'failed';
}

export interface AppSetting {
  id: EntityId; // key, e.g. "vat_rate", "allow_negative_stock"
  org_id: EntityId;
  value: string; // JSON stringified or raw string
  description?: string;
  updated_at: ISODateString;
  sync_status?: 'synced' | 'pending' | 'failed';
}

// ==========================================
// 2. INVENTORY & CATALOG (UNIVERSAL ERP)
// ==========================================

export type ItemType = 'storable' | 'service' | 'composite';

export interface ProductCategory {
  id: EntityId;
  org_id: EntityId;
  parent_id?: EntityId | null; // For hierarchical trees
  name: string;
  code?: string;
  is_active: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
  sync_status?: 'synced' | 'pending' | 'failed';
}

export interface ProductBrand {
  id: EntityId;
  org_id: EntityId;
  name: string;
  created_at: ISODateString;
  updated_at: ISODateString;
  sync_status?: 'synced' | 'pending' | 'failed';
}

export interface ProductTypeItem {
  id: EntityId;
  org_id: EntityId;
  name: string;
  code?: string;
  is_active?: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
  sync_status?: 'synced' | 'pending' | 'failed';
}

export interface Unit {
  id: EntityId;
  org_id: EntityId;
  name: string; // e.g. قطعة, علبة, كرتونة, كجم, متر
  symbol: string; // e.g. pcs, box, ctn, kg, m
  is_active: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
  sync_status?: 'synced' | 'pending' | 'failed';
}

export interface Product {
  id: EntityId;
  org_id: EntityId;
  sku: string; // Barcode or Item Code
  name: string;
  category_id?: EntityId | null;
  brand_id?: EntityId | null;
  item_type: ItemType;
  product_type?: string; // نوع الصنف التجاري العام (حسب نشاط المنشأة)
  
  // Measurement & Level configuration
  measurement_type?: 'unit' | 'weight'; // قطعة/وحدات أو بالوزن (كيلو)
  has_levels?: boolean; // هل له مستويات تعبئة منفصلة
  scale_code?: string; // كود ميزان الباركود
  
  // Base unit configuration
  base_unit_id: EntityId;
  
  // Pricing
  purchase_price: number;
  sale_price: number;
  old_sale_price?: number; // سعر البيع القديم في حالة التسعير المزدوج
  has_dual_pricing?: boolean; // هل الصنف مفعل به التسعير المزدوج
  wholesale_price?: number;
  min_sale_price?: number;
  
  // Tax / VAT
  tax_rate: number; // e.g. 14 for 14%
  is_tax_inclusive: boolean;
  
  // Inventory tracking flags
  tracks_batch: boolean; // For batch / lot numbers
  tracks_expiry: boolean; // For expiry dates (food, pharma, chemicals)
  expiry_alert_days?: number; // أيام التنبيه قبل انتهاء الصلاحية
  min_stock_alert: number;
  max_stock_limit?: number;
  
  // Extended specifications & metadata
  name_en?: string; // اسم الصنف بالإنجليزي
  scientific_name?: string; // الاسم العلمي / الوصف الإضافي / المادة الفعالة
  shelf_location?: string; // المكان / الرف
  alternate_barcodes?: string[]; // باركود بديل
  is_taxable?: boolean; // صنف ضريبي
  is_quick_pos?: boolean; // صنف سريع في شاشة البيع POS Quick Access
  notes?: string; // ملاحظات الصنف
  
  description?: string;
  image_url?: string;
  is_active: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
  sync_status?: 'synced' | 'pending' | 'failed';
}

/**
 * Multi-unit hierarchy (e.g. 1 Carton = 12 Boxes = 144 Pieces)
 */
export interface ProductUnit {
  id: EntityId;
  product_id: EntityId;
  unit_id: EntityId;
  conversion_factor: number; // How many base units in this unit (explicitly set)
  barcode?: string;
  purchase_price?: number; // Independent purchase price
  sale_price?: number; // Independent sale price
  old_sale_price?: number; // سعر البيع القديم للمستوى
  has_dual_pricing?: boolean; // هل المستوى مفعل به التسعير المزدوج
  wholesale_price?: number; // Independent wholesale price
  min_sale_price?: number; // Independent min sale price
  is_default_sale?: boolean;
  is_default_purchase?: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
  sync_status?: 'synced' | 'pending' | 'failed';
}

export interface ProductBatch {
  id: EntityId;
  org_id?: EntityId;
  product_id: EntityId;
  warehouse_id: EntityId;
  batch_number: string;
  expiry_date?: ISODateString | null;
  initial_quantity: number; // in base units
  current_quantity: number; // in base units
  purchase_price?: number;
  created_at: ISODateString;
  updated_at: ISODateString;
  sync_status?: 'synced' | 'pending' | 'failed';
}

export interface Warehouse {
  id: EntityId;
  org_id: EntityId;
  branch_id?: EntityId;
  code: string;
  name: string;
  location?: string;
  is_main: boolean;
  is_active: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
  sync_status?: 'synced' | 'pending' | 'failed';
}

export interface StockLevel {
  id: EntityId; // `${warehouse_id}_${product_id}`
  org_id: EntityId;
  warehouse_id: EntityId;
  product_id: EntityId;
  quantity: number; // Total in base unit
  reserved_quantity: number;
  available_quantity: number;
  updated_at: ISODateString;
  sync_status?: 'synced' | 'pending' | 'failed';
}

export type InventoryTransactionType = 
  | 'opening_stock' 
  | 'purchase' 
  | 'sale' 
  | 'sale_return' 
  | 'purchase_return' 
  | 'transfer_in' 
  | 'transfer_out' 
  | 'adjustment_in' 
  | 'adjustment_out' 
  | 'damaged';

export interface InventoryTransaction {
  id: EntityId;
  org_id: EntityId;
  warehouse_id: EntityId;
  product_id: EntityId;
  batch_id?: EntityId | null;
  transaction_type: InventoryTransactionType;
  reference_type?: 'sale_invoice' | 'purchase_invoice' | 'transfer' | 'manual';
  reference_id?: EntityId | null;
  quantity: number;
  unit_id: EntityId;
  unit_conversion_factor: number;
  base_quantity: number; // quantity * conversion_factor
  unit_cost: number;
  total_cost: number;
  balance_after: number; // running balance in warehouse
  notes?: string;
  created_by: EntityId;
  created_at: ISODateString;
  sync_status?: 'synced' | 'pending' | 'failed';
}

export interface StockTransfer {
  id: EntityId;
  org_id: EntityId;
  transfer_no: string;
  from_warehouse_id: EntityId;
  to_warehouse_id: EntityId;
  status: 'draft' | 'pending' | 'completed' | 'cancelled';
  notes?: string;
  created_by: EntityId;
  created_at: ISODateString;
  completed_at?: ISODateString | null;
  sync_status?: 'synced' | 'pending' | 'failed';
}

export interface StockTransferItem {
  id: EntityId;
  transfer_id: EntityId;
  product_id: EntityId;
  batch_id?: EntityId | null;
  unit_id: EntityId;
  conversion_factor: number;
  quantity: number; // In selected unit
  base_quantity: number; // quantity * conversion_factor
  unit_cost: number;
  total_cost: number;
}

// ==========================================
// 3. CONTACTS (CUSTOMERS & SUPPLIERS)
// ==========================================

export type ContactType = 'customer' | 'supplier' | 'both';

export interface Contact {
  id: EntityId;
  org_id: EntityId;
  name: string;
  type: ContactType;
  code?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  tax_number?: string;
  address?: string;
  credit_limit: number;
  current_balance: number; // positive = owed by contact (debit), negative = owed to contact (credit)
  is_active: boolean;
  notes?: string;
  created_at: ISODateString;
  updated_at: ISODateString;
  sync_status?: 'synced' | 'pending' | 'failed';
}

export interface ContactTransaction {
  id: EntityId;
  org_id: EntityId;
  contact_id: EntityId;
  reference_type: 'sale_invoice' | 'purchase_invoice' | 'purchase_return' | 'receipt_voucher' | 'payment_voucher' | 'opening_balance';
  reference_id: EntityId;
  debit: number; // مدين
  credit: number; // دائن
  balance_after: number;
  notes?: string;
  created_at: ISODateString;
  sync_status?: 'synced' | 'pending' | 'failed';
}

// ==========================================
// 4. TREASURY & FINANCIALS
// ==========================================

export type TreasuryType = 'safe' | 'bank' | 'pos_terminal';

export interface Treasury {
  id: EntityId;
  org_id: EntityId;
  branch_id?: EntityId;
  name: string;
  type: TreasuryType;
  current_balance: number;
  is_default: boolean;
  is_active: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
  sync_status?: 'synced' | 'pending' | 'failed';
}

export interface ExpenseCategory {
  id: EntityId;
  org_id: EntityId;
  name: string;
  code?: string;
  is_active: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
  sync_status?: 'synced' | 'pending' | 'failed';
}

export interface Expense {
  id: EntityId;
  org_id: EntityId;
  category_id: EntityId;
  treasury_id: EntityId;
  shift_id?: EntityId | null;
  amount: number;
  description: string;
  receipt_number?: string;
  created_by: EntityId;
  created_at: ISODateString;
  sync_status?: 'synced' | 'pending' | 'failed';
}

export type VoucherType = 'receipt' | 'payment'; // قبض أو صرف

export interface FinancialVoucher {
  id: EntityId;
  org_id: EntityId;
  voucher_no: string;
  type: VoucherType;
  treasury_id: EntityId;
  contact_id?: EntityId | null;
  shift_id?: EntityId | null;
  amount: number;
  description: string;
  reference_no?: string;
  created_by: EntityId;
  created_at: ISODateString;
  sync_status?: 'synced' | 'pending' | 'failed';
}

// ==========================================
// 5. SALES & POS ENGINE
// ==========================================

export interface CashierShift {
  id: EntityId;
  org_id: EntityId;
  branch_id: EntityId;
  user_id: EntityId;
  treasury_id: EntityId;
  shift_number: number;
  opened_at: ISODateString;
  closed_at?: ISODateString | null;
  opening_balance: number;
  total_sales_cash: number;
  total_sales_card: number;
  total_sales_credit: number;
  total_returns_cash: number;
  total_expenses: number;
  expected_closing_balance: number;
  actual_closing_balance?: number | null;
  difference?: number | null; // deficit or surplus (عجز أو زيادة)
  status: 'open' | 'closed';
  notes?: string;
  sync_status?: 'synced' | 'pending' | 'failed';
}

export type InvoicePaymentType = 'cash' | 'card' | 'credit' | 'split';
export type InvoiceStatus = 'draft' | 'completed' | 'suspended' | 'cancelled';

export interface SalesInvoice {
  id: EntityId;
  org_id: EntityId;
  branch_id: EntityId;
  warehouse_id: EntityId;
  shift_id?: EntityId | null;
  invoice_number: string;
  invoice_date: ISODateString;
  customer_id?: EntityId | null;
  
  // Amounts
  subtotal: number;
  discount_amount: number;
  discount_percent: number;
  tax_amount: number;
  total: number;
  paid_amount: number;
  remaining_amount: number;
  
  payment_type: InvoicePaymentType;
  cash_amount: number;
  card_amount: number;
  
  treasury_id: EntityId;
  status: InvoiceStatus;
  notes?: string;
  created_by: EntityId;
  created_at: ISODateString;
  updated_at: ISODateString;
  sync_status?: 'synced' | 'pending' | 'failed';
}

export interface SalesInvoiceItem {
  id: EntityId;
  invoice_id: EntityId;
  product_id: EntityId;
  batch_id?: EntityId | null;
  unit_id: EntityId;
  conversion_factor: number;
  quantity: number;
  base_quantity: number;
  unit_price: number;
  unit_cost: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes?: string;
}

export interface SalesReturn {
  id: EntityId;
  org_id: EntityId;
  branch_id: EntityId;
  warehouse_id: EntityId;
  original_invoice_id?: EntityId | null;
  shift_id?: EntityId | null;
  return_number: string;
  return_date: ISODateString;
  customer_id?: EntityId | null;
  total: number;
  refunded_amount: number;
  treasury_id: EntityId;
  reason?: string;
  created_by: EntityId;
  created_at: ISODateString;
  sync_status?: 'synced' | 'pending' | 'failed';
}

// ==========================================
// 6. PURCHASES & SUPPLIERS
// ==========================================

export interface PurchaseInvoice {
  id: EntityId;
  org_id: EntityId;
  branch_id: EntityId;
  warehouse_id: EntityId;
  supplier_id: EntityId;
  invoice_number: string; // Supplier's invoice number
  system_invoice_number: string;
  invoice_date: ISODateString;
  
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  paid_amount: number;
  remaining_amount: number;
  
  payment_type: InvoicePaymentType;
  treasury_id?: EntityId | null;
  status: InvoiceStatus;
  notes?: string;
  created_by: EntityId;
  created_at: ISODateString;
  updated_at: ISODateString;
  sync_status?: 'synced' | 'pending' | 'failed';
}

export interface PurchaseInvoiceItem {
  id: EntityId;
  invoice_id: EntityId;
  product_id: EntityId;
  batch_number?: string;
  expiry_date?: ISODateString | null;
  unit_id: EntityId;
  conversion_factor: number;
  quantity: number;
  base_quantity: number;
  unit_cost: number;
  sale_price?: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
}

export interface PurchaseReturn {
  id: EntityId;
  org_id: EntityId;
  branch_id: EntityId;
  warehouse_id: EntityId;
  original_invoice_id?: EntityId | null;
  supplier_id: EntityId;
  return_number: string;
  return_date: ISODateString;
  total: number;
  refunded_amount: number;
  treasury_id?: EntityId | null;
  reason?: string;
  created_by: EntityId;
  created_at: ISODateString;
  sync_status?: 'synced' | 'pending' | 'failed';
}

// ==========================================
// 7. OFFLINE-FIRST SYNC QUEUE (OUTBOX PATTERN)
// ==========================================

export type SyncOperation = 'insert' | 'update' | 'delete' | 'upsert';
export type SyncStatus = 'pending' | 'in_flight' | 'synced' | 'failed' | 'conflict';

export interface SyncQueueItem {
  id: EntityId;
  entity_table: string; // e.g. "products", "sales_invoices"
  entity_id: EntityId;
  operation: SyncOperation;
  payload: string; // JSON stringified data
  status: SyncStatus;
  retry_count: number;
  last_error?: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface ActivityLog {
  id: EntityId;
  org_id: EntityId;
  user_id?: EntityId | null;
  user_name?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: string;
  ip_address?: string;
  created_at: ISODateString;
  sync_status?: 'synced' | 'pending' | 'failed';
}
