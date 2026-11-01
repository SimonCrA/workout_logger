/**
 * Acompañamiento (GLOSSARY): lo que la app mide mientras va con la persona. El tiempo
 * transcurrido desde el inicio y el descanso desde la última serie, comparado con el que la
 * rutina sugiere. Se calcula a partir de las horas de las series, así que en solo registrar,
 * donde varias series comparten hora, no se muestra (ADR-0006). Funciones puras; la interfaz
 * decide cada segundo con la hora actual.
 */
import type { RoutineExercise } from '#lib/catalog/types.js';

/** Segundos enteros desde una hora hasta ahora; cero si esa hora aún no llegó (otro dispositivo, reloj desfasado). */
const secondsSince = (iso: string, now: Date): number =>
	Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 1000));

/** Descanso: los segundos desde la última serie del entrenamiento, de cualquier ejercicio. */
export const restSeconds = (lastSetAt: string, now: Date): number => secondsSince(lastSetAt, now);

/** Si el descanso ya alcanzó el sugerido; sin sugerido el contador solo cuenta y nunca cambia de color. */
export function restReached(rest: number, suggested: number | null): boolean {
	return suggested !== null && rest >= suggested;
}

/** El descanso sugerido para un ejercicio en la rutina, si lo prescribe; en Hoy es el del ejercicio de la última serie. */
export function suggestedRest(
	exercises: readonly RoutineExercise[],
	exerciseId: string
): number | null {
	return exercises.find((entry) => entry.exerciseId === exerciseId)?.rest ?? null;
}

/** Tiempo transcurrido: los segundos desde que empezó el entrenamiento. */
export const elapsedSeconds = (startedAt: string, now: Date): number =>
	secondsSince(startedAt, now);
