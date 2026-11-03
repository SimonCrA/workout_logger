import type { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core';
import type { SyncTableKey } from '#lib/sync/tables.js';
import { bodyWeight, profile, routine, workout, workoutSet } from '../db/schema';

/** Una tabla del servidor con las columnas de sincronización (`synced` en el esquema). */
export type ServerTable = SQLiteTable & {
	id: SQLiteColumn;
	userId: SQLiteColumn;
	updatedAt: SQLiteColumn;
	seq: SQLiteColumn;
};

/** La tabla del servidor de cada entrada de la lista de `#lib/sync/tables`; si falta una, no compila. */
export const serverTables: Record<SyncTableKey, ServerTable> = {
	routines: routine,
	workouts: workout,
	sets: workoutSet,
	profiles: profile,
	bodyWeights: bodyWeight
};
