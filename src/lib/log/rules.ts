import { uuidv7 } from './id';
import type { Workout, WorkoutMode, WorkoutSet } from './types';

/** Un entrenamiento libre sigue en curso mientras su última serie tenga menos de 3 horas. */
export const WORKOUT_IDLE_MS = 3 * 60 * 60 * 1000;

/** Una fila viva: sin borrado lógico. */
export const alive = (row: { deletedAt: string | null }) => row.deletedAt === null;

/** Serie de trabajo: cualquiera que no sea de calentamiento (GLOSSARY). Solo estas cuentan. */
export const workSet = (set: Pick<WorkoutSet, 'type'>): boolean => set.type !== 'warmup';

/**
 * Un entrenamiento sin terminar (sin hora de fin) y cuándo tuvo su última serie, o su inicio si
 * no tiene. Sin terminar no es lo mismo que en curso: un libre deja de estar en curso por el tiempo.
 */
export type UnfinishedWorkout = { workout: Workout; lastActivity: string };

/**
 * En curso (ADR-0006): uno empezado desde una rutina lo está hasta que se termina a mano o se
 * empieza otro; uno libre, que nadie empieza, deja de estarlo a las 3 horas sin series.
 */
export function isWorkoutOpen(unfinished: UnfinishedWorkout, now: Date): boolean {
	if (unfinished.workout.routineId !== null) return true;
	return now.getTime() - new Date(unfinished.lastActivity).getTime() < WORKOUT_IDLE_MS;
}

/** El entrenamiento en curso, o nada. */
export function openWorkout(
	unfinished: UnfinishedWorkout | null | undefined,
	now: Date
): Workout | undefined {
	return unfinished && isWorkoutOpen(unfinished, now) ? unfinished.workout : undefined;
}

/** Un entrenamiento libre nuevo en el modo dado, anónimo y pendiente de subir. */
export function newWorkout(now: Date, mode: WorkoutMode): Workout {
	const at = now.toISOString();
	return {
		id: uuidv7(now.getTime()),
		userId: null,
		routineId: null,
		title: null,
		mode,
		startedAt: at,
		endedAt: null,
		createdAt: at,
		updatedAt: at,
		deletedAt: null,
		pending: 1
	};
}

/** Con qué se empieza desde una rutina: la rutina, su nombre tal como se llama ahora y el modo elegido. */
export type RoutineStart = { routineId: string; title: string; mode: WorkoutMode };

/** Adjunta una rutina a un entrenamiento (un libre en curso al que se le empieza una rutina). */
export function attachRoutine(workout: Workout, start: RoutineStart, now: Date): Workout {
	return { ...workout, ...start, updatedAt: now.toISOString(), pending: 1 };
}

/** Cambia el modo a mitad de entrenamiento. */
export function changeMode(workout: Workout, mode: WorkoutMode, now: Date): Workout {
	return { ...workout, mode, updatedAt: now.toISOString(), pending: 1 };
}

/**
 * Cierra un entrenamiento en el momento dado: su última actividad cuando lo cierra el tiempo o el
 * siguiente "Empezar", ahora mismo cuando se pulsa "Terminar". Nunca se reabre.
 */
export function closeWorkout(workout: Workout, endedAt: Date, now: Date): Workout {
	return {
		...workout,
		endedAt: endedAt.toISOString(),
		updatedAt: now.toISOString(),
		pending: 1
	};
}

/** El día en hora local como número ordenable: 20261031. */
const localDay = (date: Date) =>
	date.getFullYear() * 10_000 + (date.getMonth() + 1) * 100 + date.getDate();

/** Si el entrenamiento empezó en un día anterior al de hoy, en fecha local (Hoy lo avisa). */
export function startedBeforeToday(startedAt: string, now: Date): boolean {
	return localDay(new Date(startedAt)) < localDay(now);
}

/** Suma un paso (1 rep, 2,5 kg) sin bajar de cero y sin arrastre de decimales. */
export function stepValue(value: number, delta: number): number {
	return nonNegative(value + delta);
}

/** Lo que se escribe a mano: nunca negativo, finito, con dos decimales como mucho. */
export function nonNegative(value: number): number {
	return Number.isFinite(value) ? Math.max(0, Math.round(value * 100) / 100) : 0;
}

/** Series en orden de tiempo. */
export const byTime = (a: WorkoutSet, b: WorkoutSet) => a.performedAt.localeCompare(b.performedAt);

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
