import { liveQuery } from 'dexie';
import { db } from './db';
import { uuidv7 } from './id';
import { closeWorkout, isWorkoutOpen, newWorkout } from './rules';
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

async function lastActivityOf(workout: Workout): Promise<Date> {
	const last = await db.sets
		.where('workoutId')
		.equals(workout.id)
		.filter(alive)
		.reverse()
		.sortBy('performedAt');
	return new Date(last[0]?.performedAt ?? workout.startedAt);
}

/**
 * El entrenamiento en curso: el último abierto si tuvo actividad hace menos de 3 horas;
 * si no, se cierra ese y se crea uno nuevo. La interfaz no lo muestra en esta fase.
 */
export async function currentWorkout(now: Date): Promise<Workout> {
	const open = (
		await db.workouts
			.filter((w) => alive(w) && w.endedAt === null)
			.reverse()
			.sortBy('startedAt')
	)[0];
	if (open) {
		const lastActivity = await lastActivityOf(open);
		if (isWorkoutOpen(lastActivity, now)) return open;
		await db.workouts.put(closeWorkout(open, lastActivity, now));
	}
	const created = newWorkout(now);
	await db.workouts.add(created);
	return created;
}

export async function addSet(input: NewSet, now = new Date()): Promise<WorkoutSet> {
	return db.transaction('rw', db.workouts, db.sets, async () => {
		const workout = await currentWorkout(now);
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
export async function setsOf(exerciseId: string): Promise<WorkoutSet[]> {
	return db.sets.where('exerciseId').equals(exerciseId).filter(alive).sortBy('performedAt');
}

/** Las mismas series, como observable que se actualiza con cada cambio en la base. */
export function liveSetsOf(exerciseId: string) {
	return liveQuery(() => setsOf(exerciseId));
}

/** Borra (lógicamente) la serie más reciente del ejercicio; la fila queda para sincronizar. */
export async function deleteLastSet(
	exerciseId: string,
	now = new Date()
): Promise<WorkoutSet | undefined> {
	const last = (await setsOf(exerciseId)).at(-1);
	if (!last) return undefined;
	const deleted: WorkoutSet = {
		...last,
		deletedAt: now.toISOString(),
		updatedAt: now.toISOString(),
		pending: 1
	};
	await db.sets.put(deleted);
	return deleted;
}

/** El entrenamiento abierto más reciente y su última actividad, como observable. */
export function liveOpenWorkout() {
	return liveQuery(async () => {
		const open = (
			await db.workouts
				.filter((w) => alive(w) && w.endedAt === null)
				.reverse()
				.sortBy('startedAt')
		)[0];
		if (!open) return undefined;
		return { workout: open, lastActivity: (await lastActivityOf(open)).toISOString() };
	});
}
