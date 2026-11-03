import { describe, expect, it } from 'vitest';
import { estimatedOneRepMax, exerciseIndicators, relativeStrength } from './indicators';
import { makeBodyWeight, makeSet } from './fixtures';
import { bodyWeightAt } from './profile-rules';
import type { WorkoutSet } from './types';

function set(partial: Partial<WorkoutSet> & { performedAt: string }): WorkoutSet {
	return makeSet({ id: partial.performedAt, ...partial });
}

describe('exerciseIndicators (spec: six indicators over work sets, empty state without error)', () => {
	it('is empty, not an error, for an exercise without sets', () => {
		expect(exerciseIndicators([], 'external')).toEqual({
			sets: 0,
			reps: 0,
			volume: null,
			maxWeight: null,
			totalWeight: null,
			averagePerRep: null,
			e1RM: null,
			relativeStrength: null
		});
	});

	it('counts sets and reps of work sets only: warm-ups do not count', () => {
		const sets = [
			set({ performedAt: '2026-10-26T18:00:00Z', type: 'warmup', reps: 15, weight: 20 }),
			set({ performedAt: '2026-10-26T18:05:00Z', type: 'normal', reps: 8, weight: 60 }),
			set({ performedAt: '2026-10-26T18:10:00Z', type: 'failure', reps: 6, weight: 60 }),
			set({ performedAt: '2026-10-26T18:15:00Z', type: 'drop', reps: 10, weight: 40 })
		];

		const indicators = exerciseIndicators(sets, 'external');

		expect(indicators.sets).toBe(3);
		expect(indicators.reps).toBe(24);
	});
});

describe('kg indicators with external load (spec: dates are those of each milestone, not of the first set)', () => {
	// 480 + 360 + 350 + 350 + 500 = 2040 kg over 34 reps; the 100 kg warm-up never counts.
	const sets = [
		set({ performedAt: '2026-10-28T18:05:00Z', reps: 5, weight: 70 }),
		set({ performedAt: '2026-10-26T18:05:00Z', reps: 8, weight: 60 }),
		set({ performedAt: '2026-10-30T17:50:00Z', type: 'warmup', reps: 1, weight: 100 }),
		set({ performedAt: '2026-10-30T18:00:00Z', reps: 10, weight: 50 }),
		set({ performedAt: '2026-10-26T18:10:00Z', type: 'failure', reps: 6, weight: 60 }),
		set({ performedAt: '2026-10-28T18:00:00Z', reps: 5, weight: 70 })
	];
	const indicators = exerciseIndicators(sets, 'external');

	it('sums volume (weight × reps) dated at the last work set that reached it', () => {
		expect(indicators.volume).toEqual({ kg: 2040, at: '2026-10-30T18:00:00Z' });
	});

	it('dates the max weight at the first time it was lifted, not a later repeat', () => {
		expect(indicators.maxWeight).toEqual({ kg: 70, at: '2026-10-28T18:00:00Z' });
	});

	it('sums the weight of every work set and averages the volume per rep', () => {
		expect(indicators.totalWeight).toBe(310);
		expect(indicators.averagePerRep).toBe(60);
	});

	it('keeps two decimals despite float arithmetic', () => {
		const noisy = [set({ performedAt: '2026-10-26T18:00:00Z', reps: 3, weight: 60.1 })];

		const result = exerciseIndicators(noisy, 'external');

		expect(result.volume?.kg).toBe(180.3);
		expect(result.averagePerRep).toBe(60.1);
	});
});

