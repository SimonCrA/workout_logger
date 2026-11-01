/**
 * Historial (spec #10): los entrenamientos del más reciente al más antiguo, separados por mes, y
 * lo que dice cada fila. Un entrenamiento sin ninguna serie viva no aparece: no se hizo nada.
 * Funciones puras sobre las filas vivas; la interfaz solo las dibuja.
 */
import { workoutDuration } from './companion';
import { alive, groupByExercise, groupSets } from './rules';
import type { Workout, WorkoutSet } from './types';

/** Un entrenamiento con sus series vivas, en orden. */
export type WorkoutEntry = { workout: Workout; sets: WorkoutSet[] };

/** Los entrenamientos vivos con al menos una serie viva, por inicio descendente, cada uno con sus series. */
export function historyEntries(
	workouts: readonly Workout[],
	sets: readonly WorkoutSet[]
): WorkoutEntry[] {
	const byWorkout = groupSets(sets.filter(alive), (set) => set.workoutId);
	return workouts
		.filter(alive)
		.flatMap((workout) => {
			const own = byWorkout.get(workout.id);
			return own ? [{ workout, sets: own }] : [];
		})
		.sort((a, b) => b.workout.startedAt.localeCompare(a.workout.startedAt));
}

/** Lo que dice la fila: cuántos ejercicios distintos, cuántas series (todas, también las de calentamiento) y la duración si la hay. */
export type HistoryRow = {
	workout: Workout;
	exercises: number;
	sets: number;
	/** Segundos; nada en solo registrar (ADR-0006). */
	duration: number | null;
};

/** Hasta cuándo llega un entrenamiento: su fin o, mientras no tenga, su última serie (o su inicio, sin series). */
export function entryEnd({ workout, sets }: WorkoutEntry): string {
	return workout.endedAt ?? sets.at(-1)?.performedAt ?? workout.startedAt;
}

/** La duración de un entrenamiento del historial, medida hasta su última serie si sigue sin terminar. */
export function entryDuration({ workout, sets }: WorkoutEntry): number | null {
	return workoutDuration(workout, sets.at(-1)?.performedAt ?? null);
}

export function historyRow(entry: WorkoutEntry): HistoryRow {
	return {
		workout: entry.workout,
		exercises: groupByExercise(entry.sets).length,
		sets: entry.sets.length,
		duration: entryDuration(entry)
	};
}

/** Un separador de Historial: el mes en hora local, "2026-10", con sus entradas. */
export type MonthGroup = { month: string; entries: WorkoutEntry[] };

/** El mes local en que empezó un entrenamiento, como clave ordenable: "2026-10". */
export function monthOf(iso: string): string {
	const date = new Date(iso);
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** Las entradas separadas por mes, del más reciente al más antiguo, en el orden en que vienen. */
export function groupByMonth(entries: readonly WorkoutEntry[]): MonthGroup[] {
	const groups: MonthGroup[] = [];
	for (const entry of entries) {
		const month = monthOf(entry.workout.startedAt);
		const last = groups.at(-1);
		if (last?.month === month) last.entries.push(entry);
		else groups.push({ month, entries: [entry] });
	}
	return groups;
}
