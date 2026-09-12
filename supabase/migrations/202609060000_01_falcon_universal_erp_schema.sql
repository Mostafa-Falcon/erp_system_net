-- 🦅 FALCON UNIVERSAL ERP CORE CLOUD SCHEMA
-- Migration: 202609060000_01_falcon_universal_erp_schema.sql
-- Multi-tenant, General-domain ERP Schema with RLS and Audit Triggers

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Helper trigger for automatic updated_at timestamps
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 1. ORGANIZATIONAL & SYSTEM
-- ==========================================

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  legal_name TEXT,
  tax_number TEXT,
  commercial_reg_no TEXT,
  currency VARCHAR(10) NOT NULL DEFAULT 'EGP',
  phone TEXT,
  email TEXT,
  address TEXT,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  is_main BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role VARCHAR(50) NOT NULL DEFAULT 'cashier',
  pin_code_hash TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT NOT NULL,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, org_id)
);

-- ==========================================
-- 2. INVENTORY & CATALOG
-- ==========================================

CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  code VARCHAR(50),
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sku VARCHAR(100) NOT NULL,
  name TEXT NOT NULL,
  category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  brand_id UUID REFERENCES product_brands(id) ON DELETE SET NULL,
  item_type VARCHAR(30) NOT NULL DEFAULT 'storable',
  base_unit_id UUID NOT NULL REFERENCES units(id),
  purchase_price NUMERIC(15, 4) NOT NULL DEFAULT 0,
  sale_price NUMERIC(15, 4) NOT NULL DEFAULT 0,
  wholesale_price NUMERIC(15, 4) DEFAULT 0,
  min_sale_price NUMERIC(15, 4) DEFAULT 0,
  tax_rate NUMERIC(6, 2) NOT NULL DEFAULT 0,
  is_tax_inclusive BOOLEAN NOT NULL DEFAULT false,
  tracks_batch BOOLEAN NOT NULL DEFAULT false,
  tracks_expiry BOOLEAN NOT NULL DEFAULT false,
  min_stock_alert NUMERIC(15, 4) NOT NULL DEFAULT 0,
  max_stock_limit NUMERIC(15, 4),
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  conversion_factor NUMERIC(15, 4) NOT NULL DEFAULT 1,
  barcode VARCHAR(100),
  purchase_price NUMERIC(15, 4),
  sale_price NUMERIC(15, 4),
  wholesale_price NUMERIC(15, 4),
  is_default_sale BOOLEAN DEFAULT false,
  is_default_purchase BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  code VARCHAR(50) NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  is_main BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_levels (
  id TEXT PRIMARY KEY, -- warehouseId_productId
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity NUMERIC(15, 4) NOT NULL DEFAULT 0,
  reserved_quantity NUMERIC(15, 4) NOT NULL DEFAULT 0,
  available_quantity NUMERIC(15, 4) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  batch_id UUID,
  transaction_type VARCHAR(50) NOT NULL,
  reference_type VARCHAR(50),
  reference_id UUID,
  quantity NUMERIC(15, 4) NOT NULL,
  unit_id UUID NOT NULL REFERENCES units(id),
  unit_conversion_factor NUMERIC(15, 4) NOT NULL DEFAULT 1,
  base_quantity NUMERIC(15, 4) NOT NULL,
  unit_cost NUMERIC(15, 4) NOT NULL DEFAULT 0,
  total_cost NUMERIC(15, 4) NOT NULL DEFAULT 0,
  balance_after NUMERIC(15, 4) NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 3. CONTACTS (CUSTOMERS & SUPPLIERS)
-- ==========================================

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'customer', 'supplier', 'both'
  code VARCHAR(50),
  phone TEXT,
  mobile TEXT,
  email TEXT,
  tax_number TEXT,
  address TEXT,
  credit_limit NUMERIC(15, 4) NOT NULL DEFAULT 0,
  current_balance NUMERIC(15, 4) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contact_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  reference_type VARCHAR(50) NOT NULL,
  reference_id UUID NOT NULL,
  debit NUMERIC(15, 4) NOT NULL DEFAULT 0,
  credit NUMERIC(15, 4) NOT NULL DEFAULT 0,
  balance_after NUMERIC(15, 4) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 4. TREASURY & FINANCIALS
-- ==========================================

CREATE TABLE IF NOT EXISTS treasuries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type VARCHAR(30) NOT NULL DEFAULT 'safe',
  current_balance NUMERIC(15, 4) NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT,
  treasury_id UUID NOT NULL REFERENCES treasuries(id) ON DELETE RESTRICT,
  shift_id UUID,
  amount NUMERIC(15, 4) NOT NULL,
  description TEXT NOT NULL,
  receipt_number TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS financial_vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  voucher_no VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'receipt' or 'payment'
  treasury_id UUID NOT NULL REFERENCES treasuries(id) ON DELETE RESTRICT,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  shift_id UUID,
  amount NUMERIC(15, 4) NOT NULL,
  description TEXT NOT NULL,
  reference_no TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 5. SALES & POS ENGINE
-- ==========================================

CREATE TABLE IF NOT EXISTS cashier_shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  treasury_id UUID NOT NULL REFERENCES treasuries(id) ON DELETE RESTRICT,
  shift_number INT NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  opening_balance NUMERIC(15, 4) NOT NULL DEFAULT 0,
  total_sales_cash NUMERIC(15, 4) NOT NULL DEFAULT 0,
  total_sales_card NUMERIC(15, 4) NOT NULL DEFAULT 0,
  total_sales_credit NUMERIC(15, 4) NOT NULL DEFAULT 0,
  total_returns_cash NUMERIC(15, 4) NOT NULL DEFAULT 0,
  total_expenses NUMERIC(15, 4) NOT NULL DEFAULT 0,
  expected_closing_balance NUMERIC(15, 4) NOT NULL DEFAULT 0,
  actual_closing_balance NUMERIC(15, 4),
  difference NUMERIC(15, 4),
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  notes TEXT
);

