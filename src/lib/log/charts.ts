/**
 * Los gráficos (spec #10, #20, #25): un punto por entrenamiento en la página del ejercicio y, en
 * Progreso, semanas naturales; los dos, recortados por el periodo de la página. Funciones puras sobre las series y las entradas
 * del historial; la interfaz solo las dibuja.
 */
import type { LoadMode } from '#lib/catalog/index.js';
import { setsPerMuscle, weekTotals, type TimeWindow } from './dashboard';
import type { WorkoutEntry } from './history';
import { bestEstimatedOneRepMax, bestRelativeStrength, effectiveWeight } from './indicators';
import { bodyWeightHistory, parseDay, type BodyWeightAt } from './profile-rules';
import { formatDayMonth, formatDayMonthYear, formatMonthYear } from './labels';
import { groupByWorkout, isWorkSet } from './rules';
import type { BodyWeight, ChartPeriod, ExerciseChartView, WorkoutSet } from './types';

/** Un punto de un gráfico: una fecha (la del entrenamiento o el lunes de la semana) y su valor. */
export type ChartPoint = { date: Date; value: number };

/**
 * Las vistas que tiene un ejercicio: peso máximo, 1RM estimado y volumen, con peso efectivo, y la
 * fuerza relativa en cualquier modo de carga si hay peso corporal. En corporal y asistido los kilos
 * necesitan el peso corporal: sin ningún registro, solo reps.
 */
export function exerciseChartViews(
	loadMode: LoadMode,
	knowsBodyWeight: boolean
): ExerciseChartView[] {
	if (knowsBodyWeight) return ['maxWeight', 'e1RM', 'relativeStrength', 'volume'];
	return loadMode === 'external' ? ['maxWeight', 'e1RM', 'volume'] : ['reps'];
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
	// El mejor de sus series: las que pasan de 10 reps efectivas no tienen y no anulan a las demás.
	if (view === 'e1RM') return bestEstimatedOneRepMax(sets, loadMode, bodyWeightAt)?.kg;
	if (view === 'relativeStrength') return bestRelativeStrength(sets, loadMode, bodyWeightAt)?.times;
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

/** Cuántas semanas naturales cubre cada periodo acotado, la actual incluida: 6 meses y 1 año en semanas enteras. */
const PERIOD_WEEKS: Record<Exclude<ChartPeriod, 'all'>, number> = { '12w': 12, '6m': 26, '1y': 52 };

/** El lunes a medianoche, en hora local, de la semana de esa fecha. */
function mondayOf(date: Date): Date {
	// getDay(): 0 es domingo; un domingo es el último día de la semana que empezó seis días antes.
	const daysSinceMonday = (date.getDay() + 6) % 7;
	return new Date(date.getFullYear(), date.getMonth(), date.getDate() - daysSinceMonday);
}

/** El lunes `weeksBack` semanas antes de ese lunes, por días del calendario: un cambio de hora no lo corre. */
function mondayBefore(monday: Date, weeksBack: number): Date {
	return new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() - 7 * weeksBack);
}

/**
 * Desde cuándo enseña un periodo: el lunes a medianoche de su semana más antigua, contando la
 * actual. Todo no tiene inicio.
 */
export function periodStart(period: ChartPeriod, now: Date): Date | null {
	if (period === 'all') return null;
	return mondayBefore(mondayOf(now), PERIOD_WEEKS[period] - 1);
}

/** Cuándo empezó el primer entrenamiento del historial; nada sin entrenamientos. */
export function firstWorkoutStart(entries: readonly WorkoutEntry[]): Date | undefined {
	let first: number | undefined;
	for (const { workout } of entries) {
		const at = Date.parse(workout.startedAt);
		if (first === undefined || at < first) first = at;
	}
	return first === undefined ? undefined : new Date(first);
}

/**
 * Las semanas de Progreso en un periodo: las naturales, de lunes a domingo en hora local, de la más
 * antigua a la actual. Todo empieza en la semana del primer entrenamiento (`first`); sin él, o si
 * es de esta semana o posterior, solo queda la actual. Se cuentan por días del calendario y no por
 * milisegundos, así un cambio de hora no las corre.
 */
export function progressWeeks(now: Date, period: ChartPeriod = '12w', first?: Date): TimeWindow[] {
	const monday = mondayOf(now);
	const start =
		period === 'all'
			? mondayOf(first && first < monday ? first : monday)
			: periodStart(period, now)!;
	const weeks: TimeWindow[] = [];
	for (let from = start; from <= monday; from = mondayBefore(from, -1))
		weeks.push({ from, to: mondayBefore(from, -1) });
	return weeks;
}

/** Los puntos desde el inicio del periodo; con Todo (sin inicio), todos. */
export function pointsInPeriod(points: readonly ChartPoint[], start: Date | null): ChartPoint[] {
	return start === null ? [...points] : points.filter((point) => point.date >= start);
}

/** Cuántas fechas rotula como mucho el eje: caben en un teléfono sin pisarse. */
const MAX_AXIS_TICKS = 6;

/**
 * Las fechas que rotula el eje: todas mientras caben; si no, a intervalos iguales y siempre la
 * última, así un año de semanas no desborda el teléfono.
 */
export function axisTicks(dates: readonly Date[]): Date[] {
	if (dates.length <= MAX_AXIS_TICKS) return [...dates];
	const step = Math.ceil(dates.length / MAX_AXIS_TICKS);
	const last = dates.length - 1;
	return dates.filter((_, i) => (last - i) % step === 0);
}

/** Desde cuántos días de tramo el eje nombra meses con su año en vez de días. */
const MONTHS_FROM_DAYS = 240;

/**
 * Cómo se leen las fechas de un gráfico: en el eje, el día ("26 oct") o, si los puntos cubren buena
 * parte de un año, el mes con su año ("oct 2026"); en el tooltip, el día con el año solo si los
 * puntos cruzan un cambio de año.
 */
export function dateFormats(dates: readonly Date[]): {
	axis: (date: Date) => string;
	tooltip: (date: Date) => string;
} {
	const first = dates[0];
	const last = dates.at(-1);
	if (!first || !last) return { axis: formatDayMonth, tooltip: formatDayMonth };
	const days = (last.getTime() - first.getTime()) / 86_400_000;
	return {
		axis: days >= MONTHS_FROM_DAYS ? formatMonthYear : formatDayMonth,
		tooltip: first.getFullYear() === last.getFullYear() ? formatDayMonth : formatDayMonthYear
	};
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

/**
 * "Peso corporal" (spec #31): un punto por registro vivo, el visible de cada día, del más antiguo
 * al más reciente y fechado a medianoche local de su día.
 */
export function bodyWeightPoints(rows: readonly BodyWeight[]): ChartPoint[] {
	return bodyWeightHistory(rows)
		.map((row) => ({ date: parseDay(row.date), value: row.kg }))
		.reverse();
}

/** El margen, en kilos, por encima y por debajo de los registros en el eje del peso corporal. */
const BODY_WEIGHT_MARGIN = 1;

/**
 * El eje del gráfico de peso corporal: de un kilo menos que el más bajo a uno más que el más alto.
 * Desde cero, unos kilos arriba o abajo quedarían en una línea plana; nada si no hay puntos.
 */
export function bodyWeightRange(points: readonly ChartPoint[]): [number, number] | undefined {
	if (points.length === 0) return undefined;
	const values = points.map((point) => point.value);
	return [Math.min(...values) - BODY_WEIGHT_MARGIN, Math.max(...values) + BODY_WEIGHT_MARGIN];
}
