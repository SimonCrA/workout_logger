import { liveQuery } from 'dexie';
import type { RoutineExercise } from '#lib/catalog/types.js';
import { db as defaultDb } from './db';
import { uuidv7 } from './id';
import { prescriptionFor } from './routine-rules';
import { openWorkout, type UnfinishedWorkout } from './rules';
import type { SetType, WorkoutMode, WorkoutSet } from './types';
import { currentWorkout, lastMode, routineOf, setsOf, unfinishedWorkout } from './workouts';

export type NewSet = {
	exerciseId: string;
	reps: number;
	weight: number;
	rir: number | null;
	type: SetType;
	note: string | null;
};

/**
 * Registra varias series iguales de una vez, con la misma hora, en el entrenamiento en curso;
 * sin ninguno, nace un libre con ellas. Así se anota "3 × 10 × 60 kg" en solo registrar.
 */
export async function addSets(
	input: NewSet,
	count: number,
	now = new Date(),
	db = defaultDb
): Promise<WorkoutSet[]> {
	if (!Number.isInteger(count) || count < 1) {
		throw new RangeError(`Se registran series enteras, una al menos: ${count}`);
	}
	return db.transaction('rw', db.workouts, db.sets, db.meta, async () => {
		const workout = await currentWorkout(now, db);
		const at = now.toISOString();
		const sets: WorkoutSet[] = Array.from({ length: count }, () => ({
			id: uuidv7(now.getTime()),
			userId: workout.userId,
			workoutId: workout.id,
			...input,
			performedAt: at,
			createdAt: at,
			updatedAt: at,
			deletedAt: null,
			pending: 1
		}));
		await db.sets.bulkAdd(sets);
		return sets;
	});
}

/** Registra una serie en el entrenamiento en curso; sin ninguno, nace un libre con ella. */
export async function addSet(input: NewSet, now = new Date(), db = defaultDb): Promise<WorkoutSet> {
	const [set] = await addSets(input, 1, now, db);
	return set;
}

/** Lo que la página de un ejercicio observa; `unfinished` es `null` si no hay ninguno (`undefined` es "cargando"). */
export type ExerciseLog = {
	/** Las series vivas del ejercicio, de todos los entrenamientos, en orden. */
	sets: WorkoutSet[];
	unfinished: UnfinishedWorkout | null;
	/** Lo que la rutina del entrenamiento prescribe para este ejercicio, si lo incluye. */
	prescribed: RoutineExercise | null;
	/** El último modo elegido: con nada en curso, el que tendrá el libre que nazca con la próxima serie. */
	lastMode: WorkoutMode;
};

/** Las series del ejercicio, el entrenamiento sin terminar con su última serie, la prescripción de su rutina y el último modo. */
export async function exerciseLog(exerciseId: string, db = defaultDb): Promise<ExerciseLog> {
	const unfinished = (await unfinishedWorkout(db)) ?? null;
	const routine = unfinished && (await routineOf(unfinished.workout, db));
	return {
		sets: await setsOf(exerciseId, db),
		unfinished,
		prescribed: prescriptionFor(routine?.exercises ?? [], exerciseId),
		lastMode: await lastMode(db)
	};
}

/** Lo de la página de un ejercicio en una sola consulta viva, para que no se desfase. */
export function liveExerciseLog(exerciseId: string, db = defaultDb) {
	return liveQuery(() => exerciseLog(exerciseId, db));
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
