import { liveQuery } from 'dexie';
import { db as defaultDb, type WorkoutLoggerDb } from './db';
import { uuidv7 } from './id';
import { closeWorkout, isWorkoutOpen, newWorkout, type OpenWorkout } from './rules';
import type { SetType, Workout, WorkoutSet } from './types';

export type NewSet = {
	exerciseId: string;
	reps: number;
	weight: number;
	rir: number | null;
	type: SetType;
	note: string | null;
};

const alive = (row: { deletedAt: string | null }) => row.deletedAt === null;

/** El entrenamiento abierto más reciente, con la hora de su última serie viva (o de su inicio). */
async function openWorkout(db: WorkoutLoggerDb): Promise<OpenWorkout | undefined> {
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

/**
 * El entrenamiento en curso: el último abierto si tuvo actividad hace menos de 3 horas;
 * si no, se cierra ese y se crea uno nuevo. La interfaz no lo muestra en esta fase.
 */
export async function currentWorkout(now: Date, db = defaultDb): Promise<Workout> {
	const open = await openWorkout(db);
	if (open) {
		const lastActivity = new Date(open.lastActivity);
		if (isWorkoutOpen(lastActivity, now)) return open.workout;
		await db.workouts.put(closeWorkout(open.workout, lastActivity, now));
	}
	const created = newWorkout(now);
	await db.workouts.add(created);
	return created;
}

export async function addSet(input: NewSet, now = new Date(), db = defaultDb): Promise<WorkoutSet> {
	return db.transaction('rw', db.workouts, db.sets, async () => {
		const workout = await currentWorkout(now, db);
		const at = now.toISOString();
		const set: WorkoutSet = {
			id: uuidv7(now.getTime()),
			userId: workout.userId,
			workoutId: workout.id,
			...input,
			performedAt: at,
			createdAt: at,
			updatedAt: at,
			deletedAt: null,
			pending: 1
		};
		await db.sets.add(set);
		return set;
	});
}

/** Las series vivas de un ejercicio, en orden de tiempo. */
export async function setsOf(exerciseId: string, db = defaultDb): Promise<WorkoutSet[]> {
	return db.sets.where('exerciseId').equals(exerciseId).filter(alive).sortBy('performedAt');
}

/** Lo que la página de un ejercicio necesita, en una sola consulta viva para que no se desfase. */
export function liveExerciseLog(exerciseId: string, db = defaultDb) {
	return liveQuery(async () => ({
		sets: await setsOf(exerciseId, db),
		open: await openWorkout(db)
	}));
}

/** Borra (lógicamente) la última serie del ejercicio en el entrenamiento en curso; la fila queda para sincronizar. */
export async function deleteLastSet(
	exerciseId: string,
	now = new Date(),
	db = defaultDb
): Promise<WorkoutSet | undefined> {
	return db.transaction('rw', db.workouts, db.sets, async () => {
		const open = await openWorkout(db);
		if (!open || !isWorkoutOpen(new Date(open.lastActivity), now)) return undefined;
		const last = (await setsOf(exerciseId, db))
			.filter((s) => s.workoutId === open.workout.id)
			.at(-1);
		if (!last) return undefined;
		const at = now.toISOString();
		const deleted: WorkoutSet = { ...last, deletedAt: at, updatedAt: at, pending: 1 };
		await db.sets.put(deleted);
		return deleted;
	});
}
