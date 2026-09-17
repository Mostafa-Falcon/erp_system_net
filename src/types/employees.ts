/**
 * 🦅 LOGIXA FALCON ERP - EMPLOYEE & HR TYPES
 */

import type { EntityId, ISODateString } from './common';

export interface EmployeeAttendance {
  id: EntityId;
  org_id: EntityId;
  branch_id: EntityId;
  employee_id: EntityId;
  date: ISODateString; // YYYY-MM-DD
  check_in?: ISODateString | null;
  check_out?: ISODateString | null;
  work_hours?: number; // Calculated hours
  status: 'present' | 'absent' | 'late' | 'excused' | 'leave';
  notes?: string;
  created_at: ISODateString;
  updated_at: ISODateString;
  sync_status?: 'synced' | 'pending' | 'failed';
}

export interface EmployeeSalaryStatement {
  id: EntityId;
  org_id: EntityId;
  employee_id: EntityId;
  month: string; // YYYY-MM
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  status: 'draft' | 'paid' | 'cancelled';
  paid_at?: ISODateString | null;
  created_at: ISODateString;
  updated_at: ISODateString;
  sync_status?: 'synced' | 'pending' | 'failed';
}
