/**
 * El dashboard de Hoy (spec #10, #19): lo que se ve sin entrenamiento en curso. Las series por
 * músculo de los últimos 7 días, con las que se pinta el mapa de calor y se mide la banda
 * objetivo, y la semana en números frente a los 7 días anteriores. Funciones puras sobre las
 * series y las entradas del historial; la interfaz solo las dibuja.
 */
import { getExercise, hasExercises, muscles, type Muscle } from '#lib/catalog/index.js';
import { historyRow, type HistoryRow, type WorkoutEntry } from './history';
import { isWorkSet } from './rules';
import type { BandCount, Trend, WorkoutSet } from './types';

const WEEK_MS = 7 * 86_400_000;

/** Un tramo de tiempo: desde una hora, incluida, hasta otra, excluida, o sin fin. */
export type TimeWindow = { from: Date; to: Date | null };

/**
 * Los últimos 7 días: la ventana móvil que termina ahora. Lo que llegue con una hora posterior
 * (otro dispositivo con el reloj adelantado, o el minuto que el reloj de la página aún no dio)
 * también es reciente, así que no tiene fin.
 */
export const lastSevenDays = (now: Date): TimeWindow => ({
	from: new Date(now.getTime() - WEEK_MS),
	to: null
});

/** Los 7 días anteriores a los últimos 7: con los que se compara la semana. */
export const previousSevenDays = (now: Date): TimeWindow => ({
	from: new Date(now.getTime() - 2 * WEEK_MS),
	to: new Date(now.getTime() - WEEK_MS)
});

export function inWindow(iso: string, { from, to }: TimeWindow): boolean {
	const at = new Date(iso).getTime();
	return at >= from.getTime() && (to === null || at < to.getTime());
}

/** Las series de todas las entradas del historial, tal como vienen. */
const setsOf = (entries: readonly WorkoutEntry[]): WorkoutSet[] =>
	entries.flatMap((entry) => entry.sets);

/**
 * Series por músculo (GLOSSARY): las series de trabajo del tramo, 1 al músculo primario y 0,5 a
 * cada secundario según el catálogo. Todos los músculos del mapa, a 0 los no trabajados.
 */
export function setsPerMuscle(
	sets: readonly WorkoutSet[],
	period: TimeWindow
): Record<string, number> {
	const perMuscle: Record<string, number> = Object.fromEntries(
		muscles.map((muscle) => [muscle.code, 0])
	);
	for (const set of sets) {
		if (!isWorkSet(set) || !inWindow(set.performedAt, period)) continue;
		const exercise = getExercise(set.exerciseId);
		if (!exercise) continue;
		perMuscle[exercise.primaryMuscle] = (perMuscle[exercise.primaryMuscle] ?? 0) + 1;
		for (const code of exercise.secondaryMuscles) perMuscle[code] = (perMuscle[code] ?? 0) + 0.5;
	}
	return perMuscle;
}

/** Banda objetivo (GLOSSARY): de 10 a 20 series por músculo en 7 días. Fija por ahora. */
export const TARGET_BAND = { min: 10, max: 20 } as const;

/** Mantenimiento (GLOSSARY): con 6 series por músculo en 7 días se conserva lo ganado. Fijo por ahora. */
export const MAINTENANCE_SETS = 6;

/** Los músculos del mapa que tienen ejercicios en el catálogo: los únicos a los que se les pide algo. */
const musclesWithExercises = () => muscles.filter((muscle) => hasExercises(muscle.code));

/** Cuántos músculos alcanzan la banda objetivo (sus 10 series) y de cuántos con ejercicios. */
export function musclesInBand(perMuscle: Record<string, number>): BandCount {
	const candidates = musclesWithExercises();
	return {
		inBand: candidates.filter((muscle) => perMuscle[muscle.code] >= TARGET_BAND.min).length,
		of: candidates.length
	};
}

/**
 * "Toca": los músculos con ejercicios que no llegan a mantenimiento, el más desatendido primero
 * y, a igual series, en el orden del catálogo. Se nombran aparte, no con otro color en el mapa.
 */
export function musclesToWork(perMuscle: Record<string, number>): Muscle[] {
	return musclesWithExercises()
		.filter((muscle) => perMuscle[muscle.code] < MAINTENANCE_SETS)
		.sort((a, b) => perMuscle[a.code] - perMuscle[b.code]);
}

/** Un músculo de "Toca": sus series por músculo y cuánto le falta para mantenimiento. */
export type MuscleToWork = {
	muscle: Muscle;
	sets: number;
	/** De 0 a 1: la parte de mantenimiento que ya tiene. */
	progress: number;
};

/** Lo que dibuja cada ficha de "Toca", en el orden de `musclesToWork`. */
export function toWorkCards(perMuscle: Record<string, number>): MuscleToWork[] {
	return musclesToWork(perMuscle).map((muscle) => ({
		muscle,
		sets: perMuscle[muscle.code],
		progress: Math.min(perMuscle[muscle.code] / MAINTENANCE_SETS, 1)
	}));
}

