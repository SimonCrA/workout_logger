/**
 * Hoy durante el entrenamiento (spec #10): lo que la rutina prescribe frente a lo registrado en el
 * entrenamiento en curso, y lo registrado fuera de ella. Funciones puras sobre las series del
 * entrenamiento; la interfaz solo las dibuja.
 */
import type { RoutineExercise } from '#lib/catalog/types.js';
import { groupByExercise, isWorkSet, type ExerciseGroup } from './rules';
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

/**
 * El ejercicio que toca: el primero de la rutina, en su orden, que no alcanzó sus series
 * prescritas. -1 si todos las alcanzaron.
 */
export function nextInRoutine(progress: readonly RoutineProgress[]): number {
	return progress.findIndex((item) => !item.met);
}

/**
 * A dónde lleva Empezar una rutina: al registro del ejercicio que toca, contando las series que
 * ya tenga el entrenamiento (un libre al que se adjunta la rutina), o a Hoy si no queda ninguno.
 */
export function startDestination(
	exercises: readonly RoutineExercise[],
	sets: readonly WorkoutSet[]
): string {
	const next = exercises[nextInRoutine(routineProgress(exercises, sets))];
	return next ? `/ejercicios/${next.exerciseId}` : '/';
}

/**
 * El ejercicio que viene después de `currentId` en la rutina: el primero sin sus series, siguiendo
 * el orden desde el actual y volviendo al principio. Uno que la rutina no prescribe (un añadido)
 * lleva al primero sin sus series. Nada si no queda ninguno.
 */
export function followingExercise(
	exercises: readonly RoutineExercise[],
	sets: readonly WorkoutSet[],
	currentId: string
): RoutineExercise | null {
	const progress = routineProgress(exercises, sets);
	const at = exercises.findIndex((entry) => entry.exerciseId === currentId);
	const order = at < 0 ? progress : [...progress.slice(at + 1), ...progress.slice(0, at)];
	return order.find((item) => !item.met)?.entry ?? null;
}

/**
 * La serie que se va a registrar: "Serie 3 de 3" contra lo que prescribe la rutina, con las de
 * trabajo de hoy; pasadas las prescritas, "Serie 4 · objetivo cumplido"; sin rutina, "Serie 2".
 */
export function nextSetLabel(
	today: readonly WorkoutSet[],
	prescribed: RoutineExercise | null
): string {
	if (!prescribed) return `Serie ${today.length + 1}`;
	const done = today.filter(isWorkSet).length;
	return done < prescribed.sets
		? `Serie ${done + 1} de ${prescribed.sets}`
		: `Serie ${done + 1} · objetivo cumplido`;
}

/** Añadidos: los ejercicios con series en el entrenamiento que la rutina no prescribe, en orden de primera serie. */
export function addedExercises(
	exercises: readonly RoutineExercise[],
	sets: readonly WorkoutSet[]
): ExerciseGroup[] {
	const prescribed = new Set(exercises.map((entry) => entry.exerciseId));
	return groupByExercise(sets.filter((set) => !prescribed.has(set.exerciseId)));
}
