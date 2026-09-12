/**
 * 🦅 Falcon ERP - Network Listener & Connectivity Monitor
 * Detects online/offline transitions and verifies true internet connectivity.
 * Windows 7 & modern browser compatible.
 */

type NetworkStatusCallback = (isOnline: boolean) => void;

class NetworkListener {
  private static instance: NetworkListener;
  private isOnline: boolean = typeof window !== 'undefined' ? navigator.onLine : true;
  private listeners: Set<NetworkStatusCallback> = new Set();
  private pingIntervalId: ReturnType<typeof setInterval> | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
      
      // Periodic heartbeat check every 30 seconds
      this.pingIntervalId = setInterval(() => {
        this.verifyConnectivity();
      }, 30000);
    }
  }

  public static getInstance(): NetworkListener {
    if (!NetworkListener.instance) {
      NetworkListener.instance = new NetworkListener();
    }
    return NetworkListener.instance;
  }

  public getStatus(): boolean {
    return this.isOnline;
  }

  public subscribe(callback: NetworkStatusCallback): () => void {
    this.listeners.add(callback);
    callback(this.isOnline);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private handleNetworkChange(status: boolean) {
    if (this.isOnline !== status) {
      this.isOnline = status;
      this.notifyListeners();
    }
  }

  public async verifyConnectivity(): Promise<boolean> {
    if (typeof window === 'undefined') return true;
    if (!navigator.onLine) {
      this.handleNetworkChange(false);
      return false;
    }

    try {
      // Light ping to favicon or lightweight endpoint with cache-busting
      const response = await fetch(`/favicon.ico?_t=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
      });
      const reachable = response.ok || response.status === 304;
      this.handleNetworkChange(reachable);
      return reachable;
    } catch {
      this.handleNetworkChange(false);
      return false;
    }
  }

  private notifyListeners() {
    this.listeners.forEach((callback) => callback(this.isOnline));
  }
}

export const networkListener = NetworkListener.getInstance();
