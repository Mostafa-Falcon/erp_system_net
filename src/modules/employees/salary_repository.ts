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

    // جلب الحضور لهذا الشهر لحساب الخصومات إن وجد
    const startOfMonth = `${month}-01`;
    const attendance = await db.employee_attendance
      .where('org_id').equals(orgId)
      .filter(a => a.date.startsWith(month))
      .toArray();

    for (const emp of employees) {
      if (existingEmpIds.has(emp.id)) continue;

      const basic = emp.basic_salary || 0;
      const allowances = emp.allowances || 0;
      const staticDeductions = emp.deductions || 0;

      // حساب خصم الغياب (تبسيطي: راتب اليوم = الراتب / 30)
      const dayRate = basic / 30;
      const absentDays = attendance.filter(a => a.employee_id === emp.id && a.status === 'absent').length;
      const attendanceDeduction = Number((absentDays * dayRate).toFixed(2));

      const totalDeductions = staticDeductions + attendanceDeduction;
      const net = basic + allowances - totalDeductions;

      const id = uuidv4();
      const statement: EmployeeSalaryStatement = {
        id,
        org_id: orgId,
        employee_id: emp.id,
        month,
        basic_salary: basic,
        allowances,
        bonus: 0,
        overtime: 0,
        deductions: totalDeductions,
        loan_deduction: 0,
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

  public static async updateStatement(id: string, updates: Partial<EmployeeSalaryStatement>): Promise<void> {
    const now = new Date().toISOString();

    await db.transaction('rw', [db.salary_statements, db.sync_queue], async () => {
      const current = await db.salary_statements.get(id);
      if (!current) return;

      const merged = { ...current, ...updates };
      // إعادة حساب الصافي
      const net = (merged.basic_salary || 0) + (merged.allowances || 0) + (merged.bonus || 0) + (merged.overtime || 0)
                - (merged.deductions || 0) - (merged.loan_deduction || 0);

      const finalUpdates = {
        ...updates,
        net_salary: net,
        updated_at: now,
        sync_status: 'pending' as const
      };

      await db.salary_statements.update(id, finalUpdates);
      const record = await db.salary_statements.get(id);
      if (record) {
        await SyncQueueManager.enqueue('salary_statements', id, 'update', record);
      }
    });
  }

  public static async markPaid(id: string, treasuryId?: string): Promise<void> {
    const now = new Date().toISOString();
    await db.transaction('rw', [db.salary_statements, db.sync_queue, db.treasuries, db.expenses], async () => {
      const record = await db.salary_statements.get(id);
      if (!record || record.status === 'paid') return;

      // 1. تحديث حالة المسير
      await db.salary_statements.update(id, {
        status: 'paid',
        paid_at: now,
        treasury_id: treasuryId,
        updated_at: now,
        sync_status: 'pending'
      });

      // 2. إذا تم تحديد خزينة، سجل مصروف
      if (treasuryId) {
        const expenseId = uuidv4();
        const expense = {
          id: expenseId,
          org_id: record.org_id,
          category_id: 'salaries_wages', // تصنيف افتراضي
          treasury_id: treasuryId,
          amount: record.net_salary,
          description: `صرف راتب الموظف عن شهر ${record.month}`,
          created_by: 'system',
          created_at: now,
          sync_status: 'pending'
        };
        await (db as any).expenses.put(expense);
        await SyncQueueManager.enqueue('expenses', expenseId, 'insert', expense);

        // تحديث رصيد الخزينة
        const treasury = await db.treasuries.get(treasuryId);
        if (treasury) {
          await db.treasuries.update(treasuryId, {
            current_balance: treasury.current_balance - record.net_salary,
            updated_at: now
          });
          await SyncQueueManager.enqueue('treasuries', treasuryId, 'update', { ...treasury, current_balance: treasury.current_balance - record.net_salary });
        }
      }

      const updatedRecord = await db.salary_statements.get(id);
      if (updatedRecord) {
        await SyncQueueManager.enqueue('salary_statements', id, 'update', updatedRecord);
      }
    });
  }

  public static async deleteStatement(id: string): Promise<void> {
    await db.transaction('rw', [db.salary_statements, db.sync_queue], async () => {
      await db.salary_statements.delete(id);
      await SyncQueueManager.enqueue('salary_statements', id, 'delete', { id });
    });
  }
}
