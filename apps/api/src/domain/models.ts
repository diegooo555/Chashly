import type { EntityName, Syncable } from '@chashly/shared';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

/** Registro tal como vive en el servidor: dueño + versión monotónica para el pull incremental. */
export interface StoredRecord {
  userId: string;
  entity: EntityName;
  data: Syncable & Record<string, unknown>;
  version: number;
}

/** Trazabilidad de cambios (RF-02). */
export interface AuditEntry {
  userId: string;
  entity: EntityName;
  entityId: string;
  opId: string;
  action: 'create' | 'update' | 'delete';
  at: string;
}
