import type { LoadMode } from '#lib/catalog/index.js';
import type { BodyWeightAt } from './profile-rules';
import { byTime, isWorkSet } from './rules';
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

/** Sin registros de peso corporal: no se conoce en ninguna fecha. */
const unknownBodyWeight: BodyWeightAt = () => undefined;

/**
 * Peso efectivo (GLOSSARY) de una serie: la carga externa tal cual; en modo corporal el peso
 * corporal vigente en su fecha más el adicional; en asistido ese peso corporal menos la asistencia.
 * Sin peso corporal no se conoce.
 */
export function effectiveWeight(
	set: Pick<WorkoutSet, 'weight' | 'performedAt'>,
	loadMode: LoadMode,
	bodyWeightAt: BodyWeightAt = unknownBodyWeight
): number | undefined {
	if (loadMode === 'external') return set.weight;
	const bodyWeight = bodyWeightAt(set.performedAt);
	if (bodyWeight === undefined) return undefined;
	return loadMode === 'bodyweight' ? bodyWeight + set.weight : bodyWeight - set.weight;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

export function exerciseIndicators(
	sets: readonly WorkoutSet[],
	loadMode: LoadMode,
	bodyWeightAt: BodyWeightAt = unknownBodyWeight
): ExerciseIndicators {
	const work = sets.filter(isWorkSet).sort(byTime);
	const counts = { sets: work.length, reps: work.reduce((sum, set) => sum + set.reps, 0) };
	const noKilos = { volume: null, maxWeight: null, totalWeight: null, averagePerRep: null };
	const last = work.at(-1);
	if (!last) return { ...counts, ...noKilos };

	let volume = 0;
	let totalWeight = 0;
	let maxWeight: Milestone = { kg: Number.NEGATIVE_INFINITY, at: '' };
	for (const set of work) {
		const kg = effectiveWeight(set, loadMode, bodyWeightAt);
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
