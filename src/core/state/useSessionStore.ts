'use client';

import { create } from 'zustand';
import {
  cacheSession,
  readCachedSession,
  restoreSession,
  signOut,
  type PharmacySession,
} from '@/core/pharmacy/session_service';

interface SessionState {
  session: PharmacySession | null;
  activeBranchId: string | null;
  isReady: boolean;
  setSession: (session: PharmacySession | null) => void;
  setActiveBranchId: (branchId: string | null) => void;
  hydrate: () => Promise<void>;
  logout: () => Promise<void>;
}

const getInitialBranchId = (session: PharmacySession | null): string | null => {
  if (typeof window === 'undefined') return null;
  return session?.branchId || window.localStorage.getItem('falcon_active_branch_id') || null;
};

export const useSessionStore = create<SessionState>((set) => {
  const cached = readCachedSession();

  return {
    session: cached,
    activeBranchId: getInitialBranchId(cached),
    isReady: false,

    setSession: (session) => {
      cacheSession(session);
      set({ session, activeBranchId: getInitialBranchId(session) });
    },

    setActiveBranchId: (branchId) => {
      if (typeof window !== 'undefined') {
        if (branchId) window.localStorage.setItem('falcon_active_branch_id', branchId);
        else window.localStorage.removeItem('falcon_active_branch_id');
      }
      set({ activeBranchId: branchId });
    },

    hydrate: async () => {
      const session = await restoreSession();
      set({ session, isReady: true, activeBranchId: getInitialBranchId(session) });
    },

    logout: async () => {
      await signOut();
      if (typeof window !== 'undefined') window.localStorage.removeItem('falcon_active_branch_id');
      set({ session: null, activeBranchId: null, isReady: true });
    },
  };
});

/** Convenience selector for the active account id. */
export const useActiveAccountId = (): string | null =>
  useSessionStore((state) => state.session?.accountId ?? null);
