import type { LoadMode } from '#lib/catalog/index.js';
import { effectiveWeight, estimatedOneRepMax, type Milestone } from './indicators';
import type { BodyWeightAt } from './profile-rules';
import { byTime, isWorkSet } from './rules';
import type { WorkoutSet } from './types';

/** Un récord que una serie batió, con el valor nuevo; las reps se baten a un peso efectivo exacto. */
export type BrokenRecord =
	| { measure: 'maxWeight' | 'e1RM'; kg: number }
	| { measure: 'repsAtWeight'; reps: number; kg: number };

/** Las reps máximas a un peso efectivo, fechadas la primera vez que se hicieron. */
export type RepsAtWeight = { kg: number; reps: number; at: string };

/** Los récords de un ejercicio (GLOSSARY: Récord) y las series que los batieron. */
export type PersonalRecords = {
	/** Fechado la primera vez que se levantó. */
	maxWeight: Milestone | null;
	/** Fechado en la primera serie que lo dio. */
	e1RM: Milestone | null;
	/** Las reps máximas en cada peso efectivo, de mayor a menor peso. */
	repsByWeight: RepsAtWeight[];
	/** Por id de serie, las medidas que batió al hacerse, aunque luego otra las superara: lo que se anuncia. */
	broken: Map<string, BrokenRecord[]>;
	/**
	 * Por id de serie, los récords que tiene hoy: la marca "Récord". Es la última serie que batió cada
	 * medida; un récord que nadie ha batido todavía (el de la primera serie) no marca ninguna.
	 */
	held: Map<string, BrokenRecord[]>;
};

/** Cada medida por separado: las reps cuentan a cada peso efectivo. */
const measureKey = (record: BrokenRecord) =>
	record.measure === 'repsAtWeight' ? `repsAtWeight:${record.kg}` : record.measure;

const unknownBodyWeight: BodyWeightAt = () => undefined;

/** En orden de tiempo; las series registradas juntas comparten hora y las desempata su id, igual en cualquier página. */
const inOrder = (a: WorkoutSet, b: WorkoutSet) => byTime(a, b) || a.id.localeCompare(b.id);

/**
 * Recorre en orden las series de trabajo con peso efectivo conocido y marca cada una con los récords
 * que batió: supera estrictamente a todas las anteriores en esa medida. Hace falta un valor anterior
 * que superar, así que la primera serie no bate nada. La marca la lleva solo quien tiene el récord
 * hoy. Nada se guarda: borrar o corregir una serie recalcula las marcas.
 */
export function personalRecords(
	sets: readonly WorkoutSet[],
	loadMode: LoadMode,
	bodyWeightAt: BodyWeightAt = unknownBodyWeight
): PersonalRecords {
	const broken = new Map<string, BrokenRecord[]>();
	let maxWeight: Milestone | null = null;
	let e1RM: Milestone | null = null;
	const repsByWeight = new Map<number, RepsAtWeight>();
	for (const set of sets.filter(isWorkSet).sort(inOrder)) {
		const kg = effectiveWeight(set, loadMode, bodyWeightAt);
		if (kg === undefined) continue;
		const beaten: BrokenRecord[] = [];
		if (maxWeight === null || kg > maxWeight.kg) {
			if (maxWeight !== null) beaten.push({ measure: 'maxWeight', kg });
			maxWeight = { kg, at: set.performedAt };
		}
		const estimate = estimatedOneRepMax(set, loadMode, bodyWeightAt);
		if (estimate !== null && (e1RM === null || estimate > e1RM.kg)) {
			if (e1RM !== null) beaten.push({ measure: 'e1RM', kg: estimate });
			e1RM = { kg: estimate, at: set.performedAt };
		}
		const atWeight = repsByWeight.get(kg);
		if (atWeight === undefined || set.reps > atWeight.reps) {
			if (atWeight !== undefined) beaten.push({ measure: 'repsAtWeight', reps: set.reps, kg });
			repsByWeight.set(kg, { kg, reps: set.reps, at: set.performedAt });
		}
		if (beaten.length > 0) broken.set(set.id, beaten);
	}
	// El récord de cada medida solo cambia al batirse, así que lo tiene la última serie que lo batió.
	const holder = new Map<string, string>();
	for (const [id, records] of broken)
		for (const record of records) holder.set(measureKey(record), id);
	const held = new Map<string, BrokenRecord[]>();
	for (const [id, records] of broken) {
		const kept = records.filter((record) => holder.get(measureKey(record)) === id);
		if (kept.length > 0) held.set(id, kept);
	}
	return {
		maxWeight,
		e1RM,
		repsByWeight: [...repsByWeight.values()].sort((a, b) => b.kg - a.kg),
		broken,
		held
	};
}

/**
 * Los récords que acaban de batir las series recién registradas, para anunciarlos en un solo aviso.
 * `earlier` son las series que ya había; pueden incluir ya las nuevas si la consulta viva llegó antes.
 */
export function recordsBrokenBy(
	earlier: readonly WorkoutSet[],
	added: readonly WorkoutSet[],
	loadMode: LoadMode,
	bodyWeightAt: BodyWeightAt = unknownBodyWeight
): BrokenRecord[] {
	const ids = new Set(added.map((set) => set.id));
	const all = [...earlier.filter((set) => !ids.has(set.id)), ...added];
	const { broken } = personalRecords(all, loadMode, bodyWeightAt);
	return added.flatMap((set) => broken.get(set.id) ?? []);
}
