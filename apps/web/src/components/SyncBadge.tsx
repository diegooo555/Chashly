import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { getMeta } from '../db/meta';
import { formatTime } from '../lib/dates';
import { syncFromWindow } from '../sync/scheduler';
import { useIsOnline, useIsSyncing } from '../sync/sync-status';

type Tone = 'offline' | 'busy' | 'pending' | 'error' | 'done';

const plural = (n: number) => (n === 1 ? '1 cambio' : `${n} cambios`);

/** Muestra en todo momento si los datos del dispositivo ya están en la nube. */
export function SyncBadge() {
  const online = useIsOnline();
  const syncing = useIsSyncing();
  const pending = useLiveQuery(() => db.outbox.count(), [], 0);
  const lastSyncedAt = useLiveQuery(() => getMeta('lastSyncedAt'), []);
  const lastError = useLiveQuery(() => getMeta('lastSyncError'), []);

  let tone: Tone;
  let label: string;
  if (!online) {
    tone = 'offline';
    label = pending ? `Sin conexión, ${plural(pending)} por subir` : 'Sin conexión';
  } else if (syncing) {
    tone = 'busy';
    label = 'Sincronizando';
  } else if (lastError && pending) {
    tone = 'error';
    label = `No se pudo sincronizar. Reintentar`;
  } else if (pending) {
    tone = 'pending';
    label = `${plural(pending)} por subir`;
  } else {
    tone = 'done';
    label = lastSyncedAt ? `Guardado en la nube ${formatTime(lastSyncedAt)}` : 'Guardado en la nube';
  }

  return (
    <button
      type="button"
      className={`sync-badge sync-badge--${tone}`}
      onClick={() => void syncFromWindow()}
      disabled={!online || syncing}
      aria-live="polite"
      title={lastError ?? undefined}
    >
      <span className="sync-badge__dot" aria-hidden="true" />
      {label}
    </button>
  );
}
