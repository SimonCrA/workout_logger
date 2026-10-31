import { z } from 'zod';
import { WORKOUT_MODES } from '#lib/log/types.js';

/**
 * La lista de tablas sincronizadas (ADR-0001). Subida, bajada, asociación de lo anónimo a la
 * cuenta y limpieza de pendientes la recorren en el dispositivo y en el servidor; ningún paso
 * nombra una tabla. Añadir una tabla es declarar aquí su entrada y, en
 * `src/lib/server/sync/tables.ts`, su tabla del servidor. El orden manda: un padre va antes que
 * sus hijos, y así se suben y se bajan.
 */

/** Siempre en UTC con `Z`: las reglas de fusión comparan las cadenas tal cual. */
const iso = z.string().datetime();

/** Lo que lleva toda fila al viajar: sin `userId`, que pone el servidor, ni la marca local `pending`. */
const syncedRow = z.object({
	id: z.string().min(1).max(64),
	createdAt: iso,
	updatedAt: iso,
	deletedAt: iso.nullable()
});

/**
 * Rutina, nombre copiado y modo pueden faltar al recibir, porque la app anterior no los conoce.
 * Al insertar valen lo de un libre en acompañamiento (el valor por defecto de la columna); al
 * actualizar, lo que falta se conserva, así un dispositivo sin actualizar no borra lo que otro guardó.
 */
const workoutRow = syncedRow.extend({
	routineId: z.string().min(1).max(64).nullable().optional(),
	title: z.string().max(100).nullable().optional(),
	mode: z.enum(WORKOUT_MODES).optional(),
	startedAt: iso,
	endedAt: iso.nullable()
});

const setRow = syncedRow.extend({
	workoutId: z.string().min(1).max(64),
	exerciseId: z.string().min(1).max(100),
	reps: z.number().int().min(0).max(1000),
	weight: z.number().min(0).max(2000),
	rir: z.number().int().min(0).max(20).nullable(),
	type: z.enum(['warmup', 'normal', 'failure', 'drop']),
	note: z.string().max(500).nullable(),
	performedAt: iso
});

type SyncTableSpec = {
	/** Nombre de la tabla en Dexie y clave de sus filas en el protocolo HTTP. */
	key: string;
	/** Esquema de la fila que viaja; el servidor rechaza la subida entera si una fila no lo cumple. */
	row: z.ZodObject;
	/** Tope de filas por subida. */
	maxPerPush: number;
	/**
	 * De qué tabla cuelga, o nada. Una fila con padre solo se acepta si ese padre existe en el
	 * servidor y es del mismo usuario; como el padre va antes en la lista, puede ir en la misma subida.
	 */
	parent: { table: string; column: string } | null;
};

export const syncTables = [
	{ key: 'workouts', row: workoutRow, maxPerPush: 500, parent: null },
	{
		key: 'sets',
		row: setRow,
		maxPerPush: 2000,
		parent: { table: 'workouts', column: 'workoutId' }
	}
] as const satisfies readonly SyncTableSpec[];

export type SyncTable = (typeof syncTables)[number];
export type SyncTableKey = SyncTable['key'];
/** La fila que viaja, de una tabla concreta o de cualquiera. */
export type SyncRow<K extends SyncTableKey = SyncTableKey> = z.infer<
	Extract<SyncTable, { key: K }>['row']
>;
/** Filas por tabla, como van en la subida y en la bajada. */
export type SyncRows = { [K in SyncTableKey]: SyncRow<K>[] };

/** Un valor por tabla declarada, en el orden de la lista. */
export function byTable<T>(value: (table: SyncTable) => T): Record<SyncTableKey, T> {
	return Object.fromEntries(syncTables.map((table) => [table.key, value(table)])) as Record<
		SyncTableKey,
		T
	>;
}

/** Como `byTable`, esperando cada tabla antes de pasar a la siguiente (dentro de una transacción). */
export async function byTableAsync<T>(
	value: (table: SyncTable) => Promise<T>
): Promise<Record<SyncTableKey, T>> {
	const entries: [SyncTableKey, T][] = [];
	for (const table of syncTables) entries.push([table.key, await value(table)]);
	return Object.fromEntries(entries) as Record<SyncTableKey, T>;
}
