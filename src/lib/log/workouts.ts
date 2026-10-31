/**
 * Operaciones sobre el entrenamiento (ADR-0006): empezar desde una rutina, terminar, cambiar el
 * modo y saber cuál está en curso. "Sin terminar" es no tener hora de fin; "en curso" lo decide la
 * regla de `rules.ts` con la hora actual, y lo que no debe seguir sin terminar se cierra aquí.
 */
import { liveQuery } from 'dexie';
import { db as defaultDb, type WorkoutLoggerDb } from './db';
import {
	alive,
	attachRoutine,
	changeMode,
	closeWorkout,
	isWorkoutOpen,
	newWorkout,
	type RoutineStart,
	type UnfinishedWorkout
} from './rules';
import { DEFAULT_MODE, isWorkoutMode, type Workout, type WorkoutMode } from './types';

/** Los entrenamientos vivos sin hora de fin, el más reciente primero. */
function unfinishedWorkouts(db: WorkoutLoggerDb): Promise<Workout[]> {
	return db.workouts
		.filter((w) => alive(w) && w.endedAt === null)
		.reverse()
		.sortBy('startedAt');
}

/** La hora de la última serie viva del entrenamiento, o la de su inicio si no tiene. */
async function lastActivity(workout: Workout, db: WorkoutLoggerDb): Promise<string> {
	const last = await db.sets
		.where('workoutId')
		.equals(workout.id)
		.filter(alive)
		.reverse()
		.sortBy('performedAt');
	return last[0]?.performedAt ?? workout.startedAt;
}

/** El entrenamiento sin terminar más reciente, con su última actividad: lo que Hoy y la página del ejercicio observan. */
export async function unfinishedWorkout(db = defaultDb): Promise<UnfinishedWorkout | undefined> {
	const [newest] = await unfinishedWorkouts(db);
	return newest && { workout: newest, lastActivity: await lastActivity(newest, db) };
}

/** Cierra un entrenamiento en su última serie (o en su inicio): lo que hace el tiempo o el siguiente "Empezar". */
async function closeAtLastActivity(
	workout: Workout,
	now: Date,
	db: WorkoutLoggerDb
): Promise<void> {
	await db.workouts.put(closeWorkout(workout, new Date(await lastActivity(workout, db)), now));
}

/**
 * El en curso, o nada. De paso cierra lo que no debe seguir sin terminar: los anteriores al más
 * reciente, si bajaron de otro dispositivo (el que empezó después cerró al anterior), y el libre
 * que ya lleva 3 horas sin series. Solo dentro de una transacción de escritura.
 */
async function settleUnfinished(now: Date, db: WorkoutLoggerDb): Promise<Workout | undefined> {
	const [newest, ...older] = await unfinishedWorkouts(db);
	if (!newest) return undefined;
	for (const workout of older) await closeAtLastActivity(workout, now, db);
	const unfinished = { workout: newest, lastActivity: await lastActivity(newest, db) };
	if (isWorkoutOpen(unfinished, now)) return newest;
	await closeAtLastActivity(newest, now, db);
	return undefined;
}

/** El último modo elegido en este dispositivo; acompañamiento mientras no se elija otro. */
export async function lastMode(db = defaultDb): Promise<WorkoutMode> {
	const stored = (await db.meta.get('lastMode'))?.value;
	return isWorkoutMode(stored) ? stored : DEFAULT_MODE;
}

const rememberMode = (mode: WorkoutMode, db: WorkoutLoggerDb) =>
	db.meta.put({ key: 'lastMode', value: mode });

/** El entrenamiento en curso o, si no hay, un libre nuevo en el último modo elegido. */
export async function currentWorkout(now: Date, db = defaultDb): Promise<Workout> {
	const current = await settleUnfinished(now, db);
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
		const current = await settleUnfinished(now, db);
		if (current?.routineId === null) {
			const attached = attachRoutine(current, start, now);
			await db.workouts.put(attached);
			return attached;
		}
		if (current) await closeAtLastActivity(current, now, db);
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
		const current = await settleUnfinished(now, db);
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
		const current = await settleUnfinished(now, db);
		if (!current) return undefined;
		const changed = changeMode(current, mode, now);
		await db.workouts.put(changed);
		return changed;
	});
}

/** El entrenamiento sin terminar más reciente, vivo desde la base, para Hoy; `null` si no hay (`undefined` es "cargando"). */
export function liveUnfinishedWorkout(db = defaultDb) {
	return liveQuery(async () => (await unfinishedWorkout(db)) ?? null);
}
