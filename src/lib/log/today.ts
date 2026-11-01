/**
 * Hoy durante el entrenamiento (spec #10): lo que la rutina prescribe frente a lo registrado en el
 * entrenamiento en curso, y lo registrado fuera de ella. Funciones puras sobre las series del
 * entrenamiento; la interfaz solo las dibuja.
 */
import type { RoutineExercise } from '#lib/catalog/types.js';
import { byTime, isWorkSet } from './rules';
import type { WorkoutSet } from './types';

/** Un ejercicio de la rutina con las series de trabajo hechas y si ya alcanzó las prescritas. */
export type RoutineProgress = { entry: RoutineExercise; done: number; met: boolean };

/** El progreso en series de trabajo de cada ejercicio de la rutina, en su orden; saltarse uno lo deja en 0. */
export function routineProgress(
	exercises: readonly RoutineExercise[],
	sets: readonly WorkoutSet[]
): RoutineProgress[] {
	return exercises.map((entry) => {
		const done = sets.filter((set) => set.exerciseId === entry.exerciseId && isWorkSet(set)).length;
		return { entry, done, met: done >= entry.sets };
	});
}

/** Un ejercicio registrado fuera de la rutina, con sus series en orden. */
export type AddedExercise = { exerciseId: string; sets: WorkoutSet[] };

/** Añadidos: los ejercicios con series en el entrenamiento que la rutina no prescribe, en orden de primera serie. */
export function addedExercises(
	exercises: readonly RoutineExercise[],
	sets: readonly WorkoutSet[]
): AddedExercise[] {
	const prescribed = new Set(exercises.map((entry) => entry.exerciseId));
	const added = new Map<string, WorkoutSet[]>();
	for (const set of [...sets].sort(byTime)) {
		if (prescribed.has(set.exerciseId)) continue;
		added.set(set.exerciseId, [...(added.get(set.exerciseId) ?? []), set]);
	}
	return [...added.entries()].map(([exerciseId, group]) => ({ exerciseId, sets: group }));
}
