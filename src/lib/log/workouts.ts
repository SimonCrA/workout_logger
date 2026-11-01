/**
 * Operaciones sobre el entrenamiento (ADR-0006): empezar desde una rutina, terminar, cambiar el
 * modo y saber cuál está en curso. "Sin terminar" es no tener hora de fin; "en curso" lo decide la
 * regla de `rules.ts` con la hora actual, y lo que no debe seguir sin terminar se cierra aquí.
 */
import { liveQuery } from 'dexie';
import { db as defaultDb, type WorkoutLoggerDb } from './db';
import { historyEntries, type WorkoutEntry } from './history';
import {
	alive,
	attachRoutine,
	changeMode,
	closeWorkout,
	isWorkoutOpen,
	lastActivity,
	lastTime,
	newWorkout,
	shiftWorkout,
	softDelete,
	type MovedWorkout,
	type RoutineStart,
	type UnfinishedWorkout
} from './rules';
import {
	DEFAULT_MODE,
	isWorkoutMode,
	type Routine,
	type Workout,
	type WorkoutMode,
	type WorkoutSet
} from './types';

/** Los entrenamientos vivos sin hora de fin, el más reciente primero. */
function unfinishedWorkouts(db: WorkoutLoggerDb): Promise<Workout[]> {
	return db.workouts
		.filter((w) => alive(w) && w.endedAt === null)
		.reverse()
		.sortBy('startedAt');
}

/** Un entrenamiento con la hora de su última serie viva, de cualquier ejercicio, o nada si no tiene. */
async function withLastSet(workout: Workout, db: WorkoutLoggerDb): Promise<UnfinishedWorkout> {
	const last = await db.sets
		.where('workoutId')
		.equals(workout.id)
		.filter(alive)
		.reverse()
		.sortBy('performedAt');
	return { workout, lastSetAt: last[0]?.performedAt ?? null };
}

/** El entrenamiento sin terminar más reciente, con su última serie: lo que Hoy y la página del ejercicio observan. */
export async function unfinishedWorkout(db = defaultDb): Promise<UnfinishedWorkout | undefined> {
	const [newest] = await unfinishedWorkouts(db);
	return newest && (await withLastSet(newest, db));
}

/** Cierra un entrenamiento en su última serie (o en su inicio): lo que hace el tiempo o el siguiente "Empezar". */
async function closeAtLastActivity(
	workout: Workout,
	now: Date,
	db: WorkoutLoggerDb
): Promise<void> {
	const unfinished = await withLastSet(workout, db);
	await db.workouts.put(closeWorkout(workout, new Date(lastActivity(unfinished)), now));
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
	if (isWorkoutOpen(await withLastSet(newest, db), now)) return newest;
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

/** Las series vivas de un ejercicio, en orden de tiempo. */
export async function setsOf(exerciseId: string, db = defaultDb): Promise<WorkoutSet[]> {
	return db.sets.where('exerciseId').equals(exerciseId).filter(alive).sortBy('performedAt');
}

/** Lo que Hoy observa durante el entrenamiento; `unfinished` es `null` si no hay ninguno (`undefined` es "cargando"). */
export type TodayLog = {
	unfinished: UnfinishedWorkout | null;
	/** La rutina del entrenamiento, aunque se haya borrado después: lo que empezó con ella lo sigue guiando hasta Terminar. */
	routine: Routine | null;
	/** Las series vivas del entrenamiento, en orden. */
	sets: WorkoutSet[];
	/** Última vez de cada ejercicio de la rutina, sin contar este entrenamiento. */
	lastTimes: Record<string, WorkoutSet[]>;
};

/** La rutina de un entrenamiento, aunque se haya borrado después; nada si es libre. */
export async function routineOf(workout: Workout, db = defaultDb): Promise<Routine | null> {
	return workout.routineId === null ? null : ((await db.routines.get(workout.routineId)) ?? null);
}

/** El entrenamiento sin terminar con su rutina, sus series y la última vez de cada ejercicio de la rutina. */
export async function todayLog(db = defaultDb): Promise<TodayLog> {
	const unfinished = await unfinishedWorkout(db);
	if (!unfinished) return { unfinished: null, routine: null, sets: [], lastTimes: {} };
	const { workout } = unfinished;
	const routine = await routineOf(workout, db);
	const sets = await db.sets
		.where('workoutId')
		.equals(workout.id)
		.filter(alive)
		.sortBy('performedAt');
	const lastTimes: Record<string, WorkoutSet[]> = {};
	for (const { exerciseId } of routine?.exercises ?? []) {
		lastTimes[exerciseId] = lastTime(await setsOf(exerciseId, db), workout.id);
	}
	return { unfinished, routine, sets, lastTimes };
}

/** Lo de Hoy en una sola consulta viva, para que el entrenamiento, la rutina y las series no se desfasen. */
export function liveTodayLog(db = defaultDb) {
	return liveQuery(() => todayLog(db));
}

/** Historial: los entrenamientos vivos con al menos una serie viva, el más reciente primero, con sus series. */
export async function workoutHistory(db = defaultDb): Promise<WorkoutEntry[]> {
	return historyEntries(await db.workouts.toArray(), await db.sets.toArray());
}

/** Historial en directo. */
export function liveWorkoutHistory(db = defaultDb) {
	return liveQuery(() => workoutHistory(db));
}

/** Un entrenamiento vivo con sus series vivas en orden, o nada si no existe o se borró. */
export async function workoutEntry(id: string, db = defaultDb): Promise<WorkoutEntry | undefined> {
	const workout = await db.workouts.get(id);
	if (!workout || !alive(workout)) return undefined;
	const sets = await db.sets.where('workoutId').equals(id).filter(alive).sortBy('performedAt');
	return { workout, sets };
}

/**
 * Borra (lógicamente) un entrenamiento entero con sus series vivas (spec #18); las borradas antes
 * conservan su hora. Nada si no existe o ya se borró. Si era el en curso, no queda ninguno.
 */
export async function deleteWorkout(
	id: string,
	now = new Date(),
	db = defaultDb
): Promise<Workout | undefined> {
	return db.transaction('rw', db.workouts, db.sets, async () => {
		const entry = await workoutEntry(id, db);
		if (!entry) return undefined;
		const deleted = softDelete(entry.workout, now);
		await db.workouts.put(deleted);
		await db.sets.bulkPut(entry.sets.map((set) => softDelete(set, now)));
		return deleted;
	});
}

/**
 * Mueve un entrenamiento a otro inicio y sus series vivas con él (ADR-0006). Nada si no existe,
 * se borró o ya empieza a esa hora: entonces no hay nada que subir.
 */
export async function moveWorkout(
	id: string,
	startedAt: Date,
	now = new Date(),
	db = defaultDb
): Promise<MovedWorkout | undefined> {
	return db.transaction('rw', db.workouts, db.sets, async () => {
		const entry = await workoutEntry(id, db);
		if (!entry || entry.workout.startedAt === startedAt.toISOString()) return undefined;
		const moved = shiftWorkout(entry.workout, entry.sets, startedAt, now);
		await db.workouts.put(moved.workout);
		await db.sets.bulkPut(moved.sets);
		return moved;
	});
}

/** El detalle de un entrenamiento en directo; `null` si no existe (`undefined` es "cargando"). */
export function liveWorkoutEntry(id: string, db = defaultDb) {
	return liveQuery(async () => (await workoutEntry(id, db)) ?? null);
}
