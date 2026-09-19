import type { AuthResponse } from '@chashly/shared';
import { db } from './database';

/** Claves tipadas del almacén clave-valor local. */
export interface MetaSchema {
  session: AuthResponse;
  /** Dueño de los datos locales; sobrevive a una sesión expirada. */
  ownerId: string;
  pullCursor: number;
  lastSyncedAt: number;
  lastSyncError: string | null;
}

export async function getMeta<K extends keyof MetaSchema>(key: K): Promise<MetaSchema[K] | undefined> {
  return (await db.meta.get(key))?.value as MetaSchema[K] | undefined;
}

export async function setMeta<K extends keyof MetaSchema>(key: K, value: MetaSchema[K]): Promise<void> {
  await db.meta.put({ key, value });
}

export async function deleteMeta(key: keyof MetaSchema): Promise<void> {
  await db.meta.delete(key);
}
