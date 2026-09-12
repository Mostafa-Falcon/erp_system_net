import { create } from 'zustand';
import type { User, CashierShift } from '@/types';
import { AuthRepository } from '@/modules/auth/auth_repository';

interface SessionState {
  currentUser: User | null;
  activeBranchId: string | null;
  activeShift: CashierShift | null;
  setCurrentUser: (user: User | null) => void;
  setActiveBranchId: (branchId: string | null) => void;
  setActiveShift: (shift: CashierShift | null) => void;
  logout: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  currentUser: typeof window !== 'undefined' ? AuthRepository.getCurrentUser() : null,
  activeBranchId: null,
  activeShift: null,

  setCurrentUser: (user) => {
    if (user) {
      AuthRepository.saveSession(user);
    }
    set({ currentUser: user, activeBranchId: user?.branch_id || null });
  },

  setActiveBranchId: (branchId) => set({ activeBranchId: branchId }),

  setActiveShift: (shift) => set({ activeShift: shift }),

  logout: () => {
    AuthRepository.logout();
    set({ currentUser: null, activeBranchId: null, activeShift: null });
  },
}));
