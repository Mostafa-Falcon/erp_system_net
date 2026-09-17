import { v4 as uuidv4 } from 'uuid';
import { db } from '@/core/db/app_database';
import { SyncQueueManager } from '@/core/sync/sync_queue_manager';
import type { EmployeeSalaryStatement, User } from '@/types';

export class SalaryRepository {
  public static async getByMonth(orgId: string, month: string): Promise<EmployeeSalaryStatement[]> {
    return await db.salary_statements
      .where('org_id')
      .equals(orgId)
      .filter(s => s.month === month)
      .toArray();
  }

  public static async generateDrafts(orgId: string, month: string): Promise<void> {
    const employees = await db.users.where('org_id').equals(orgId).and(u => u.is_active).toArray();
    const existing = await this.getByMonth(orgId, month);
    const existingEmpIds = new Set(existing.map(s => s.employee_id));

    const now = new Date().toISOString();
    const newStatements: EmployeeSalaryStatement[] = [];

    for (const emp of employees) {
      if (existingEmpIds.has(emp.id)) continue;

      const basic = emp.basic_salary || 0;
      const allowances = emp.allowances || 0;
      const deductions = emp.deductions || 0;
      const net = basic + allowances - deductions;

      const id = uuidv4();
      const statement: EmployeeSalaryStatement = {
        id,
        org_id: orgId,
        employee_id: emp.id,
        month,
        basic_salary: basic,
        allowances,
        deductions,
        net_salary: net,
        status: 'draft',
        created_at: now,
        updated_at: now,
        sync_status: 'pending'
      };
      newStatements.push(statement);
    }

    if (newStatements.length > 0) {
      await db.transaction('rw', [db.salary_statements, db.sync_queue], async () => {
        await db.salary_statements.bulkPut(newStatements);
        for (const s of newStatements) {
          await SyncQueueManager.enqueue('salary_statements', s.id, 'insert', s);
        }
      });
    }
  }

  public static async markPaid(id: string): Promise<void> {
    const now = new Date().toISOString();
    await db.transaction('rw', [db.salary_statements, db.sync_queue], async () => {
      await db.salary_statements.update(id, {
        status: 'paid',
        paid_at: now,
        updated_at: now,
        sync_status: 'pending'
      });
      const record = await db.salary_statements.get(id);
      if (record) {
        await SyncQueueManager.enqueue('salary_statements', id, 'update', record);
      }
    });
  }
}
