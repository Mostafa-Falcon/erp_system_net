import { db } from '@/core/db/app_database';
import type { Account, JournalEntry, JournalEntryLine } from '@/types';

/**
 * 🦅 FALCON UNIVERSAL ERP - ACCOUNTING REPORTS
 * Read-only report builders computed from the journal-ledger (single source of truth):
 *  - Trial balance (ميزان المراجعة)
 *  - Balance sheet (الميزانية العمومية)
 *  - Income statement (قائمة الدخل)
 *  - General ledger / account statement (دفتر الأستاذ / كشف حساب)
 */

export interface LedgerEntry {
  entry: JournalEntry;
  lines: JournalEntryLine[];
}

export interface TrialBalanceRow {
  account: Account;
  opening: number; // signed (natural side)
  periodDebit: number;
  periodCredit: number;
  closing: number; // signed
}

export interface BalanceSheetAccount {
  account: Account;
  amount: number; // signed (assets positive on debit, liabilities/equity positive on credit)
}

export interface BalanceSheetNode extends BalanceSheetAccount {
  children: BalanceSheetNode[];
}

export interface BalanceSheetSection {
  account: Account;
  children: BalanceSheetNode[];
  total: number;
}

export interface IncomeRow {
  code: string;
  name: string;
  type: 'revenue' | 'expense';
  period: number; // revenue: credit - debit (positive); expense: debit - credit (positive)
}

export interface LedgerRow {
  date: string;
  entryNo: string;
  description: string;
  reference?: string;
  debit: number;
  credit: number;
  running: number; // signed on the account's natural side
}

/** Loads all posted (non-reversal) entries + lines for an org, ordered by date. */
async function loadLedger(orgId: string): Promise<LedgerEntry[]> {
  const entries = await db.journal_entries
    .where('org_id')
    .equals(orgId)
    .sortBy('entry_date');

  if (entries.length === 0) return [];

  const lines: JournalEntryLine[] = [];
  const chunkSize = 500;
  for (let i = 0; i < entries.length; i += chunkSize) {
    const chunkIds = entries.slice(i, i + chunkSize).map((e) => e.id);
    const chunkLines = await db.journal_entry_lines.where('entry_id').anyOf(chunkIds).toArray();
    lines.push(...chunkLines);
  }

  const byEntry = new Map<string, LedgerEntry>();
  for (const e of entries) {
    byEntry.set(e.id, { entry: e, lines: [] });
  }
  for (const l of lines) {
    byEntry.get(l.entry_id)?.lines.push(l);
  }

  return entries.map((e) => byEntry.get(e.id)!).filter((l) => l.lines.length > 0);
}

