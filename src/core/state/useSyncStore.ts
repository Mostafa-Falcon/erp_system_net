import { create } from 'zustand';
import { networkListener } from '@/core/sync/network_listener';
import { syncCoordinator } from '@/core/sync/sync_coordinator';
import { SyncQueueManager } from '@/core/sync/sync_queue_manager';

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
  setIsOnline: (status: boolean) => void;
  updatePendingCount: () => Promise<void>;
  triggerSync: () => Promise<void>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  pendingCount: 0,
  lastSyncedAt: null,

  setIsOnline: (status: boolean) => set({ isOnline: status }),

  updatePendingCount: async () => {
    try {
      const count = await SyncQueueManager.getPendingCount();
      set({ pendingCount: count });
    } catch {
      // Ignore count fetch errors
    }
  },

  triggerSync: async () => {
    if (get().isSyncing) return;
    set({ isSyncing: true });
    try {
      const result = await syncCoordinator.triggerSync();
      if (result.success) {
        set({ lastSyncedAt: new Date().toISOString() });
      }
      await get().updatePendingCount();
    } finally {
      set({ isSyncing: false });
    }
  },
}));

// Initialize listeners in browser
if (typeof window !== 'undefined') {
  networkListener.subscribe((isOnline) => {
    useSyncStore.getState().setIsOnline(isOnline);
    if (isOnline) {
      useSyncStore.getState().triggerSync();
    }
  });

  // Periodically refresh pending queue count
  setInterval(() => {
    useSyncStore.getState().updatePendingCount();
  }, 5000);
}
