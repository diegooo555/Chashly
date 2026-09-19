import type { EntityName } from '@chashly/shared';
import type { AuditEntry, StoredRecord, User } from '../../domain/models.js';
import type {
  AuditLog,
  ProcessedOpRepository,
  RecordRepository,
  Repositories,
  UserRepository,
} from '../types.js';

/** Implementaciones en memoria: útiles para desarrollo y pruebas. Los datos se pierden al reiniciar. */
class InMemoryUserRepository implements UserRepository {
  private readonly byEmail = new Map<string, User>();

  async findByEmail(email: string) {
    return this.byEmail.get(email);
  }

  async create(user: User) {
    this.byEmail.set(user.email, user);
  }
}

class InMemoryRecordRepository implements RecordRepository {
  private readonly records = new Map<string, StoredRecord>();
  private sequence = 0;

  private key(userId: string, entity: EntityName, id: string) {
    return `${userId}:${entity}:${id}`;
  }

  async find(userId: string, entity: EntityName, id: string) {
    return this.records.get(this.key(userId, entity, id));
  }

  async save(record: Omit<StoredRecord, 'version'>) {
    const stored: StoredRecord = { ...record, version: ++this.sequence };
    this.records.set(this.key(record.userId, record.entity, record.data.id), stored);
    return stored;
  }

  async listChangedSince(userId: string, version: number, limit: number) {
    return [...this.records.values()]
      .filter((r) => r.userId === userId && r.version > version)
      .sort((a, b) => a.version - b.version)
      .slice(0, limit);
  }
}

class InMemoryProcessedOpRepository implements ProcessedOpRepository {
  private readonly ops = new Set<string>();

  async has(userId: string, opId: string) {
    return this.ops.has(`${userId}:${opId}`);
  }

  async add(userId: string, opId: string) {
    this.ops.add(`${userId}:${opId}`);
  }
}

class InMemoryAuditLog implements AuditLog {
  readonly entries: AuditEntry[] = [];

  async record(entry: AuditEntry) {
    this.entries.push(entry);
  }
}

export function createInMemoryRepositories(): Repositories {
  return {
    users: new InMemoryUserRepository(),
    records: new InMemoryRecordRepository(),
    processedOps: new InMemoryProcessedOpRepository(),
    audit: new InMemoryAuditLog(),
  };
}
