// Único lugar que construye filas de prueba: una columna nueva en los tipos se añade solo aquí.
import type { Routine, Workout, WorkoutSet } from './types';

const AT = '2026-10-28T18:00:00.000Z';

/** Una serie completa; sin fecha propia, `createdAt` y `updatedAt` siguen a `performedAt`. */
export function makeSet(partial: Partial<WorkoutSet> = {}): WorkoutSet {
	const performedAt = partial.performedAt ?? AT;
	return {
		id: 's1',
		userId: null,
		workoutId: 'w1',
		exerciseId: 'press-de-banca-plano',
		reps: 8,
		weight: 60,
		rir: null,
		type: 'normal',
		note: null,
		performedAt,
		createdAt: performedAt,
		updatedAt: performedAt,
		deletedAt: null,
		pending: 1,
		...partial
	};
}

/** Un entrenamiento completo, libre y en curso; sin fecha propia, las de la fila siguen a `startedAt`. */
export function makeWorkout(partial: Partial<Workout> = {}): Workout {
	const startedAt = partial.startedAt ?? AT;
	return {
		id: 'w1',
		userId: null,
		routineId: null,
		title: null,
		mode: 'companion',
		startedAt,
		endedAt: null,
		createdAt: startedAt,
		updatedAt: startedAt,
		deletedAt: null,
		pending: 1,
		...partial
	};
}

/** Una rutina completa y vacía. */
export function makeRoutine(partial: Partial<Routine> = {}): Routine {
	return {
		id: 'r1',
		userId: null,
		name: 'Rutina',
		baseRoutineId: null,
		exercises: [],
		createdAt: AT,
		updatedAt: AT,
		deletedAt: null,
		pending: 1,
		...partial
	};
}
