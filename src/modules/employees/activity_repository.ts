import { db } from '@/core/db/app_database';
import type { ActivityLog } from '@/types';

export class ActivityRepository {
  public static async getLogs(orgId: string, limit = 100): Promise<ActivityLog[]> {
    return await db.activity_logs
      .where('org_id')
      .equals(orgId)
      .reverse()
      .limit(limit)
      .sortBy('created_at');
  }

  public static async filterLogs(orgId: string, query: string, type: string): Promise<ActivityLog[]> {
    let collection = db.activity_logs.where('org_id').equals(orgId);

    const logs = await collection.reverse().sortBy('created_at');

    return logs.filter(log => {
      const matchesType = type === 'all' || log.entity_type === type || log.action.includes(type);
      const matchesQuery = !query ||
        log.user_name?.toLowerCase().includes(query.toLowerCase()) ||
        log.action.toLowerCase().includes(query.toLowerCase()) ||
        log.details?.toLowerCase().includes(query.toLowerCase());

      return matchesType && matchesQuery;
    });
  }
}