describe('effective weight by load mode (GLOSSARY: Peso efectivo; spec: body-weight and assisted cases)', () => {
	const bodyWeight = bodyWeightAt([makeBodyWeight({ kg: 80 })]);

	it('adds the body weight to the additional weight of a body-weight exercise', () => {
		const sets = [
			set({ performedAt: '2026-10-26T18:00:00Z', reps: 8, weight: 0 }),
			set({ performedAt: '2026-10-28T18:00:00Z', reps: 5, weight: 10 })
		];

		const result = exerciseIndicators(sets, 'bodyweight', bodyWeight);

		// 80 × 8 + 90 × 5 = 1090 kg over 13 reps
		expect(result.volume).toEqual({ kg: 1090, at: '2026-10-28T18:00:00Z' });
		expect(result.maxWeight).toEqual({ kg: 90, at: '2026-10-28T18:00:00Z' });
		expect(result.totalWeight).toBe(170);
		expect(result.averagePerRep).toBe(83.85);
	});

	it('subtracts the assistance from the body weight, so the max is the set with least assistance', () => {
		const sets = [
			set({ performedAt: '2026-10-26T18:00:00Z', reps: 8, weight: 20 }),
			set({ performedAt: '2026-10-28T18:00:00Z', reps: 6, weight: 10 })
		];

		const result = exerciseIndicators(sets, 'assisted', bodyWeight);

		// 60 × 8 + 70 × 6 = 900 kg over 14 reps
		expect(result.volume).toEqual({ kg: 900, at: '2026-10-28T18:00:00Z' });
		expect(result.maxWeight).toEqual({ kg: 70, at: '2026-10-28T18:00:00Z' });
		expect(result.totalWeight).toBe(130);
		expect(result.averagePerRep).toBe(64.29);
	});

	it('ignores the body weight for external loads', () => {
		const sets = [set({ performedAt: '2026-10-26T18:00:00Z', reps: 8, weight: 60 })];

		expect(exerciseIndicators(sets, 'external', bodyWeight).volume?.kg).toBe(480);
	});

	it('without a known body weight still counts sets and reps but has no kilos', () => {
		const sets = [
			set({ performedAt: '2026-10-26T18:00:00Z', reps: 8, weight: 0 }),
			set({ performedAt: '2026-10-28T18:00:00Z', reps: 5, weight: 10 })
		];

		for (const loadMode of ['bodyweight', 'assisted'] as const) {
			expect(exerciseIndicators(sets, loadMode, bodyWeightAt([]))).toEqual({
				sets: 2,
				reps: 13,
				volume: null,
				maxWeight: null,
				totalWeight: null,
				averagePerRep: null,
				e1RM: null,
				relativeStrength: null
			});
		}
	});
});

describe('effective weight with the body weight in force on each date (spec #27)', () => {
	// 82 kg desde el 20 de octubre, 80 kg desde el 28.
	const bodyWeight = bodyWeightAt([
		makeBodyWeight({ id: 'b1', date: '2026-10-20', kg: 82 }),
		makeBodyWeight({ id: 'b2', date: '2026-10-28', kg: 80 })
	]);
	// Series a las 18:00 hora local de cada día.
	const on = (day: number, partial: Partial<WorkoutSet>) =>
		set({ performedAt: new Date(2026, 9, day, 18).toISOString(), ...partial });

	it('uses each set’s own body weight: before the first entry the first one, then the newest of that day or before', () => {
		const sets = [
			on(15, { reps: 5, weight: 0 }), // antes del primer registro: 82
			on(25, { reps: 5, weight: 5 }), // 82 + 5
			on(28, { reps: 8, weight: 0 }), // el mismo día del segundo registro: 80
			on(30, { reps: 6, weight: 5 }) // 80 + 5
		];

		const result = exerciseIndicators(sets, 'bodyweight', bodyWeight);

		// 82 × 5 + 87 × 5 + 80 × 8 + 85 × 6 = 410 + 435 + 640 + 510 = 1995 kg over 24 reps
		expect(result.volume).toEqual({ kg: 1995, at: sets[3].performedAt });
		expect(result.maxWeight).toEqual({ kg: 87, at: sets[1].performedAt });
		expect(result.totalWeight).toBe(334);
		expect(result.averagePerRep).toBe(83.13);
	});

	it('subtracts the assistance from the body weight in force on each date', () => {
		const sets = [on(25, { reps: 8, weight: 20 }), on(30, { reps: 8, weight: 20 })];

		// 62 × 8 + 60 × 8 = 976 kg
		expect(exerciseIndicators(sets, 'assisted', bodyWeight).volume?.kg).toBe(976);
	});
});

