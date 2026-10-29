import type { LoadMode } from '#lib/catalog/index.js';
import type { WorkoutSet } from './types';

/** Un valor en kg y la fecha del hito: cuándo se alcanzó. */
export type Milestone = { kg: number; at: string };

/**
 * Los seis indicadores de un ejercicio (GLOSSARY: Indicador), calculados sobre series de trabajo.
 * Los kilos son nulos sin series o cuando el peso efectivo no se conoce.
 */
export type ExerciseIndicators = {
	sets: number;
	reps: number;
	/** Fechado en la última serie que lo sumó. */
	volume: Milestone | null;
	/** Fechado la primera vez que se levantó. */
	maxWeight: Milestone | null;
	totalWeight: number | null;
	averagePerRep: number | null;
};

/** Serie de trabajo: cualquiera que no sea de calentamiento (GLOSSARY). */
const isWorkSet = (set: WorkoutSet): boolean => set.type !== 'warmup';

/**
 * Peso efectivo (GLOSSARY): la carga externa tal cual; en modo corporal el peso corporal más el
 * adicional; en asistido el peso corporal menos la asistencia. Sin peso corporal no se conoce.
 */
function effectiveWeight(
	weight: number,
	loadMode: LoadMode,
	bodyWeight?: number
): number | undefined {
	if (loadMode === 'external') return weight;
	if (bodyWeight === undefined) return undefined;
	return loadMode === 'bodyweight' ? bodyWeight + weight : bodyWeight - weight;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

export function exerciseIndicators(
	sets: readonly WorkoutSet[],
	loadMode: LoadMode,
	bodyWeight?: number
): ExerciseIndicators {
	const work = sets.filter(isWorkSet).sort((a, b) => a.performedAt.localeCompare(b.performedAt));
	const counts = { sets: work.length, reps: work.reduce((sum, set) => sum + set.reps, 0) };
	const noKilos = { volume: null, maxWeight: null, totalWeight: null, averagePerRep: null };
	const last = work.at(-1);
	if (!last) return { ...counts, ...noKilos };

	let volume = 0;
	let totalWeight = 0;
	let maxWeight: Milestone = { kg: Number.NEGATIVE_INFINITY, at: '' };
	for (const set of work) {
		const kg = effectiveWeight(set.weight, loadMode, bodyWeight);
		if (kg === undefined) return { ...counts, ...noKilos };
		volume += kg * set.reps;
		totalWeight += kg;
		if (kg > maxWeight.kg) maxWeight = { kg, at: set.performedAt };
	}
	return {
		...counts,
		volume: { kg: round2(volume), at: last.performedAt },
		maxWeight,
		totalWeight: round2(totalWeight),
		averagePerRep: counts.reps > 0 ? round2(volume / counts.reps) : null
	};
}
