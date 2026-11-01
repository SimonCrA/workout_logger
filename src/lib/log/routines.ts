/**
 * Operaciones sobre la rutina personalizada (GLOSSARY): "Guardar" en el editor crea o actualiza,
 * borrar es lógico y la fila queda para sincronizarse (ADR-0001). Lo que prescribe la rutina va en
 * la fila como un solo valor, así que cada guardado es un cambio de la rutina entera.
 */
import { liveQuery } from 'dexie';
import { db as defaultDb, type WorkoutLoggerDb } from './db';
import { uuidv7 } from './id';
import { normalizeDraft, type RoutineDraft } from './routine-rules';
import { alive } from './rules';
import type { Routine } from './types';

/** Crea la rutina con lo que había en el editor, anónima y pendiente de subir. */
export async function createRoutine(
	draft: RoutineDraft,
	now = new Date(),
	db = defaultDb
): Promise<Routine> {
	const at = now.toISOString();
	const routine: Routine = {
		id: uuidv7(now.getTime()),
		userId: null,
		...normalizeDraft(draft),
		createdAt: at,
		updatedAt: at,
		deletedAt: null,
		pending: 1
	};
	await db.routines.add(routine);
	return routine;
}

/** La rutina viva con ese id, o nada. */
export async function routineById(id: string, db = defaultDb): Promise<Routine | undefined> {
	const routine = await db.routines.get(id);
	return routine && alive(routine) ? routine : undefined;
}

/** Reemplaza lo que prescribe una rutina viva; nada si no existe o ya se borró. */
export async function updateRoutine(
	id: string,
	draft: RoutineDraft,
	now = new Date(),
	db = defaultDb
): Promise<Routine | undefined> {
	return db.transaction('rw', db.routines, async () => {
		const current = await routineById(id, db);
		if (!current) return undefined;
		const updated: Routine = {
			...current,
			...normalizeDraft(draft),
			updatedAt: now.toISOString(),
			pending: 1
		};
		await db.routines.put(updated);
		return updated;
	});
}

/** Borra (lógicamente) una rutina viva; nada si no existe o ya se borró. */
export async function deleteRoutine(
	id: string,
	now = new Date(),
	db = defaultDb
): Promise<Routine | undefined> {
	return db.transaction('rw', db.routines, async () => {
		const current = await routineById(id, db);
		if (!current) return undefined;
		const at = now.toISOString();
		const deleted: Routine = { ...current, deletedAt: at, updatedAt: at, pending: 1 };
		await db.routines.put(deleted);
		return deleted;
	});
}

/** Mis rutinas: las vivas, en el orden en que se crearon (el id ordena por tiempo). */
export async function listRoutines(db: WorkoutLoggerDb = defaultDb): Promise<Routine[]> {
	return db.routines.filter(alive).sortBy('id');
}

export function liveRoutines(db = defaultDb) {
	return liveQuery(() => listRoutines(db));
}

/** Una rutina viva, en directo; `null` si no existe (`undefined` es "cargando"). */
export function liveRoutine(id: string, db = defaultDb) {
	return liveQuery(async () => (await routineById(id, db)) ?? null);
}
