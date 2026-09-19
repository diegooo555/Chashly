import { SYNC_TAG } from './constants';
import { runSync } from './sync-engine';
import { setSyncing } from './sync-status';

const PERIODIC_INTERVAL_MS = 60_000;

interface SyncManager {
  register(tag: string): Promise<void>;
}
type RegistrationWithSync = ServiceWorkerRegistration & { sync?: SyncManager };

/**
 * Pide una sincronización.
 * 1) Si el navegador soporta Background Sync, la delega al service worker: se ejecuta
 *    en cuanto haya red, aunque el usuario haya cerrado la pestaña.
 * 2) Si no, sincroniza desde la ventana cuando hay conexión.
 */
export async function requestSync(): Promise<void> {
  const registration = (await navigator.serviceWorker?.getRegistration()) as RegistrationWithSync | undefined;

  if (registration?.active && registration.sync) {
    try {
      await registration.sync.register(SYNC_TAG);
      return;
    } catch {
      // Permiso denegado o no disponible: continuar con el respaldo.
    }
  }
  if (navigator.onLine) await syncFromWindow();
}

export async function syncFromWindow(): Promise<void> {
  setSyncing(true);
  try {
    await runSync();
  } catch {
    // El error queda guardado en meta.lastSyncError y se muestra en la UI.
  } finally {
    setSyncing(false);
  }
}

/** Disparadores automáticos: al volver la red, al volver a la pestaña y cada minuto. */
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
