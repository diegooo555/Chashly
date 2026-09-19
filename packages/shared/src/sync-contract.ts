import { z } from 'zod';
import { ENTITY_NAMES, SyncableSchema, type EntityName } from './entities.js';

const EntityNameSchema = z.enum(ENTITY_NAMES as [EntityName, ...EntityName[]]);

/** Un cambio local pendiente. opId es la clave de idempotencia: reenviarlo no duplica nada. */
export const ChangeSchema = z.object({
  opId: z.string().uuid(),
  entity: EntityNameSchema,
  data: SyncableSchema.passthrough(),
});

export const PushRequestSchema = z.object({
  changes: z.array(ChangeSchema).min(1).max(200),
});

export type Change = z.infer<typeof ChangeSchema>;
export type PushRequest = z.infer<typeof PushRequestSchema>;

/**
 * applied   → el servidor aceptó el cambio.
 * duplicate → ya se había procesado ese opId (reintento).
 * stale     → el servidor tiene una versión más reciente; se devuelve en `current`.
 */
export type PushResultStatus = 'applied' | 'duplicate' | 'stale';

export interface RemoteRecord {
  entity: EntityName;
  data: z.infer<typeof SyncableSchema> & Record<string, unknown>;
  version: number;
}

export interface PushResult {
  opId: string;
  status: PushResultStatus;
  current?: RemoteRecord;
}

export interface PushResponse {
  results: PushResult[];
}

export interface PullResponse {
  records: RemoteRecord[];
  cursor: number;
  hasMore: boolean;
}

export const PullQuerySchema = z.object({
  since: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(500).default(200),
});