describe('1RM estimado (spec #28: Epley over reps efectivas, work sets only, up to 10)', () => {
	const e1rm = (partial: Partial<WorkoutSet>) => estimatedOneRepMax(makeSet(partial), 'external');

	it('100 kg × 5 without RIR is 100 × (1 + 5/30) = 116.67 kg', () => {
		expect(e1rm({ weight: 100, reps: 5 })).toBe(116.67);
	});

	it('adds the RIR to the reps: 100 kg × 5 with RIR 1 counts 6 reps efectivas, 120 kg', () => {
		expect(e1rm({ weight: 100, reps: 5, rir: 1 })).toBe(120);
	});

	it('one rep efectiva is the effective weight itself', () => {
		expect(e1rm({ weight: 140, reps: 1 })).toBe(140);
	});

	it('is calculated at exactly 10 reps efectivas and null above', () => {
		expect(e1rm({ weight: 60, reps: 10 })).toBe(80);
		expect(e1rm({ weight: 60, reps: 8, rir: 2 })).toBe(80);
		expect(e1rm({ weight: 60, reps: 9, rir: 2 })).toBeNull();
		expect(e1rm({ weight: 60, reps: 11 })).toBeNull();
	});

	it('is null with 0 reps, even with RIR', () => {
		expect(e1rm({ weight: 60, reps: 0 })).toBeNull();
		expect(e1rm({ weight: 60, reps: 0, rir: 3 })).toBeNull();
	});

	it('is null for a warm-up set', () => {
		expect(e1rm({ weight: 100, reps: 5, type: 'warmup' })).toBeNull();
	});

	it('uses the effective weight: a pull-up at 80 kg body weight + 10 kg × 3 is 99 kg', () => {
		const weights = bodyWeightAt([makeBodyWeight({ date: '2026-10-01', kg: 80 })]);
		const pullUp = makeSet({ weight: 10, reps: 3, performedAt: '2026-10-28T18:00:00Z' });
		expect(estimatedOneRepMax(pullUp, 'bodyweight', weights)).toBe(99);
	});

	it('is null without a positive effective weight: 0 kg, or assistance as heavy as the body', () => {
		const weights = bodyWeightAt([makeBodyWeight({ date: '2026-10-01', kg: 80 })]);
		const at = '2026-10-28T18:00:00Z';
		expect(e1rm({ weight: 0, reps: 5 })).toBeNull();
		expect(
			estimatedOneRepMax(makeSet({ weight: 80, reps: 5, performedAt: at }), 'assisted', weights)
		).toBeNull();
		expect(
			estimatedOneRepMax(makeSet({ weight: 85, reps: 5, performedAt: at }), 'assisted', weights)
		).toBeNull();
		// 80 − 20 = 60 kg × 5 → 70 kg.
		expect(
			estimatedOneRepMax(makeSet({ weight: 20, reps: 5, performedAt: at }), 'assisted', weights)
		).toBe(70);
	});

	it('is null without an effective weight: a pull-up with no body weight', () => {
		expect(estimatedOneRepMax(makeSet({ weight: 0, reps: 5 }), 'bodyweight')).toBeNull();
	});
});

describe('1RM estimado del ejercicio (spec #28: the maximum, dated at the first set that gave it)', () => {
	it('takes the best set, not the heaviest, and keeps the first date on a later tie', () => {
		const sets = [
			// 100 × 5 → 116.67; 110 × 1 → 110; the 120 kg warm-up never counts; 12 reps → none.
			set({ performedAt: '2026-10-28T18:00:00Z', reps: 5, weight: 100 }),
			set({ performedAt: '2026-10-28T18:05:00Z', reps: 1, weight: 110 }),
			set({ performedAt: '2026-10-29T18:00:00Z', reps: 3, weight: 120, type: 'warmup' }),
			set({ performedAt: '2026-10-29T18:05:00Z', reps: 12, weight: 100 }),
			set({ performedAt: '2026-10-30T18:00:00Z', reps: 5, weight: 100 })
		];

		expect(exerciseIndicators(sets, 'external').e1RM).toEqual({
			kg: 116.67,
			at: '2026-10-28T18:00:00Z'
		});
	});

	it('is null, not an error, when no work set has 10 reps efectivas or fewer', () => {
		const sets = [set({ performedAt: '2026-10-28T18:00:00Z', reps: 15, weight: 40 })];
		expect(exerciseIndicators(sets, 'external').e1RM).toBeNull();
	});

	it('is null on a pull-up without a body weight', () => {
		const sets = [set({ performedAt: '2026-10-28T18:00:00Z', reps: 5, weight: 0 })];
		expect(exerciseIndicators(sets, 'bodyweight').e1RM).toBeNull();
	});
});

