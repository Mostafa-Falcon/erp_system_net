import { v4 as uuidv4 } from 'uuid';
import { db } from '@/core/db/app_database';
import { SyncQueueManager } from '@/core/sync/sync_queue_manager';
import type { AppSetting, Branch, Organization } from '@/types';

export class SettingsRepository {
  /**
   * Get the organization record
   */
  public static async getOrganization(orgId: string): Promise<Organization | undefined> {
    return await db.organizations.get(orgId);
  }

  /**
   * Update organization profile fields
   */
  public static async updateOrganization(orgId: string, updates: Partial<Organization>): Promise<void> {
    const org = await db.organizations.get(orgId);
    if (!org) throw new Error('المؤسسة غير موجودة');

    const updated: Organization = {
      ...org,
      ...updates,
      updated_at: new Date().toISOString(),
      sync_status: 'pending',
    };

    await db.transaction('rw', [db.organizations, db.sync_queue], async () => {
      await db.organizations.put(updated);
      await SyncQueueManager.enqueue('organizations', orgId, 'update', updated);
    });
  }

  /**
   * Get all app settings for an organization (keyed by id)
   */
  public static async getAppSettings(orgId: string): Promise<AppSetting[]> {
    return await db.app_settings.where('org_id').equals(orgId).toArray();
  }

  /**
   * Read a single setting by key
   */
  public static async getSetting(key: string): Promise<AppSetting | undefined> {
    return await db.app_settings.get(key);
  }

  /**
   * Upsert an application setting (id === key)
   */
  public static async setSetting(orgId: string, key: string, value: string, description?: string): Promise<void> {
    const existing = await db.app_settings.get(key);
    const updated: AppSetting = {
      id: key,
      org_id: orgId,
      value,
      description: description ?? existing?.description,
      updated_at: new Date().toISOString(),
      sync_status: 'pending',
    };

    await db.transaction('rw', [db.app_settings, db.sync_queue], async () => {
      await db.app_settings.put(updated);
      await SyncQueueManager.enqueue('app_settings', key, 'update', updated);
    });
  }

  /**
   * Get organization branches
   */
  public static async getBranches(orgId: string): Promise<Branch[]> {
    return await db.branches.where('org_id').equals(orgId).toArray();
  }

  /**
   * Create a new branch with an auto-generated code
   */
  public static async createBranch(params: {
    orgId: string;
    name: string;
    phone?: string;
    address?: string;
    isMain: boolean;
  }): Promise<Branch> {
    const count = await db.branches.where('org_id').equals(params.orgId).count();
    const now = new Date().toISOString();
    const branchId = uuidv4();

    const branch: Branch = {
      id: branchId,
      org_id: params.orgId,
      code: `BR-${String(count + 1).padStart(3, '0')}`,
      name: params.name.trim(),
      phone: params.phone?.trim() || undefined,
      address: params.address?.trim() || undefined,
      is_main: params.isMain || count === 0,
      is_active: true,
      created_at: now,
      updated_at: now,
      sync_status: 'pending',
    };

    await db.transaction('rw', [db.branches, db.sync_queue], async () => {
      if (branch.is_main) {
        const existing = await db.branches.where('org_id').equals(params.orgId).toArray();
        for (const b of existing) {
          if (b.is_main) {
            await db.branches.put({ ...b, is_main: false, updated_at: now, sync_status: 'pending' });
          }
        }
      }
      await db.branches.add(branch);
      await SyncQueueManager.enqueue('branches', branchId, 'insert', branch);
    });

    return branch;
  }

  /**
   * Update branch details
   */
  public static async updateBranch(branchId: string, updates: Partial<Branch>): Promise<void> {
    const branch = await db.branches.get(branchId);
    if (!branch) throw new Error('الفرع غير موجود');

    const updated: Branch = {
      ...branch,
      ...updates,
      updated_at: new Date().toISOString(),
      sync_status: 'pending',
    };

    await db.transaction('rw', [db.branches, db.sync_queue], async () => {
      await db.branches.put(updated);
      await SyncQueueManager.enqueue('branches', branchId, 'update', updated);
    });
  }

  /**
   * Set a branch as the main branch, clearing the flag on others
   */
  public static async setMainBranch(branchId: string, orgId: string): Promise<void> {
    const now = new Date().toISOString();
    const target = await db.branches.get(branchId);
    if (!target || target.org_id !== orgId) throw new Error('الفرع غير موجود');

    await db.transaction('rw', [db.branches, db.sync_queue], async () => {
      const branches = await db.branches.where('org_id').equals(orgId).toArray();
      for (const b of branches) {
        const next = b.id === branchId ? { ...b, is_main: true } : { ...b, is_main: false };
        if (next.is_main !== b.is_main) {
          next.updated_at = now;
          next.sync_status = 'pending';
          await db.branches.put(next);
          await SyncQueueManager.enqueue('branches', next.id, 'update', next);
        }
      }
    });
  }

  /**
   * Toggle branch active state
   */
  public static async toggleBranchActive(branchId: string): Promise<void> {
    const branch = await db.branches.get(branchId);
    if (!branch) throw new Error('الفرع غير موجود');
    if (branch.is_main && branch.is_active) {
      throw new Error('لا يمكن إيقاف الفرع الرئيسي. عيّن فرعاً رئيسياً آخر أولاً.');
    }

    await this.updateBranch(branchId, { is_active: !branch.is_active });
  }
}