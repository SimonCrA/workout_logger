/**
 * Operaciones sobre la rutina personalizada (GLOSSARY): "Guardar" en el editor crea o actualiza,
 * borrar es lógico y la fila queda para sincronizarse (ADR-0001). Lo que prescribe la rutina va en
 * la fila como un solo valor, así que cada guardado es un cambio de la rutina entera.
 */
import { liveQuery } from 'dexie';
import { db as defaultDb } from './db';
import { uuidv7 } from './id';
import {
	routinesByLastDone,
	normalizeDraft,
	type RoutineDraft,
	type RoutineLastDone
} from './routine-rules';
import { alive, type UnfinishedWorkout } from './rules';
import type { Routine, WorkoutMode } from './types';
import { lastMode, unfinishedWorkout } from './workouts';

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

/** Las rutinas vivas, en el orden en que se crearon (el id ordena por tiempo); Mis rutinas las reordena por última vez. */
export async function listRoutines(db = defaultDb): Promise<Routine[]> {
	return db.routines.filter(alive).sortBy('id');
}

/** Mis rutinas como las observa la pestaña: por última vez hecha, el sin terminar para marcar la que está en curso y el último modo para preseleccionarlo al Empezar. */
export type RoutineList = {
	routines: RoutineLastDone[];
	unfinished: UnfinishedWorkout | null;
	lastMode: WorkoutMode;
};

/** Lee las rutinas vivas, los entrenamientos con rutina y el estado del dispositivo de una vez. */
export async function routineList(db = defaultDb): Promise<RoutineList> {
	const routines = await listRoutines(db);
	const workouts = await db.workouts.filter((workout) => workout.routineId !== null).toArray();
	const unfinished = await unfinishedWorkout(db);
	return {
		routines: routinesByLastDone(routines, workouts),
		unfinished: unfinished ?? null,
		lastMode: await lastMode(db)
	};
}

/** Mis rutinas en directo, en una sola consulta para que la lista y la marca de en curso no se desfasen. */
export function liveRoutineList(db = defaultDb) {
	return liveQuery(() => routineList(db));
}

/** Una rutina viva, en directo; `null` si no existe (`undefined` es "cargando"). */
export function liveRoutine(id: string, db = defaultDb) {
	return liveQuery(async () => (await routineById(id, db)) ?? null);
}