function inRange(date: string, from?: string | null, to?: string | null): boolean {
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

const signedBalance = (account: Account, debit: number, credit: number): number => {
  const signed = debit - credit;
  return account.type === 'asset' || account.type === 'expense' ? signed : -signed;
};

/** Trial Balance for the period (with opening balances). */
export async function getTrialBalance(
  orgId: string,
  from?: string | null,
  to?: string | null
): Promise<{ rows: TrialBalanceRow[]; totalDebit: number; totalCredit: number }> {
  const ledger = await loadLedger(orgId);
  const accounts = await db.accounts.where('org_id').equals(orgId).toArray();

  const rows = new Map<string, TrialBalanceRow>();
  for (const acc of accounts) {
    rows.set(acc.id, {
      account: acc,
      opening: 0,
      periodDebit: 0,
      periodCredit: 0,
      closing: 0,
    });
  }

  for (const { entry, lines } of ledger) {
    for (const line of lines) {
      const row = rows.get(line.account_id);
      if (!row) continue;
      if (inRange(entry.entry_date, from, to)) {
        row.periodDebit += line.debit;
        row.periodCredit += line.credit;
      } else if (!from && !to) {
        row.periodDebit += line.debit;
        row.periodCredit += line.credit;
      } else if (from && entry.entry_date < from) {
        row.opening += signedBalance(row.account, line.debit, line.credit);
      } else if (to && entry.entry_date > to) {
        // beyond period: ignore
      } else {
        row.periodDebit += line.debit;
        row.periodCredit += line.credit;
      }
    }
  }

  let totalDebit = 0;
  let totalCredit = 0;
  const finalRows: TrialBalanceRow[] = [];

  for (const row of rows.values()) {
    row.periodDebit = Math.round(row.periodDebit * 100) / 100;
    row.periodCredit = Math.round(row.periodCredit * 100) / 100;
    row.closing = Math.round((row.opening + row.periodDebit - row.periodCredit) * 100) / 100;

    if (row.periodDebit !== 0 || row.periodCredit !== 0 || row.opening !== 0) {
      // opening is already signed; derive opening debit/credit for rendering
      finalRows.push(row);
      totalDebit += row.periodDebit;
      totalCredit += row.periodCredit;
    }
  }

  finalRows.sort((a, b) => Number(a.account.code) - Number(b.account.code));
  return {
    rows: finalRows,
    totalDebit: Math.round(totalDebit * 100) / 100,
    totalCredit: Math.round(totalCredit * 100) / 100,
  };
}

/** Income statement for a period from the journal. */
export async function getIncomeStatement(
  orgId: string,
  from?: string | null,
  to?: string | null
): Promise<{ rows: IncomeRow[]; grossSales: number; returns: number; cogs: number; grossProfit: number; operatingExpenses: number; netIncome: number }> {
  const ledger = await loadLedger(orgId);
  const accounts = await db.accounts.where('org_id').equals(orgId).toArray();
  const accById = new Map(accounts.map((a) => [a.id, a]));

  const rows: IncomeRow[] = [];
  const sums = new Map<string, { debit: number; credit: number }>();

  for (const { entry, lines } of ledger) {
    if (!inRange(entry.entry_date, from, to)) continue;
    for (const line of lines) {
      const acc = accById.get(line.account_id);
      if (!acc) continue;
      if (acc.type !== 'revenue' && acc.type !== 'expense') continue;
      const s = sums.get(acc.id) ?? { debit: 0, credit: 0 };
      s.debit += line.debit;
      s.credit += line.credit;
      sums.set(acc.id, s);
    }
  }

  for (const acc of accounts) {
    const s = sums.get(acc.id);
    if (!s) continue;
    if (acc.type === 'revenue') {
      rows.push({ code: acc.code, name: acc.name, type: 'revenue', period: s.credit - s.debit });
    } else {
      rows.push({ code: acc.code, name: acc.name, type: 'expense', period: s.debit - s.credit });
    }
  }

  rows.sort((a, b) => Number(a.code) - Number(b.code));

  const amountOf = (code: string, type: 'revenue' | 'expense') => {
    const row = rows.find((r) => r.code === code && r.type === type);
    return row ? Math.max(0, Math.round(row.period * 100) / 100) : 0;
  };

  const grossSales = amountOf('4100', 'revenue');
  const returns = amountOf('4110', 'revenue');
  const cogs = amountOf('5100', 'expense');
  const operatingExpenses = amountOf('5200', 'expense')
    + amountOf('5301', 'expense')
    + amountOf('5400', 'expense');

  const grossProfit = grossSales - returns - cogs;
  const netIncome = grossProfit - operatingExpenses;

  return {
    rows: rows.map((r) => ({ ...r, period: Math.round(r.period * 100) / 100 })),
    grossSales: Math.round(grossSales * 100) / 100,
    returns: Math.round(returns * 100) / 100,
    cogs: Math.round(cogs * 100) / 100,
    grossProfit: Math.round(grossProfit * 100) / 100,
    operatingExpenses: Math.round(operatingExpenses * 100) / 100,
    netIncome: Math.round(netIncome * 100) / 100,
  };
}

/** Balance sheet as of a date (assets / liabilities / equity + net income). */
export async function getBalanceSheet(orgId: string, asOf?: string | null): Promise<{
  assets: BalanceSheetNode[];
  assetsTotal: number;
  liabilities: BalanceSheetNode[];
  liabilitiesTotal: number;
  equity: BalanceSheetNode[];
  equityTotal: number;
  netIncome: number;
}> {
  const ledger = await loadLedger(orgId);
  const accounts = await db.accounts.where('org_id').equals(orgId).toArray();
  const accById = new Map(accounts.map((a) => [a.id, a]));

  // Sum (debit - credit) per account up to asOf (normal-drive accounts keep natural sign).
  const signed = new Map<string, number>();
  for (const { entry, lines } of ledger) {
    if (asOf && entry.entry_date > asOf) continue;
    for (const line of lines) {
      const acc = accById.get(line.account_id);
      if (!acc) continue;
      signed.set(acc.id, (signed.get(acc.id) ?? 0) + (line.debit - line.credit));
    }
  }

  // Current-period net income (postings up to asOf, for revenue/expense).
  let rexp = 0;
  for (const acc of accounts) {
    const s = signed.get(acc.id) ?? 0;
    if (acc.type === 'revenue') rexp += s; // credit-positive
    if (acc.type === 'expense') rexp -= s; // debit-positive
  }
  const netIncome = Math.round(rexp * 100) / 100;

  const buildSection = (type: Account['type'], naturalDebit: boolean): { section: BalanceSheetNode[]; total: number } => {
    const sectionAccounts = accounts.filter(
      (a) => a.type === type && a.account_type === 'leaf' && (a.code.startsWith(type === 'asset' ? '1' : type === 'liability' ? '2' : '3'))
    );

    // Balance for display: assets shown positive when naturalDebit, inverse otherwise.
    const childrenOf = new Map<string, Account[]>();

    for (const a of accounts) {
      if (!a.parent_id) continue;
      const arr = childrenOf.get(a.parent_id) ?? [];
      arr.push(a);
      childrenOf.set(a.parent_id, arr);
    }

    const amountFor = (acc: Account): number => {
      const v = signed.get(acc.id) ?? 0;
      if (naturalDebit) return v; // asset: debit-positive
      return -v; // liability/equity: credit-positive
    };

    const aggregate = (acc: Account): BalanceSheetNode => {
      const children = (childrenOf.get(acc.id) ?? [])
        .filter((c) => c.type === type)
        .map(aggregate);
      let total = amountFor(acc);

      // Aggregate parents from their children unless the parent has direct postings.
      if (children.length > 0) {
        const hasDirect = (signed.get(acc.id) ?? 0) !== 0;
        const childTotal = children.reduce((s, c) => s + c.amount, 0);
        total = hasDirect ? total : childTotal;
      }

      return { account: acc, amount: total, children };
    };

    const sectionRoots = accounts
      .filter((a) => a.type === type && a.account_type === 'parent' && !a.parent_id)
      .map(aggregate);

    // Flat leaf totals (for the summary line).
    const flatTotal = sectionAccounts.reduce((sum, acc) => sum + amountFor(acc), 0);

    return { section: sectionRoots, total: Math.round(flatTotal * 100) / 100 };
  };

  const assets = buildSection('asset', true);
  const liabilities = buildSection('liability', false);
  const equity = buildSection('equity', false);

  // Equity = capital + retained (+ current-period net income presented as its own line).
  const equityTotal = equity.total + netIncome;

  return {
    assets: assets.section,
    assetsTotal: assets.total,
    liabilities: liabilities.section,
    liabilitiesTotal: liabilities.total,
    equity: equity.section,
    equityTotal: Math.round(equityTotal * 100) / 100,
    netIncome,
  };
}

/** General ledger / account statement for a single account with running balance. */
export async function getGeneralLedger(
  orgId: string,
  accountId: string,
  from?: string | null,
  to?: string | null
): Promise<{ rows: LedgerRow[]; opening: number }> {
  const account = await db.accounts.get(accountId);
  if (!account || account.org_id !== orgId) {
    return { rows: [], opening: 0 };
  }

  const ledger = await loadLedger(orgId);
  const rows: LedgerRow[] = [];
  let opening = 0;

  for (const { entry, lines } of ledger) {
    for (const line of lines) {
      if (line.account_id !== accountId) continue;
      if (from && entry.entry_date < from) {
        opening += signedBalance(account, line.debit, line.credit);
        continue;
      }
      if (to && entry.entry_date > to) continue;
      rows.push({
        date: entry.entry_date,
        entryNo: entry.entry_no,
        description: line.description || entry.description,
        reference: entry.reference_type ? `${entry.reference_type}:${entry.reference_id ?? ''}` : undefined,
        debit: line.debit,
        credit: line.credit,
        running: 0,
      });
    }
  }

  rows.sort((a, b) => a.date.localeCompare(b.date));
  let running = opening;
  for (const r of rows) {
    running += signedBalance(account, r.debit, r.credit);
    r.running = Math.round(running * 100) / 100;
  }

  return { rows, opening: Math.round(opening * 100) / 100 };
}

/** Account-statement flavor grouped per entry (debit/credit columns resolved). */
export async function getAccountStatement(
  orgId: string,
  accountId: string,
  from?: string | null,
  to?: string | null
): Promise<{ rows: LedgerRow[]; opening: number; closing: number }> {
  const result = await getGeneralLedger(orgId, accountId, from, to);
  const closing = result.rows.length > 0 ? result.rows[result.rows.length - 1].running : result.opening;
  return { rows: result.rows, opening: result.opening, closing };
}

export default {
  getTrialBalance,
  getIncomeStatement,
  getBalanceSheet,
  getGeneralLedger,
  getAccountStatement,
};