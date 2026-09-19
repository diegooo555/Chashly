import { z } from 'zod';

/**
 * Campos comunes a toda entidad sincronizable.
 * - id: UUID generado en el cliente → permite crear registros offline sin colisiones.
 * - updatedAt: marca de tiempo ISO usada para resolver conflictos (last-write-wins).
 * - deleted: tombstone; los borrados también se sincronizan.
 */
export const SyncableSchema = z.object({
  id: z.string().uuid(),
  updatedAt: z.string().datetime(),
  deleted: z.boolean(),
});

export const CATEGORIES = [
  'Alimentación',
  'Transporte',
  'Vivienda',
  'Servicios',
  'Salud',
  'Educación',
  'Entretenimiento',
  'Compras',
  'Salario',
  'Otros',
] as const;

export const TransactionTypeSchema = z.enum(['income', 'expense']);

/** Montos en la unidad mínima de la moneda (enteros) para evitar errores de coma flotante. */
export const TransactionSchema = SyncableSchema.extend({
  type: TransactionTypeSchema,
  amount: z.number().int().positive().max(1_000_000_000_000),
  currency: z.string().length(3),
  category: z.string().min(1).max(40),
  description: z.string().max(140),
  occurredAt: z.string().datetime(),
});

export const BudgetSchema = SyncableSchema.extend({
  category: z.string().min(1).max(40),
  monthlyLimit: z.number().int().positive().max(1_000_000_000_000),
});

export type Syncable = z.infer<typeof SyncableSchema>;
export type TransactionType = z.infer<typeof TransactionTypeSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type Budget = z.infer<typeof BudgetSchema>;

/** Registro de entidades sincronizables: añadir una nueva entidad es añadir una línea aquí. */
export const ENTITY_SCHEMAS = {
  transaction: TransactionSchema,
  budget: BudgetSchema,
} as const;

export type EntityName = keyof typeof ENTITY_SCHEMAS;
export type EntityOf<E extends EntityName> = z.infer<(typeof ENTITY_SCHEMAS)[E]>;
export const ENTITY_NAMES = Object.keys(ENTITY_SCHEMAS) as EntityName[];