CREATE TABLE IF NOT EXISTS sales_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  shift_id UUID REFERENCES cashier_shifts(id) ON DELETE SET NULL,
  invoice_number VARCHAR(100) NOT NULL,
  invoice_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  customer_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  subtotal NUMERIC(15, 4) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(15, 4) NOT NULL DEFAULT 0,
  discount_percent NUMERIC(6, 2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(15, 4) NOT NULL DEFAULT 0,
  total NUMERIC(15, 4) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(15, 4) NOT NULL DEFAULT 0,
  remaining_amount NUMERIC(15, 4) NOT NULL DEFAULT 0,
  payment_type VARCHAR(20) NOT NULL DEFAULT 'cash',
  cash_amount NUMERIC(15, 4) NOT NULL DEFAULT 0,
  card_amount NUMERIC(15, 4) NOT NULL DEFAULT 0,
  treasury_id UUID NOT NULL REFERENCES treasuries(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'completed',
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  batch_id UUID,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  conversion_factor NUMERIC(15, 4) NOT NULL DEFAULT 1,
  quantity NUMERIC(15, 4) NOT NULL,
  base_quantity NUMERIC(15, 4) NOT NULL,
  unit_price NUMERIC(15, 4) NOT NULL,
  unit_cost NUMERIC(15, 4) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(15, 4) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(6, 2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(15, 4) NOT NULL DEFAULT 0,
  total NUMERIC(15, 4) NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS sales_returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  original_invoice_id UUID REFERENCES sales_invoices(id) ON DELETE SET NULL,
  shift_id UUID REFERENCES cashier_shifts(id) ON DELETE SET NULL,
  return_number VARCHAR(100) NOT NULL,
  return_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  customer_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  total NUMERIC(15, 4) NOT NULL DEFAULT 0,
  refunded_amount NUMERIC(15, 4) NOT NULL DEFAULT 0,
  treasury_id UUID NOT NULL REFERENCES treasuries(id) ON DELETE RESTRICT,
  reason TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 6. PURCHASES & SUPPLIERS
-- ==========================================

CREATE TABLE IF NOT EXISTS purchase_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  supplier_id UUID NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
  invoice_number VARCHAR(100) NOT NULL,
  system_invoice_number VARCHAR(100) NOT NULL,
  invoice_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  subtotal NUMERIC(15, 4) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(15, 4) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(15, 4) NOT NULL DEFAULT 0,
  total NUMERIC(15, 4) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(15, 4) NOT NULL DEFAULT 0,
  remaining_amount NUMERIC(15, 4) NOT NULL DEFAULT 0,
  payment_type VARCHAR(20) NOT NULL DEFAULT 'credit',
  treasury_id UUID REFERENCES treasuries(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'completed',
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  batch_number VARCHAR(100),
  expiry_date DATE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  conversion_factor NUMERIC(15, 4) NOT NULL DEFAULT 1,
  quantity NUMERIC(15, 4) NOT NULL,
  base_quantity NUMERIC(15, 4) NOT NULL,
  unit_cost NUMERIC(15, 4) NOT NULL,
  sale_price NUMERIC(15, 4),
  tax_rate NUMERIC(6, 2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(15, 4) NOT NULL DEFAULT 0,
  total NUMERIC(15, 4) NOT NULL
);

-- ==========================================
-- 7. AUDIT & ACTIVITY LOGS
-- ==========================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create updated_at triggers on all updatable tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'organizations', 'branches', 'users', 'product_categories',
    'product_brands', 'units', 'products', 'product_units',
    'warehouses', 'contacts', 'treasuries', 'expense_categories',
    'sales_invoices', 'purchase_invoices'
  ] LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_update_timestamp_%I ON %I;
      CREATE TRIGGER trg_update_timestamp_%I
      BEFORE UPDATE ON %I
      FOR EACH ROW
      EXECUTE FUNCTION update_timestamp_column();',
      t, t, t, t
    );
  END LOOP;
END;
$$;
