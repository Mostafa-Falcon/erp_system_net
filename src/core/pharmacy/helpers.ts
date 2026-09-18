import type { PostgrestError } from '@supabase/supabase-js';

/** Domain error carrying a safe, user-facing Arabic message. */
export class PharmacyError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'PharmacyError';
    this.code = code;
  }
}

/** Throws a normalized {@link PharmacyError} when a PostgREST call fails. */
export const throwIfError = (
  error: PostgrestError | null | undefined,
  fallback = 'تعذّر تنفيذ العملية. حاول مرة أخرى.'
): void => {
  if (error) {
    throw new PharmacyError(error.message || fallback, error.code);
  }
};

/** Standard page size used across list screens. */
export const DEFAULT_PAGE_SIZE = 50;

export interface PageParams {
  page?: number;
  pageSize?: number;
}

export const pageToRange = ({ page = 1, pageSize = DEFAULT_PAGE_SIZE }: PageParams) => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { from, to };
};

/** Builds a bilingual search `or` filter for name columns. */
export const nameSearchFilter = (term: string, columns: string[]): string => {
  const escaped = term.replace(/[%,()]/g, '').trim();
  return columns.map((col) => `${col}.ilike.%${escaped}%`).join(',');
};
