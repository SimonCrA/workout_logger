import { liveQuery } from 'dexie';
import type { RoutineExercise } from '#lib/catalog/types.js';
import { db as defaultDb, type WorkoutLoggerDb } from './db';
import { uuidv7 } from './id';
import { prescriptionFor } from './routine-rules';
import {
	alive,
	editSet,
	openWorkout,
	softDelete,
	type SetChanges,
	type UnfinishedWorkout
} from './rules';
import type { WorkoutMode, WorkoutSet } from './types';
import { currentWorkout, lastMode, routineOf, setsOf, unfinishedWorkout } from './workouts';

/** Lo que se registra: lo que tiene una serie, más el ejercicio. */
export type NewSet = SetChanges & { exerciseId: string };

/**
 * Registra varias series iguales de una vez, con la misma hora, en el entrenamiento en curso;
 * sin ninguno, nace un libre con ellas. La interfaz registra de una en una (`addSet`); el lote
 * queda para lo que llegue de otra parte.
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
	/** Cuándo empezó cada entrenamiento con el ejercicio, por id: la fecha de su punto en el gráfico. */
	startedAt: Record<string, string>;
};

/** Las series del ejercicio, el entrenamiento sin terminar con su última serie, la prescripción de su rutina, el último modo y el inicio de cada entrenamiento con el ejercicio. */
export async function exerciseLog(exerciseId: string, db = defaultDb): Promise<ExerciseLog> {
	const unfinished = (await unfinishedWorkout(db)) ?? null;
	const routine = unfinished && (await routineOf(unfinished.workout, db));
	const sets = await setsOf(exerciseId, db);
	const workouts = await db.workouts.bulkGet([...new Set(sets.map((set) => set.workoutId))]);
	return {
		sets,
		unfinished,
		prescribed: prescriptionFor(routine?.exercises ?? [], exerciseId),
		lastMode: await lastMode(db),
		startedAt: Object.fromEntries(
			workouts.flatMap((workout) => (workout ? [[workout.id, workout.startedAt]] : []))
		)
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
		const deleted = softDelete(last, now);
		await db.sets.put(deleted);
		return deleted;
	});
}

/** Una serie viva por id, o nada: lo que se corrige o se borra desde su fila. */
async function liveSet(id: string, db: WorkoutLoggerDb): Promise<WorkoutSet | undefined> {
	const set = await db.sets.get(id);
	return set && alive(set) ? set : undefined;
}

/** Corrige una serie, de hoy o de un día anterior, con lo mismo que se registra; nada si no existe o se borró. */
export async function updateSet(
	id: string,
	changes: SetChanges,
	now = new Date(),
	db = defaultDb
): Promise<WorkoutSet | undefined> {
	return db.transaction('rw', db.sets, async () => {
		const current = await liveSet(id, db);
		if (!current) return undefined;
		const edited = editSet(current, changes, now);
		await db.sets.put(edited);
		return edited;
	});
}

/** Borra (lógicamente) una serie, de hoy o de un día anterior; nada si no existe o ya se borró. */
export async function deleteSet(
	id: string,
	now = new Date(),
	db = defaultDb
): Promise<WorkoutSet | undefined> {
	return db.transaction('rw', db.sets, async () => {
		const current = await liveSet(id, db);
		if (!current) return undefined;
		const deleted = softDelete(current, now);
		await db.sets.put(deleted);
		return deleted;
	});
}
