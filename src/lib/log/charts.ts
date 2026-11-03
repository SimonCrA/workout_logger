/**
 * Los gráficos (spec #10, #20): un punto por entrenamiento en la página del ejercicio y, en
 * Progreso, las doce últimas semanas naturales. Funciones puras sobre las series y las entradas
 * del historial; la interfaz solo las dibuja.
 */
import type { LoadMode } from '#lib/catalog/index.js';
import { setsPerMuscle, weekTotals, type TimeWindow } from './dashboard';
import type { WorkoutEntry } from './history';
import { effectiveWeight } from './indicators';
import type { BodyWeightAt } from './profile-rules';
import { groupByWorkout, isWorkSet } from './rules';
import type { ExerciseChartView, WorkoutSet } from './types';

/** Un punto de un gráfico: una fecha (la del entrenamiento o el lunes de la semana) y su valor. */
export type ChartPoint = { date: Date; value: number };

/**
 * Las vistas que tiene un ejercicio: peso máximo y volumen, con peso efectivo. En corporal y
 * asistido los kilos necesitan el peso corporal: sin ningún registro, solo reps.
 */
export function exerciseChartViews(
	loadMode: LoadMode,
	knowsBodyWeight: boolean
): ExerciseChartView[] {
	return loadMode === 'external' || knowsBodyWeight ? ['maxWeight', 'volume'] : ['reps'];
}

/** Cómo se fecha y se pesa cada punto. Sin `loadMode`, carga externa. */
export type PointOptions = {
	/** Cuándo empezó cada entrenamiento, por id. */
	startedAt?: Readonly<Record<string, string>>;
	loadMode?: LoadMode;
	bodyWeightAt?: BodyWeightAt;
};

/** El valor de una vista sobre las series de trabajo de un entrenamiento; nada si faltan los kilos. */
function measure(
	sets: readonly WorkoutSet[],
	view: ExerciseChartView,
	loadMode: LoadMode,
	bodyWeightAt?: BodyWeightAt
): number | undefined {
	if (view === 'reps') return sets.reduce((sum, set) => sum + set.reps, 0);
	let max = Number.NEGATIVE_INFINITY;
	let volume = 0;
	for (const set of sets) {
		const kg = effectiveWeight(set, loadMode, bodyWeightAt);
		if (kg === undefined) return undefined;
		max = Math.max(max, kg);
		volume += kg * set.reps;
	}
	return view === 'maxWeight' ? max : Math.round(volume * 100) / 100;
}

/**
 * Un punto por entrenamiento con el ejercicio, del más antiguo al más reciente, sobre sus series
 * de trabajo y fechado en el inicio del entrenamiento (`startedAt`, por id) o, si no se conoce, en
 * su primera serie de trabajo. Un entrenamiento con solo calentamiento no tiene punto, ni uno en
 * kilos cuyo peso efectivo no se conoce.
 */
export function workoutPoints(
	sets: readonly WorkoutSet[],
	view: ExerciseChartView,
	{ startedAt = {}, loadMode = 'external', bodyWeightAt }: PointOptions = {}
): ChartPoint[] {
	return groupByWorkout(sets.filter(isWorkSet))
		.flatMap((group) => {
			const value = measure(group.sets, view, loadMode, bodyWeightAt);
			if (value === undefined) return [];
			return [{ date: new Date(startedAt[group.workoutId] ?? group.date), value }];
		})
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
