/**
 * Los gráficos (spec #10, #20): un punto por entrenamiento en la página del ejercicio y, en
 * Progreso, las doce últimas semanas naturales. Funciones puras sobre las series y las entradas
 * del historial; la interfaz solo las dibuja.
 */
import type { LoadMode } from '#lib/catalog/index.js';
import { setsPerMuscle, weekTotals, type TimeWindow } from './dashboard';
import type { WorkoutEntry } from './history';
import { groupByWorkout, isWorkSet } from './rules';
import type { ExerciseChartView, WorkoutSet } from './types';

/** Un punto de un gráfico: una fecha (la del entrenamiento o el lunes de la semana) y su valor. */
export type ChartPoint = { date: Date; value: number };

/**
 * Las vistas que tiene un ejercicio. Con carga externa, peso máximo y volumen; en corporal y
 * asistido los kilos necesitan el peso corporal, que todavía no se registra, así que solo reps.
 */
export function exerciseChartViews(loadMode: LoadMode): ExerciseChartView[] {
	return loadMode === 'external' ? ['maxWeight', 'volume'] : ['reps'];
}

const measure: Record<ExerciseChartView, (sets: readonly WorkoutSet[]) => number> = {
	maxWeight: (sets) => Math.max(...sets.map((set) => set.weight)),
	volume: (sets) =>
		Math.round(sets.reduce((sum, set) => sum + set.weight * set.reps, 0) * 100) / 100,
	reps: (sets) => sets.reduce((sum, set) => sum + set.reps, 0)
};

/**
 * Un punto por entrenamiento con el ejercicio, del más antiguo al más reciente, sobre sus series
 * de trabajo y fechado en el inicio del entrenamiento (`startedAt`, por id) o, si no se conoce, en
 * su primera serie de trabajo. Un entrenamiento con solo calentamiento no tiene punto.
 */
export function workoutPoints(
	sets: readonly WorkoutSet[],
	view: ExerciseChartView,
	startedAt: Readonly<Record<string, string>> = {}
): ChartPoint[] {
	return groupByWorkout(sets.filter(isWorkSet))
		.map((group) => ({
			date: new Date(startedAt[group.workoutId] ?? group.date),
			value: measure[view](group.sets)
		}))
		.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** Cuántas semanas enseña Progreso, la actual incluida. */
const PROGRESS_WEEKS = 12;

/** El lunes a medianoche, en hora local, de la semana de esa fecha. */
function mondayOf(date: Date): Date {
	// getDay(): 0 es domingo; un domingo es el último día de la semana que empezó seis días antes.
	const daysSinceMonday = (date.getDay() + 6) % 7;
	return new Date(date.getFullYear(), date.getMonth(), date.getDate() - daysSinceMonday);
}

/**
 * Las semanas de Progreso: las doce naturales, de lunes a domingo en hora local, de la más antigua a la actual.
 * Se cuentan por días del calendario y no por milisegundos, así un cambio de hora no las corre.
 */
export function progressWeeks(now: Date): TimeWindow[] {
	const monday = mondayOf(now);
	const at = (weeksBack: number) =>
		new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() - 7 * weeksBack);
	return Array.from({ length: PROGRESS_WEEKS }, (_, i) => {
		const back = PROGRESS_WEEKS - 1 - i;
		return { from: at(back), to: at(back - 1) };
	});
}

/**
 * "Series de trabajo por semana": con Todos (`muscle` nulo), las series de trabajo de cada semana;
 * con un músculo, sus series por músculo (1 si es primario, 0,5 si es secundario).
 */
export function weeklyWorkSets(
	entries: readonly WorkoutEntry[],
	weeks: readonly TimeWindow[],
	muscle: string | null
): ChartPoint[] {
	if (muscle === null)
		return weeks.map((week) => ({ date: week.from, value: weekTotals(entries, week).sets }));
	const sets = entries.flatMap((entry) => entry.sets);
	return weeks.map((week) => ({ date: week.from, value: setsPerMuscle(sets, week)[muscle] ?? 0 }));
}

/** "Entrenamientos por semana": cada entrenamiento en la semana en que empezó. */
export function weeklyWorkouts(
	entries: readonly WorkoutEntry[],
	weeks: readonly TimeWindow[]
): ChartPoint[] {
	return weeks.map((week) => ({ date: week.from, value: weekTotals(entries, week).workouts }));
}
