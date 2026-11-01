/**
 * Acompañamiento (GLOSSARY): lo que la app mide mientras va con la persona. El tiempo
 * transcurrido desde el inicio y el descanso desde la última serie, comparado con el que la
 * rutina sugiere para el ejercicio que toca: en la página de un ejercicio, ese; en Hoy, el de la
 * última serie, que es el que más probablemente sigue. Se calcula a partir de las horas de las
 * series, así que en solo registrar, donde varias series comparten hora, no se muestra
 * (ADR-0006). Funciones puras; la interfaz decide cada segundo con la hora actual.
 */
import { isWorkoutOpen, type UnfinishedWorkout } from './rules';
import type { Workout, WorkoutMode } from './types';

/** Solo con acompañamiento hay tiempos que mostrar; en solo registrar las horas no significan nada. */
export const hasTimes = (mode: WorkoutMode): boolean => mode === 'companion';

/** Segundos enteros desde una hora hasta ahora; cero si esa hora aún no llegó (otro dispositivo, reloj desfasado). */
const secondsSince = (iso: string, now: Date): number =>
	Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 1000));

/**
 * Desde cuándo corre el contador de descanso: la última serie del entrenamiento en curso, de
 * cualquier ejercicio, solo con acompañamiento. Nada sin entrenamiento en curso, en solo
 * registrar o antes de la primera serie.
 */
export function restStart(
	unfinished: UnfinishedWorkout | null | undefined,
	now: Date
): string | null {
	if (!unfinished || !isWorkoutOpen(unfinished, now)) return null;
	return hasTimes(unfinished.workout.mode) ? unfinished.lastSetAt : null;
}

/** Descanso: los segundos desde la última serie del entrenamiento, de cualquier ejercicio. */
export const restSeconds = (lastSetAt: string, now: Date): number => secondsSince(lastSetAt, now);

/** Si el descanso ya alcanzó el sugerido; sin sugerido el contador solo cuenta y nunca cambia de color. */
export function restReached(rest: number, suggested: number | null): boolean {
	return suggested !== null && rest >= suggested;
}

/** Tiempo transcurrido: los segundos desde que empezó el entrenamiento. */
export const elapsedSeconds = (startedAt: string, now: Date): number =>
	secondsSince(startedAt, now);

/**
 * Duración de un entrenamiento, como la lee Historial: del inicio al fin o, mientras no tenga fin,
 * a su última serie. Nada sin series (no se hizo nada, aunque se haya terminado) ni en solo
 * registrar, donde las horas no significan nada (ADR-0006).
 */
export function workoutDuration(
	workout: Pick<Workout, 'mode' | 'startedAt' | 'endedAt'>,
	lastSetAt: string | null
): number | null {
	if (!hasTimes(workout.mode) || lastSetAt === null) return null;
	return secondsSince(workout.startedAt, new Date(workout.endedAt ?? lastSetAt));
}
