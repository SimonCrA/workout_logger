import type { LoadMode } from '#lib/catalog/index.js';
import type { BodyWeightAt } from './profile-rules';
import { byTime, isWorkSet } from './rules';
import type { WorkoutSet } from './types';

/** Un valor en kg y la fecha del hito: cuándo se alcanzó. */
export type Milestone = { kg: number; at: string };

/**
 * Los indicadores de un ejercicio (GLOSSARY: Indicador), los seis heredados y el 1RM estimado,
 * calculados sobre series de trabajo.
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
	/** El mejor 1RM estimado, fechado en la primera serie que lo dio; nulo si ninguna lo tiene. */
	e1RM: Milestone | null;
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

/** Por encima de estas reps efectivas, Epley deja de ser fiable y no se estima. */
const MAX_EFFECTIVE_REPS = 10;

/**
 * 1RM estimado (GLOSSARY) de una serie, con Epley sobre reps efectivas (reps + RIR; sin RIR cuenta
 * 0): `peso efectivo × (1 + reps efectivas / 30)`, y una rep efectiva es el peso efectivo. Nulo en
 * calentamiento, sin reps, por encima de 10 reps efectivas o sin peso efectivo positivo (0 kg, o una
 * asistencia que iguala o pasa el peso corporal). Redondeado a 2 decimales.
 */
export function estimatedOneRepMax(
	set: Pick<WorkoutSet, 'weight' | 'reps' | 'rir' | 'type' | 'performedAt'>,
	loadMode: LoadMode,
	bodyWeightAt: BodyWeightAt = unknownBodyWeight
): number | null {
	if (!isWorkSet(set) || set.reps === 0) return null;
	const effectiveReps = set.reps + (set.rir ?? 0);
	if (effectiveReps > MAX_EFFECTIVE_REPS) return null;
	const kg = effectiveWeight(set, loadMode, bodyWeightAt);
	if (kg === undefined || kg <= 0) return null;
	return effectiveReps === 1 ? kg : round2(kg * (1 + effectiveReps / 30));
}

/**
 * El mayor 1RM estimado de las series; nulo si ninguna lo tiene. En orden de tiempo, se fecha en
 * la primera que lo dio.
 */
export function bestEstimatedOneRepMax(
	sets: readonly WorkoutSet[],
	loadMode: LoadMode,
	bodyWeightAt: BodyWeightAt = unknownBodyWeight
): Milestone | null {
	let best: Milestone | null = null;
	for (const set of sets) {
		const kg = estimatedOneRepMax(set, loadMode, bodyWeightAt);
		if (kg !== null && (best === null || kg > best.kg)) best = { kg, at: set.performedAt };
	}
	return best;
}

export function exerciseIndicators(
	sets: readonly WorkoutSet[],
	loadMode: LoadMode,
	bodyWeightAt: BodyWeightAt = unknownBodyWeight
): ExerciseIndicators {
	const work = sets.filter(isWorkSet).sort(byTime);
	// El 1RM estimado va aparte de los demás kilos: una serie sin él no anula el de las otras.
	const counts = {
		sets: work.length,
		reps: work.reduce((sum, set) => sum + set.reps, 0),
		e1RM: bestEstimatedOneRepMax(work, loadMode, bodyWeightAt)
	};
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
