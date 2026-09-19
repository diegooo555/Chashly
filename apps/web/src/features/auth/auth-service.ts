import type { AuthResponse, Credentials } from '@chashly/shared';
import { db } from '../../db/database';
import { getMeta, setMeta } from '../../db/meta';
import { apiRequest } from '../../lib/api-client';
import { requestSync } from '../../sync/scheduler';

export type AuthMode = 'login' | 'register';

export async function authenticate(mode: AuthMode, credentials: Credentials): Promise<void> {
  const response = await apiRequest<AuthResponse>(`/api/auth/${mode}`, {
    method: 'POST',
    body: credentials,
  });

  // Si entra otra cuenta en este dispositivo, se borran los datos locales de la anterior.
  const ownerId = await getMeta('ownerId');
  if (ownerId && ownerId !== response.user.id) await wipeLocalData();

  await setMeta('ownerId', response.user.id);
  await setMeta('session', response);
  void requestSync();
}

export async function pendingChangesCount(): Promise<number> {
  return db.outbox.count();
}

/** Cerrar sesión elimina todos los datos financieros del dispositivo (privacidad). */
export async function logout(): Promise<void> {
  await wipeLocalData();
}

async function wipeLocalData() {
  await db.transaction('rw', db.transactions, db.budgets, db.outbox, db.meta, async () => {
    await Promise.all([db.transactions.clear(), db.budgets.clear(), db.outbox.clear(), db.meta.clear()]);
  });
}
