/**
 * Reglas puras de la rutina personalizada (GLOSSARY: Rutina personalizada, Objetivo). El editor
 * trabaja sobre una copia en memoria y solo "Guardar" escribe (spec #10); estas funciones son esa
 * copia y sus cambios, sin tocar la base.
 */
import { getExercise, getMuscle } from '#lib/catalog/index.js';
import type { BaseRoutine, RoutineExercise } from '#lib/catalog/types.js';
import { alive } from './rules';
import type { Routine, Workout } from './types';

/** Lo que una rutina personalizada prescribe, sin las columnas de sincronización. */
export type RoutineDraft = Pick<Routine, 'name' | 'baseRoutineId' | 'exercises'>;

/**
 * Topes de lo que se guarda, los mismos que acepta la fila al sincronizarse (`sync/tables.ts`):
 * una rutina que el editor deja guardar siempre se puede subir.
 */
export const ROUTINE_LIMITS = {
	/** Caracteres del nombre. */
	name: 100,
	exercises: 100,
	sets: 100,
	reps: 1000,
	rir: 4,
	/** Segundos de descanso sugerido. */
	rest: 3600
} as const;

/** Desde cero: sin nombre ni ejercicios. */
export function emptyDraft(): RoutineDraft {
	return { name: '', baseRoutineId: null, exercises: [] };
}

/** Una copia de lo que prescribe una rutina, guardada o no, para editarla sin tocar el original. */
export function draftOf(
	routine: Omit<RoutineDraft, 'exercises'> & { exercises: readonly RoutineExercise[] }
): RoutineDraft {
	return {
		name: routine.name,
		baseRoutineId: routine.baseRoutineId,
		exercises: routine.exercises.map((entry) => ({ ...entry }))
	};
}

/** Desde una rutina base: su copia, que recuerda de cuál viene. */
export function draftFromBase(base: BaseRoutine): RoutineDraft {
	return draftOf({ name: base.name, baseRoutineId: base.id, exercises: base.exercises });
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

/** Un entero de 1 en adelante. */
const count = (value: number) => Number.isInteger(value) && value >= 1;

/**
 * Lo que le falta a un objetivo para guardarse, o nada: series ≥ 1, un rango de reps con mínimo ≤
 * máximo, y RIR y descanso dentro de sus topes si los hay.
 */
export function objectiveProblem(entry: RoutineExercise): string | null {
	const { sets, reps, rir, rest } = ROUTINE_LIMITS;
	if (!count(entry.sets)) return 'Al menos una serie';
	if (entry.sets > sets) return `Como mucho ${sets} series`;
	if (!count(entry.repsMin) || !count(entry.repsMax)) return 'Las reps empiezan en 1';
	if (entry.repsMin > reps || entry.repsMax > reps) return `Las reps llegan hasta ${reps}`;
	if (entry.repsMin > entry.repsMax) return 'El mínimo de reps no puede superar el máximo';
	if (entry.rir !== null && !(Number.isInteger(entry.rir) && entry.rir >= 0 && entry.rir <= rir))
		return `El RIR objetivo va de 0 a ${rir}`;
	if (entry.rest !== null && !count(entry.rest))
		return 'El descanso va en segundos, mayor que cero';
	if (entry.rest !== null && entry.rest > rest) return `El descanso llega hasta ${rest} s`;
	return null;
}

/** Lo que impide guardar la rutina, cada cosa una vez: el nombre primero, después los objetivos. */
export function routineProblems(draft: RoutineDraft): string[] {
	const problems: string[] = [];
	const name = draft.name.trim();
	if (name === '') problems.push('Ponle un nombre a la rutina');
	else if (name.length > ROUTINE_LIMITS.name)
		problems.push(`El nombre no puede pasar de ${ROUTINE_LIMITS.name} caracteres`);
	if (draft.exercises.length > ROUTINE_LIMITS.exercises)
		problems.push(`Como mucho ${ROUTINE_LIMITS.exercises} ejercicios`);
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

const sameObjective = (a: RoutineExercise, b: RoutineExercise) =>
	a.exerciseId === b.exerciseId &&
	a.sets === b.sets &&
	a.repsMin === b.repsMin &&
	a.repsMax === b.repsMax &&
	a.rir === b.rir &&
	a.rest === b.rest;

/** Si lo que hay en el editor difiere de lo guardado, campo a campo; es lo que pregunta al salir. */
export function hasChanges(draft: RoutineDraft, saved: RoutineDraft): boolean {
	return (
		draft.name.trim() !== saved.name.trim() ||
		draft.baseRoutineId !== saved.baseRoutineId ||
		draft.exercises.length !== saved.exercises.length ||
		draft.exercises.some((entry, i) => !sameObjective(entry, saved.exercises[i]))
	);
}

/** Lo que la rutina prescribe para un ejercicio (objetivo, RIR objetivo, descanso sugerido), si lo incluye. */
export function prescriptionFor(
	exercises: readonly RoutineExercise[],
	exerciseId: string
): RoutineExercise | null {
	return exercises.find((entry) => entry.exerciseId === exerciseId) ?? null;
}

/** Los músculos que trabaja una rutina: el primario de cada ejercicio, en su orden y sin repetir. */
export function routineMuscles(
	exercises: readonly Pick<RoutineExercise, 'exerciseId'>[]
): string[] {
	const names = exercises
		.map(({ exerciseId }) => getExercise(exerciseId)?.primaryMuscle)
		.map((code) => (code ? getMuscle(code)?.name : undefined))
		.filter((name) => name !== undefined);
	return [...new Set(names)];
}

/** Las series que prescribe una rutina entera. */
export function routineSetCount(exercises: readonly Pick<RoutineExercise, 'sets'>[]): number {
	return exercises.reduce((total, entry) => total + entry.sets, 0);
}

/** Una rutina de Mis rutinas con cuándo se hizo: el inicio del último entrenamiento con ella, o nunca. */
export type RoutineLastDone = { routine: Routine; lastDoneAt: string | null };

/**
 * Mis rutinas en el orden de la pestaña (spec #10): las nunca hechas primero, tal como vienen (en
 * orden de creación), y después la que lleva más tiempo sin hacerse. Los libres no cuentan para
 * ninguna y los entrenamientos borrados tampoco.
 */
export function routinesByLastDone(
	routines: readonly Routine[],
	workouts: readonly Pick<Workout, 'routineId' | 'startedAt' | 'deletedAt'>[]
): RoutineLastDone[] {
	const latest = new Map<string, string>();
	for (const workout of workouts) {
		if (workout.routineId === null || !alive(workout)) continue;
		const known = latest.get(workout.routineId);
		if (known === undefined || workout.startedAt > known)
			latest.set(workout.routineId, workout.startedAt);
	}
	return routines
		.map((routine) => ({ routine, lastDoneAt: latest.get(routine.id) ?? null }))
		.sort((a, b) => {
			if (a.lastDoneAt === null || b.lastDoneAt === null)
				return Number(a.lastDoneAt !== null) - Number(b.lastDoneAt !== null);
			return a.lastDoneAt.localeCompare(b.lastDoneAt);
		});
}
