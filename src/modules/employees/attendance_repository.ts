import { v4 as uuidv4 } from 'uuid';
import { db } from '@/core/db/app_database';
import { SyncQueueManager } from '@/core/sync/sync_queue_manager';
import type { EmployeeAttendance } from '@/types';

export class AttendanceRepository {
  public static async getAttendanceByDate(orgId: string, date: string): Promise<EmployeeAttendance[]> {
    return await db.employee_attendance
      .where('org_id')
      .equals(orgId)
      .filter(a => a.date === date)
      .toArray();
  }

  public static async logAttendance(attendance: Omit<EmployeeAttendance, 'id' | 'created_at' | 'updated_at' | 'sync_status'>): Promise<void> {
    const now = new Date().toISOString();
    const id = uuidv4();
    const record: EmployeeAttendance = {
      ...attendance,
      id,
      created_at: now,
      updated_at: now,
      sync_status: 'pending'
    };

    await db.transaction('rw', [db.employee_attendance, db.sync_queue], async () => {
      await db.employee_attendance.put(record);
      await SyncQueueManager.enqueue('employee_attendance', id, 'insert', record);
    });
  }

  public static async updateAttendance(id: string, updates: Partial<EmployeeAttendance>): Promise<void> {
    const now = new Date().toISOString();
    await db.transaction('rw', [db.employee_attendance, db.sync_queue], async () => {
      await db.employee_attendance.update(id, { ...updates, updated_at: now, sync_status: 'pending' });
      const record = await db.employee_attendance.get(id);
      if (record) {
        await SyncQueueManager.enqueue('employee_attendance', id, 'update', record);
      }
    });
  }
}
