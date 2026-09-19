import type { EntityName } from '@chashly/shared';
import type { AuditEntry, StoredRecord, User } from '../domain/models.js';

/**
 * Interfaces de persistencia. Los servicios dependen de estas abstracciones,
 * no de una base de datos concreta: cambiar memoria → PostgreSQL no toca la lógica.
 */
export interface UserRepository {
  findByEmail(email: string): Promise<User | undefined>;
  create(user: User): Promise<void>;
}

export interface RecordRepository {
  find(userId: string, entity: EntityName, id: string): Promise<StoredRecord | undefined>;
  /** Guarda el registro asignándole la siguiente versión global; devuelve el registro guardado. */
  save(record: Omit<StoredRecord, 'version'>): Promise<StoredRecord>;
  listChangedSince(userId: string, version: number, limit: number): Promise<StoredRecord[]>;
}

export interface ProcessedOpRepository {
  has(userId: string, opId: string): Promise<boolean>;
  add(userId: string, opId: string): Promise<void>;
}

export interface AuditLog {
  record(entry: AuditEntry): Promise<void>;
}

export interface Repositories {
  users: UserRepository;
  records: RecordRepository;
  processedOps: ProcessedOpRepository;
  audit: AuditLog;
}
