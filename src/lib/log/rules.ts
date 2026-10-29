import { uuidv7 } from './id';
import type { Workout, WorkoutSet } from './types';

/** Un entrenamiento sigue abierto mientras su última serie tenga menos de 3 horas. */
export const WORKOUT_IDLE_MS = 3 * 60 * 60 * 1000;

export function isWorkoutOpen(lastActivity: Date, now: Date): boolean {
	return now.getTime() - lastActivity.getTime() < WORKOUT_IDLE_MS;
}

/** El entrenamiento abierto más reciente y cuándo tuvo su última serie. */
export type OpenWorkout = { workout: Workout; lastActivity: string };

/** El id del entrenamiento en curso, o nada si el último abierto ya lleva 3 horas sin series. */
export function currentWorkoutId(open: OpenWorkout | undefined, now: Date): string | undefined {
	return open && isWorkoutOpen(new Date(open.lastActivity), now) ? open.workout.id : undefined;
}

/** Un entrenamiento libre nuevo, anónimo y pendiente de subir. */
export function newWorkout(now: Date): Workout {
	const at = now.toISOString();
	return {
		id: uuidv7(now.getTime()),
		userId: null,
		startedAt: at,
		endedAt: null,
		createdAt: at,
		updatedAt: at,
		deletedAt: null,
		pending: 1
	};
}

/** Cierra un entrenamiento en su última actividad; la fecha de actualización es la de ahora. */
export function closeWorkout(workout: Workout, lastActivity: Date, now: Date): Workout {
	return {
		...workout,
		endedAt: lastActivity.toISOString(),
		updatedAt: now.toISOString(),
		pending: 1
	};
}

/** Suma un paso (1 rep, 2,5 kg) sin bajar de cero y sin arrastre de decimales. */
export function stepValue(value: number, delta: number): number {
	return nonNegative(value + delta);
}

/** Lo que se escribe a mano: nunca negativo, finito, con dos decimales como mucho. */
export function nonNegative(value: number): number {
	return Number.isFinite(value) ? Math.max(0, Math.round(value * 100) / 100) : 0;
}

const byTime = (a: WorkoutSet, b: WorkoutSet) => a.performedAt.localeCompare(b.performedAt);

/** Reps y peso con que arranca el registro: la serie más reciente del ejercicio. */
export function prefillFor(sets: readonly WorkoutSet[]): { reps: number; weight: number } {
	const latest = [...sets].sort(byTime).at(-1);
	return latest ? { reps: latest.reps, weight: latest.weight } : { reps: 10, weight: 0 };
}

/** Las series de un entrenamiento; `date` es la hora de su primera serie. */
export type WorkoutGroup = { workoutId: string; date: string; sets: WorkoutSet[] };

/** Historial por entrenamiento, el más reciente primero, con sus series en orden. */
export function groupByWorkout(sets: readonly WorkoutSet[]): WorkoutGroup[] {
	const groups = new Map<string, WorkoutSet[]>();
	for (const set of [...sets].sort(byTime)) {
		groups.set(set.workoutId, [...(groups.get(set.workoutId) ?? []), set]);
	}
	return [...groups.entries()]
		.map(([workoutId, group]) => ({ workoutId, date: group[0].performedAt, sets: group }))
		.sort((a, b) => b.date.localeCompare(a.date));
}

/** Última vez: las series del entrenamiento más reciente con el ejercicio, sin contar el que está en curso. */
export function lastTime(sets: readonly WorkoutSet[], currentWorkoutId?: string): WorkoutSet[] {
	return groupByWorkout(sets).find((group) => group.workoutId !== currentWorkoutId)?.sets ?? [];
}
