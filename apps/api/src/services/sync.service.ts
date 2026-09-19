import {
  ENTITY_SCHEMAS,
  type Change,
  type PullResponse,
  type PushResult,
  type RemoteRecord,
} from '@chashly/shared';
import type { StoredRecord } from '../domain/models.js';
import type { Repositories } from '../repositories/types.js';

const toRemote = ({ entity, data, version }: StoredRecord): RemoteRecord => ({ entity, data, version });

/**
 * Motor de sincronización del servidor.
 *
 * Garantías:
 *  - Idempotencia: cada cambio trae un opId; si ya se procesó, se responde "duplicate".
 *  - Resolución de conflictos last-write-wins por `updatedAt`; si gana el servidor, se
 *    devuelve su versión para que el cliente converja.
 *  - Pull incremental por versión monotónica (cursor), incluyendo borrados (tombstones).
 */
export class SyncService {
  constructor(private readonly repos: Repositories) {}

  async push(userId: string, changes: Change[]): Promise<PushResult[]> {
    const results: PushResult[] = [];
    for (const change of changes) {
      results.push(await this.applyChange(userId, change));
    }
    return results;
  }

  async pull(userId: string, since: number, limit: number): Promise<PullResponse> {
    // Pedimos uno extra para saber si hay más páginas sin una segunda consulta.
    const rows = await this.repos.records.listChangedSince(userId, since, limit + 1);
    const page = rows.slice(0, limit);
    return {
      records: page.map(toRemote),
      cursor: page.at(-1)?.version ?? since,
      hasMore: rows.length > limit,
    };
  }

  private async applyChange(userId: string, change: Change): Promise<PushResult> {
    const { opId, entity } = change;

    if (await this.repos.processedOps.has(userId, opId)) {
      return { opId, status: 'duplicate' };
    }

    // Validación estricta contra el esquema específico de la entidad.
    const data = ENTITY_SCHEMAS[entity].parse(change.data);
    const existing = await this.repos.records.find(userId, entity, data.id);

    if (existing && Date.parse(existing.data.updatedAt) >= Date.parse(data.updatedAt)) {
      await this.repos.processedOps.add(userId, opId);
      return { opId, status: 'stale', current: toRemote(existing) };
    }

    await this.repos.records.save({ userId, entity, data });
    await this.repos.processedOps.add(userId, opId);
    await this.repos.audit.record({
      userId,
      entity,
      entityId: data.id,
      opId,
      action: data.deleted ? 'delete' : existing ? 'update' : 'create',
      at: new Date().toISOString(),
    });
    return { opId, status: 'applied' };
  }
}
