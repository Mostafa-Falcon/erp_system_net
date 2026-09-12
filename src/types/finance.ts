/**
 * 🦅 LOGIXA FALCON ERP - TREASURY & FINANCIALS
 */

import type { EntityId, ISODateString } from './common';

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