/**
 * El tono del mapa de calor (GLOSSARY) para unas series por músculo: lineal entre el gris base
 * a 0 y el tono más oscuro al tope de la banda, saturado a partir de ahí. De 0 a 1.
 */
export function heatIntensity(sets: number): number {
	return Math.min(sets / TARGET_BAND.max, 1);
}

/** El tono de cada músculo del mapa, a partir de sus series por músculo. */
export function heatIntensities(perMuscle: Record<string, number>): Record<string, number> {
	return Object.fromEntries(
		Object.entries(perMuscle).map(([code, sets]) => [code, heatIntensity(sets)])
	);
}

/** Las marcas de la leyenda del mapa de calor: nada, mantenimiento y los dos extremos de la banda. */
export const LEGEND_MARKS = [0, MAINTENANCE_SETS, TARGET_BAND.min, TARGET_BAND.max] as const;

/** La semana en números: entrenamientos con al menos una serie, series de trabajo y sus reps. */
export type WeekTotals = { workouts: number; sets: number; reps: number };

/** La tarjeta "Últimos 7 días": esta semana, la anterior, hacia dónde fue cada número y los músculos en banda. */
export type WeekSummary = {
	current: WeekTotals;
	previous: WeekTotals;
	trends: Record<keyof WeekTotals, Trend>;
	band: BandCount;
};

/**
 * Los números de un tramo. El entrenamiento cuenta por su inicio (pertenece al día en que
 * empezó); las series, por su hora.
 */
export function weekTotals(entries: readonly WorkoutEntry[], period: TimeWindow): WeekTotals {
	const work = setsOf(entries).filter((set) => isWorkSet(set) && inWindow(set.performedAt, period));
	return {
		workouts: entries.filter((entry) => inWindow(entry.workout.startedAt, period)).length,
		sets: work.length,
		reps: work.reduce((sum, set) => sum + set.reps, 0)
	};
}

export function trend(current: number, previous: number): Trend {
	if (current > previous) return 'up';
	return current < previous ? 'down' : 'same';
}

/** La tarjeta "Últimos 7 días"; las series por músculo de la semana se pueden pasar ya calculadas. */
export function weekSummary(
	entries: readonly WorkoutEntry[],
	now: Date,
	perMuscle = setsPerMuscle(setsOf(entries), lastSevenDays(now))
): WeekSummary {
	const current = weekTotals(entries, lastSevenDays(now));
	const previous = weekTotals(entries, previousSevenDays(now));
	return {
		current,
		previous,
		trends: {
			workouts: trend(current.workouts, previous.workouts),
			sets: trend(current.sets, previous.sets),
			reps: trend(current.reps, previous.reps)
		},
		band: musclesInBand(perMuscle)
	};
}

/** Un día de la tira de "Últimos 7 días": su medianoche local y sus series de trabajo. */
export type DaySets = { day: Date; sets: number };

/**
 * La tira de "Últimos 7 días": hoy y los 6 días anteriores, en días naturales locales y del más
 * antiguo a hoy, con las series de trabajo de cada uno. Los números de la tarjeta usan la ventana
 * móvil de 7 × 24 h; la tira, días completos, así que el primer día puede incluir alguna serie que
 * los números ya no cuentan.
 */
export function dailySets(entries: readonly WorkoutEntry[], now: Date): DaySets[] {
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const days = Array.from(
		{ length: 7 },
		(_, index) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6 + index)
	);
	const counts = days.map(() => 0);
	for (const set of setsOf(entries)) {
		if (!isWorkSet(set)) continue;
		// El último día que empezó antes de la serie; lo posterior a hoy (otro reloj adelantado) cuenta en hoy.
		const at = new Date(set.performedAt);
		const index = days.findLastIndex((day) => at >= day);
		if (index !== -1) counts[index]++;
	}
	return days.map((day, index) => ({ day, sets: counts[index] }));
}

/** Todo lo que el dashboard dibuja, calculado de una vez a partir del historial. */
export type Dashboard = {
	/** El tono de cada músculo del mapa de calor. */
	intensities: Record<string, number>;
	/** Las fichas de "Toca". */
	toWork: MuscleToWork[];
	week: WeekSummary;
	/** La tira de los 7 días de "Últimos 7 días". */
	days: DaySets[];
	/** El último entrenamiento, sin contar el que está en curso, o nada todavía. */
	last: HistoryRow | null;
};

/** `currentId`: el entrenamiento en curso, que Hoy ya muestra aparte y no es "el último". */
export function dashboard(
	entries: readonly WorkoutEntry[],
	now: Date,
	currentId: string | null = null
): Dashboard {
	const perMuscle = setsPerMuscle(setsOf(entries), lastSevenDays(now));
	const last = entries.find((entry) => entry.workout.id !== currentId);
	return {
		intensities: heatIntensities(perMuscle),
		toWork: toWorkCards(perMuscle),
		week: weekSummary(entries, now, perMuscle),
		days: dailySets(entries, now),
		last: last ? historyRow(last) : null
	};
}