describe('fuerza relativa (spec #29: 1RM estimado ÷ peso corporal vigente, two decimals)', () => {
	// 80 kg until 14 Oct, 75 kg from 15 Oct.
	const weights = bodyWeightAt([
		makeBodyWeight({ id: 'b1', date: '2026-10-01', kg: 80 }),
		makeBodyWeight({ id: 'b2', date: '2026-10-15', kg: 75 })
	]);

	it('divides the 1RM estimado by the body weight of that date: 100 kg × 5 is 1.46 at 80 kg, 1.56 at 75 kg', () => {
		const before = makeSet({ weight: 100, reps: 5, performedAt: '2026-10-10T18:00:00Z' });
		const after = makeSet({ weight: 100, reps: 5, performedAt: '2026-10-28T18:00:00Z' });
		// 116.67 / 80 = 1.458…; 116.67 / 75 = 1.555…
		expect(relativeStrength(before, 'external', weights)).toBe(1.46);
		expect(relativeStrength(after, 'external', weights)).toBe(1.56);
	});

	it('uses the effective weight on a pull-up: 80 kg + 10 kg × 3 is 99 kg, 1.24 × peso corporal', () => {
		const pullUp = makeSet({ weight: 10, reps: 3, performedAt: '2026-10-10T18:00:00Z' });
		expect(relativeStrength(pullUp, 'bodyweight', weights)).toBe(1.24);
	});

	it('is null without a body weight, even with external load', () => {
		expect(relativeStrength(makeSet({ weight: 100, reps: 5 }), 'external')).toBeNull();
	});

	it('is null when the set has no 1RM estimado', () => {
		const long = makeSet({ weight: 60, reps: 12, performedAt: '2026-10-10T18:00:00Z' });
		const warmup = makeSet({
			weight: 60,
			reps: 5,
			type: 'warmup',
			performedAt: '2026-10-10T18:00:00Z'
		});
		expect(relativeStrength(long, 'external', weights)).toBeNull();
		expect(relativeStrength(warmup, 'external', weights)).toBeNull();
	});
});

describe('fuerza relativa del ejercicio (spec #29: the maximum, dated)', () => {
	const weights = bodyWeightAt([
		makeBodyWeight({ id: 'b1', date: '2026-10-01', kg: 80 }),
		makeBodyWeight({ id: 'b2', date: '2026-10-15', kg: 75 })
	]);

	it('can come from a set with a lower 1RM estimado once the body weight dropped', () => {
		const sets = [
			// 100 × 5 → 116.67 kg at 80 kg → 1.46; 95 × 5 → 110.83 kg at 75 kg → 1.48.
			set({ performedAt: '2026-10-10T18:00:00Z', reps: 5, weight: 100 }),
			set({ performedAt: '2026-10-28T18:00:00Z', reps: 5, weight: 95 })
		];
		const indicators = exerciseIndicators(sets, 'external', weights);
		expect(indicators.e1RM?.kg).toBe(116.67);
		expect(indicators.relativeStrength).toEqual({ times: 1.48, at: '2026-10-28T18:00:00Z' });
	});

	it('keeps the first date on a later tie', () => {
		const sets = [
			set({ performedAt: '2026-10-20T18:00:00Z', reps: 5, weight: 95 }),
			set({ performedAt: '2026-10-28T18:00:00Z', reps: 5, weight: 95 })
		];
		expect(exerciseIndicators(sets, 'external', weights).relativeStrength?.at).toBe(
			'2026-10-20T18:00:00Z'
		);
	});

	it('is null without a body weight', () => {
		const sets = [set({ performedAt: '2026-10-28T18:00:00Z', reps: 5, weight: 100 })];
		expect(exerciseIndicators(sets, 'external').relativeStrength).toBeNull();
	});
});
