import { SYNC_TAG } from './constants';
import { runSync } from './sync-engine';
import { setSyncing } from './sync-status';

const PERIODIC_INTERVAL_MS = 60_000;

interface SyncManager {
  register(tag: string): Promise<void>;
}
type RegistrationWithSync = ServiceWorkerRegistration & { sync?: SyncManager };







export async function requestSync(): Promise<void> {
  const registration = (await navigator.serviceWorker?.getRegistration()) as RegistrationWithSync | undefined;

  if (registration?.active && registration.sync) {
    try {
      await registration.sync.register(SYNC_TAG);
      return;
    } catch {
    }
  }
  if (navigator.onLine) await syncFromWindow();
}

export async function syncFromWindow(): Promise<void> {
  setSyncing(true);
  try {
    await runSync();
  } catch {
  } finally {
    setSyncing(false);
  }
}


export function startSyncScheduler(): () => void {
  const onOnline = () => void requestSync();
  const onVisible = () => {
    if (document.visibilityState === 'visible') void requestSync();
  };
  const interval = window.setInterval(() => {
    if (navigator.onLine && document.visibilityState === 'visible') void syncFromWindow();
  }, PERIODIC_INTERVAL_MS);

  window.addEventListener('online', onOnline);
  document.addEventListener('visibilitychange', onVisible);
  void requestSync();

  return () => {
    window.clearInterval(interval);
    window.removeEventListener('online', onOnline);
    document.removeEventListener('visibilitychange', onVisible);
  };
}
