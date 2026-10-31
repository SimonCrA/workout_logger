import { liveQuery } from 'dexie';
import { db as defaultDb, type WorkoutLoggerDb } from './db';
import {
	attachRoutine,
	changeMode,
	closeWorkout,
	isWorkoutOpen,
	newWorkout,
	type OpenWorkout,
	type RoutineStart
} from './rules';
import type { Workout, WorkoutMode } from './types';

/** Operaciones sobre el entrenamiento (ADR-0006): empezar, terminar, cambiar el modo y saber cuál está en curso. */

const alive = (row: { deletedAt: string | null }) => row.deletedAt === null;

/** El entrenamiento sin hora de fin más reciente, con la hora de su última serie viva (o de su inicio). */
export async function openWorkout(db = defaultDb): Promise<OpenWorkout | undefined> {
	const open = (
		await db.workouts
			.filter((w) => alive(w) && w.endedAt === null)
			.reverse()
			.sortBy('startedAt')
	)[0];
	if (!open) return undefined;
	const last = await db.sets
		.where('workoutId')
		.equals(open.id)
		.filter(alive)
		.reverse()
		.sortBy('performedAt');
	return { workout: open, lastActivity: last[0]?.performedAt ?? open.startedAt };
}

/** El último modo elegido en este dispositivo; acompañamiento mientras no se elija otro. */
export async function lastMode(db = defaultDb): Promise<WorkoutMode> {
	return (await db.meta.get('lastMode'))?.value === 'log' ? 'log' : 'companion';
}

const rememberMode = (mode: WorkoutMode, db: WorkoutLoggerDb) =>
	db.meta.put({ key: 'lastMode', value: mode });

/** El en curso, o nada; de paso cierra en su última serie el libre que ya lleva 3 horas sin ellas. */
async function inProgress(now: Date, db: WorkoutLoggerDb): Promise<Workout | undefined> {
	const open = await openWorkout(db);
	if (!open) return undefined;
	if (isWorkoutOpen(open, now)) return open.workout;
	await db.workouts.put(closeWorkout(open.workout, new Date(open.lastActivity), now));
	return undefined;
}

/** El entrenamiento en curso o, si no hay, un libre nuevo en el último modo elegido. */
export async function currentWorkout(now: Date, db = defaultDb): Promise<Workout> {
	const current = await inProgress(now, db);
	if (current) return current;
	const created = newWorkout(now, await lastMode(db));
	await db.workouts.add(created);
	return created;
}

/**
 * Empezar desde una rutina. Un libre en curso adquiere la rutina, el nombre y el modo; cualquier
 * otro en curso se cierra en su última serie (o en su inicio) y nace uno nuevo. Nunca hay dos.
 */
export async function startWorkout(
	start: RoutineStart,
	now = new Date(),
	db = defaultDb
): Promise<Workout> {
	return db.transaction('rw', db.workouts, db.sets, db.meta, async () => {
		await rememberMode(start.mode, db);
		const open = await openWorkout(db);
		if (open && isWorkoutOpen(open, now) && open.workout.routineId === null) {
			const attached = attachRoutine(open.workout, start, now);
			await db.workouts.put(attached);
			return attached;
		}
		if (open) await db.workouts.put(closeWorkout(open.workout, new Date(open.lastActivity), now));
		const created = attachRoutine(newWorkout(now, start.mode), start, now);
		await db.workouts.add(created);
		return created;
	});
}

/** Terminar: el en curso se cierra ahora mismo. Nada si no hay ninguno. */
export async function finishWorkout(
	now = new Date(),
	db = defaultDb
): Promise<Workout | undefined> {
	return db.transaction('rw', db.workouts, db.sets, async () => {
		const current = await inProgress(now, db);
		if (!current) return undefined;
		const finished = closeWorkout(current, now, now);
		await db.workouts.put(finished);
		return finished;
	});
}

/** Cambia el modo del en curso y lo recuerda como última elección. */
export async function changeWorkoutMode(
	mode: WorkoutMode,
	now = new Date(),
	db = defaultDb
): Promise<Workout | undefined> {
	return db.transaction('rw', db.workouts, db.sets, db.meta, async () => {
		await rememberMode(mode, db);
		const current = await inProgress(now, db);
		if (!current) return undefined;
		const changed = changeMode(current, mode, now);
		await db.workouts.put(changed);
		return changed;
	});
}

/** El entrenamiento sin fin más reciente, vivo desde la base, para Hoy; `null` si no hay (y no `undefined`, que es "cargando"). */
export function liveOpenWorkout(db = defaultDb) {
	return liveQuery(async () => (await openWorkout(db)) ?? null);
}
