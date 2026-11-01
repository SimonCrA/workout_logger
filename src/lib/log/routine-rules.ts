/**
 * Reglas puras de la rutina personalizada (GLOSSARY: Rutina personalizada, Objetivo). El editor
 * trabaja sobre una copia en memoria y solo "Guardar" escribe (spec #10); estas funciones son esa
 * copia y sus cambios, sin tocar la base.
 */
import type { BaseRoutine, RoutineExercise } from '#lib/catalog/types.js';
import type { Routine } from './types';

/** Lo que una rutina personalizada prescribe, sin las columnas de sincronización. */
export type RoutineDraft = Pick<Routine, 'name' | 'baseRoutineId' | 'exercises'>;

/** Desde cero: sin nombre ni ejercicios. */
export function emptyDraft(): RoutineDraft {
	return { name: '', baseRoutineId: null, exercises: [] };
}

/** Desde una rutina base: su copia, que recuerda de cuál viene. */
export function draftFromBase(base: BaseRoutine): RoutineDraft {
	return {
		name: base.name,
		baseRoutineId: base.id,
		exercises: base.exercises.map((entry) => ({ ...entry }))
	};
}

/** Lo que prescribe una rutina guardada, copiado para editarlo. */
export function draftOf(routine: Routine): RoutineDraft {
	return {
		name: routine.name,
		baseRoutineId: routine.baseRoutineId,
		exercises: routine.exercises.map((entry) => ({ ...entry }))
	};
}

/** Con qué objetivo entra un ejercicio añadido desde el buscador: el esquema de accesorio, sin RIR ni descanso. */
export const DEFAULT_OBJECTIVE: Omit<RoutineExercise, 'exerciseId'> = {
	sets: 3,
	repsMin: 8,
	repsMax: 12,
	rir: null,
	rest: null
};

const position = (draft: RoutineDraft, exerciseId: string) =>
	draft.exercises.findIndex((entry) => entry.exerciseId === exerciseId);

/** Añade un ejercicio al final; si ya está, la rutina queda igual (un ejercicio no se repite). */
export function addExercise(draft: RoutineDraft, exerciseId: string): RoutineDraft {
	if (position(draft, exerciseId) >= 0) return draft;
	return { ...draft, exercises: [...draft.exercises, { exerciseId, ...DEFAULT_OBJECTIVE }] };
}

export function removeExercise(draft: RoutineDraft, exerciseId: string): RoutineDraft {
	return { ...draft, exercises: draft.exercises.filter((e) => e.exerciseId !== exerciseId) };
}

/** Mueve un ejercicio un puesto arriba (-1) o abajo (1); en los extremos la rutina queda igual. */
export function moveExercise(draft: RoutineDraft, exerciseId: string, delta: -1 | 1): RoutineDraft {
	const from = position(draft, exerciseId);
	const to = from + delta;
	if (from < 0 || to < 0 || to >= draft.exercises.length) return draft;
	const exercises = [...draft.exercises];
	[exercises[from], exercises[to]] = [exercises[to], exercises[from]];
	return { ...draft, exercises };
}

/** Cambia el objetivo, el RIR objetivo o el descanso sugerido de un ejercicio. */
export function updateExercise(
	draft: RoutineDraft,
	exerciseId: string,
	patch: Partial<Omit<RoutineExercise, 'exerciseId'>>
): RoutineDraft {
	return {
		...draft,
		exercises: draft.exercises.map((entry) =>
			entry.exerciseId === exerciseId ? { ...entry, ...patch } : entry
		)
	};
}

/** Lo que le falta a un objetivo para guardarse, o nada: series ≥ 1 y un rango de reps con mínimo ≤ máximo. */
export function objectiveProblem(entry: RoutineExercise): string | null {
	const count = (value: number) => Number.isInteger(value) && value >= 1;
	if (!count(entry.sets)) return 'Al menos una serie';
	if (!count(entry.repsMin) || !count(entry.repsMax)) return 'Las reps empiezan en 1';
	if (entry.repsMin > entry.repsMax) return 'El mínimo de reps no puede superar el máximo';
	if (entry.rest !== null && !count(entry.rest))
		return 'El descanso va en segundos, mayor que cero';
	return null;
}

/** Lo que impide guardar la rutina, cada cosa una vez: el nombre primero, después los objetivos. */
export function routineProblems(draft: RoutineDraft): string[] {
	const problems: string[] = [];
	if (draft.name.trim() === '') problems.push('Ponle un nombre a la rutina');
	const ids = draft.exercises.map((entry) => entry.exerciseId);
	if (new Set(ids).size !== ids.length) problems.push('Un ejercicio no puede repetirse');
	for (const entry of draft.exercises) {
		const problem = objectiveProblem(entry);
		if (problem && !problems.includes(problem)) problems.push(problem);
	}
	return problems;
}

/** La rutina tal como se guarda: el nombre sin espacios alrededor. */
export function normalizeDraft(draft: RoutineDraft): RoutineDraft {
	return { ...draft, name: draft.name.trim() };
}

/** Si lo que hay en el editor difiere de lo guardado; es lo que pregunta al salir. */
export function hasChanges(draft: RoutineDraft, saved: RoutineDraft): boolean {
	return JSON.stringify(normalizeDraft(draft)) !== JSON.stringify(normalizeDraft(saved));
}
