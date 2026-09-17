import { v4 as uuidv4 } from 'uuid';
import { db } from '@/core/db/app_database';
import { supabase, isSupabaseConfigured } from '@/core/supabase/supabase_client';
import { SyncQueueManager } from '@/core/sync/sync_queue_manager';
import type { User, UserRole } from '@/types';

export interface CreateEmployeeDTO {
  org_id: string;
  branch_id?: string;
  full_name: string;
  username: string;
  email?: string;
  phone?: string;
  role: UserRole;
  pin_code?: string;
  password?: string;
  basic_salary?: number;
  salary_cycle?: 'monthly' | 'weekly' | 'daily' | 'hourly';
  deductions?: number;
  allowances?: number;
  permissions?: string[];
}

export class EmployeeRepository {
  /**
   * Get all employees belonging to a specific business owner's organization
   */
  public static async getEmployeesByOrg(orgId: string): Promise<User[]> {
    return await db.users.where('org_id').equals(orgId).toArray();
  }

  /**
   * Add a new employee under the owner's organization
   */
  public static async addEmployee(dto: CreateEmployeeDTO): Promise<User> {
    const now = new Date().toISOString();
    const userId = uuidv4();

    const newEmployee: User = {
      id: userId,
      org_id: dto.org_id,
      branch_id: dto.branch_id,
      full_name: dto.full_name.trim(),
      username: dto.username.trim().toLowerCase(),
      email: dto.email?.trim() || undefined,
      phone: dto.phone?.trim() || undefined,
      role: dto.role,
      pin_code_hash: dto.pin_code?.trim() || '1234',
      basic_salary: dto.basic_salary,
      salary_cycle: dto.salary_cycle || 'monthly',
      deductions: dto.deductions || 0,
      allowances: dto.allowances || 0,
      permissions: dto.permissions || [],
      is_active: true,
      created_at: now,
      updated_at: now,
      sync_status: 'pending',
    };

    // 1. Save to local Dexie database
    await db.transaction('rw', [db.users, db.sync_queue], async () => {
      await db.users.put(newEmployee);
      await SyncQueueManager.enqueue('users', userId, 'insert', newEmployee);
    });

    // 2. Direct sync to Supabase if connected
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('users').upsert(newEmployee);
      } catch (err) {
        console.warn('Supabase employee sync queued:', err);
      }
    }

    return newEmployee;
  }

  /**
   * Update employee details or role
   */
  public static async updateEmployee(
    userId: string,
    updates: Partial<User>
  ): Promise<void> {
    const now = new Date().toISOString();
    const cleanUpdates = { ...updates, updated_at: now, sync_status: 'pending' as const };

    await db.transaction('rw', [db.users, db.sync_queue], async () => {
      await db.users.update(userId, cleanUpdates);
      const updatedUser = await db.users.get(userId);
      if (updatedUser) {
        await SyncQueueManager.enqueue('users', userId, 'update', updatedUser);
      }
    });

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('users').update(cleanUpdates).eq('id', userId);
      } catch (err) {
        console.warn('Supabase employee update queued:', err);
      }
    }
  }

  /**
   * Toggle employee active / disabled status
   */
  public static async toggleStatus(userId: string, currentStatus: boolean): Promise<boolean> {
    const nextStatus = !currentStatus;
    await this.updateEmployee(userId, { is_active: nextStatus });
    return nextStatus;
  }

  /**
   * Delete an employee
   */
  public static async deleteEmployee(userId: string): Promise<void> {
    await db.transaction('rw', [db.users, db.sync_queue], async () => {
      await db.users.delete(userId);
      await SyncQueueManager.enqueue('users', userId, 'delete', { id: userId });
    });

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('users').delete().eq('id', userId);
      } catch (err) {
        console.warn('Supabase employee delete queued:', err);
      }
    }
  }
}
