/**
 * Dashboard analytics data access.
 * Aggregations are computed over date-bounded, column-projected queries.
 */

import { supabase } from '@/core/supabase/supabase_client';
import { throwIfError } from './helpers';
import { MedicinesRepository } from './medicines_repository';

export interface DashboardKpis {
  todaySalesPiasters: number;
  todayInvoices: number;
  monthSalesPiasters: number;
  monthInvoices: number;
  allTimeSalesPiasters: number;
  allTimeInvoices: number;
  monthPurchasesPiasters: number;
  allTimePurchasesPiasters: number;
  allTimePurchasesCount: number;
  totalMedicines: number;
  lowStockCount: number;
  expiringCount: number;
  customersCount: number;
  suppliersCount: number;
  cashBalancePiasters: number;
  netProfitPiasters: number;
  shiftsCount: number;
}

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
};

const startOfMonth = (d: Date) => {
  const x = new Date(d.getFullYear(), d.getMonth(), 1);
  return x.toISOString();
};

const sumPiasters = (rows: Array<{ total_amount_piasters: number | null }> | null): number =>
  (rows ?? []).reduce((acc, row) => acc + (row.total_amount_piasters ?? 0), 0);

export const DashboardRepository = {
  async getKpis(accountId: string, branchId?: string | null): Promise<DashboardKpis> {
    const now = new Date();
    const dayStart = startOfDay(now);
    const monthStart = startOfMonth(now);

    const salesSelect = 'total_amount_piasters';
    const invoiceBase = () => {
      let q = supabase.from('sale_invoices').select(salesSelect).eq('is_deleted', false);
      if (branchId) q = q.eq('branch_id', branchId);
      return q;
    };

    const [
      todaySales,
      monthSales,
      allSales,
      monthPurchases,
      allPurchases,
      medicinesCount,
      lowStock,
      expiring,
      customers,
      suppliers,
      treasuries,
      shifts,
      profit,
    ] = await Promise.all([
      invoiceBase().gte('created_at', dayStart),
      invoiceBase().gte('created_at', monthStart),
      invoiceBase(),
      (() => {
        let q = supabase
          .from('purchase_invoices')
          .select('total_amount_piasters')
          .eq('is_deleted', false)
          .gte('invoice_date', monthStart);
        if (branchId) q = q.eq('branch_id', branchId);
        return q;
      })(),
      (() => {
        let q = supabase
          .from('purchase_invoices')
          .select('total_amount_piasters')
          .eq('is_deleted', false);
        if (branchId) q = q.eq('branch_id', branchId);
        return q;
      })(),
      (() => {
        let q = supabase
          .from('medicines')
          .select('id', { count: 'exact', head: true })
          .eq('is_deleted', false);
        if (branchId) q = q.eq('branch_id', branchId);
        return q;
      })(),
      branchId ? MedicinesRepository.countLowStock(branchId) : Promise.resolve(0),
      (() => {
        const in90 = new Date(now.getTime() + 90 * 86400000).toISOString();
        let q = supabase
          .from('item_batches')
          .select('id', { count: 'exact', head: true })
          .eq('is_deleted', false)
          .eq('is_active', true)
          .not('expiry_date', 'is', null)
          .lte('expiry_date', in90);
        if (branchId) q = q.eq('branch_id', branchId);
        return q;
      })(),
      supabase.from('customers').select('id', { count: 'exact', head: true }).eq('is_deleted', false),
      supabase.from('suppliers').select('id', { count: 'exact', head: true }).eq('is_deleted', false),
      (() => {
        let q = supabase.from('treasuries').select('balance_piasters').eq('is_deleted', false);
        if (branchId) q = q.eq('branch_id', branchId);
        return q;
      })(),
      (() => {
        let q = supabase.from('cashier_shifts').select('id', { count: 'exact', head: true }).eq('is_deleted', false);
        if (branchId) q = q.eq('branch_id', branchId);
        return q;
      })(),
      branchId
        ? supabase.rpc('get_profit_loss_report', { p_account_id: accountId, p_branch_id: branchId })
        : supabase.rpc('get_profit_loss_report', { p_account_id: accountId }),
    ]);

    for (const r of [todaySales, monthSales, allSales, monthPurchases, allPurchases, medicinesCount, expiring, customers, suppliers, treasuries, shifts]) {
      throwIfError(r.error);
    }

    const todayRows = (todaySales.data ?? []) as Array<{ total_amount_piasters: number | null }>;
    const monthRows = (monthSales.data ?? []) as Array<{ total_amount_piasters: number | null }>;
    const allSalesRows = (allSales.data ?? []) as Array<{ total_amount_piasters: number | null }>;
    const monthPurchaseRows = (monthPurchases.data ?? []) as Array<{ total_amount_piasters: number | null }>;
    const allPurchaseRows = (allPurchases.data ?? []) as Array<{ total_amount_piasters: number | null }>;

    const profitRow = !profit.error ? profit.data?.[0] : null;

    return {
      todaySalesPiasters: sumPiasters(todayRows),
      todayInvoices: todayRows.length,
      monthSalesPiasters: sumPiasters(monthRows),
      monthInvoices: monthRows.length,
      allTimeSalesPiasters: sumPiasters(allSalesRows),
      allTimeInvoices: allSalesRows.length,
      monthPurchasesPiasters: sumPiasters(monthPurchaseRows),
      allTimePurchasesPiasters: sumPiasters(allPurchaseRows),
      allTimePurchasesCount: allPurchaseRows.length,
      totalMedicines: medicinesCount.count ?? 0,
      lowStockCount: lowStock,
      expiringCount: expiring.count ?? 0,
      customersCount: customers.count ?? 0,
      suppliersCount: suppliers.count ?? 0,
      cashBalancePiasters: (treasuries.data ?? []).reduce(
        (acc, t) => acc + ((t as { balance_piasters: number | null }).balance_piasters ?? 0),
        0
      ),
      netProfitPiasters: profitRow?.net_profit_piasters ?? 0,
      shiftsCount: shifts.count ?? 0,
    };
  },

  async profitLoss(
    accountId: string,
    branchId: string | null | undefined,
    from: string,
    to: string
  ) {
    if (!branchId) return null;
    const { data, error } = await supabase.rpc('get_profit_loss_report', {
      p_account_id: accountId,
      p_branch_id: branchId,
      p_from: from,
      p_to: to,
    });
    if (error) throw error;
    return (data as Array<Record<string, number>>)?.[0] ?? null;
  },

  async recentInvoices(branchId?: string | null, limit = 8) {
    let q = supabase
      .from('sale_invoices')
      .select('id, invoice_number, customer_name, total_amount_piasters, payment_method, payment_status, created_at, cashier_name')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (branchId) q = q.eq('branch_id', branchId);
    const { data, error } = await q;
    throwIfError(error);
    return data ?? [];
  },

  async recentMedicines(branchId?: string | null, limit = 8) {
    let q = supabase
      .from('medicines')
      .select('id, name, name_ar, generic_name, barcode, sell_price_piasters, buy_price_piasters, total_quantity_base_units, unit_name, category_name')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (branchId) q = q.eq('branch_id', branchId);
    const { data, error } = await q;
    throwIfError(error);
    return data ?? [];
  },
};
