import { liveQuery } from 'dexie';
import { db as defaultDb } from './db';
import { uuidv7 } from './id';
import { alive, openWorkout } from './rules';
import type { SetType, WorkoutSet } from './types';
import { currentWorkout, unfinishedWorkout } from './workouts';

export type NewSet = {
	exerciseId: string;
	reps: number;
	weight: number;
	rir: number | null;
	type: SetType;
	note: string | null;
};

/** Registra una serie en el entrenamiento en curso; sin ninguno, nace un libre con ella. */
export async function addSet(input: NewSet, now = new Date(), db = defaultDb): Promise<WorkoutSet> {
	return db.transaction('rw', db.workouts, db.sets, db.meta, async () => {
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
		unfinished: await unfinishedWorkout(db)
	}));
}

/** Borra (lógicamente) la última serie del ejercicio en el entrenamiento en curso; la fila queda para sincronizar. */
export async function deleteLastSet(
	exerciseId: string,
	now = new Date(),
	db = defaultDb
): Promise<WorkoutSet | undefined> {
	return db.transaction('rw', db.workouts, db.sets, async () => {
		const open = openWorkout(await unfinishedWorkout(db), now);
		if (!open) return undefined;
		const last = (await setsOf(exerciseId, db)).filter((s) => s.workoutId === open.id).at(-1);
		if (!last) return undefined;
		const at = now.toISOString();
		const deleted: WorkoutSet = { ...last, deletedAt: at, updatedAt: at, pending: 1 };
		await db.sets.put(deleted);
		return deleted;
	});
}
