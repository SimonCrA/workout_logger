import { describe, expect, it } from 'vitest';
import { exerciseIndicators } from './indicators';
import type { WorkoutSet } from './types';

function set(partial: Partial<WorkoutSet> & { performedAt: string }): WorkoutSet {
	return {
		id: partial.performedAt,
		userId: null,
		createdAt: partial.performedAt,
		updatedAt: partial.performedAt,
		deletedAt: null,
		pending: 1,
		workoutId: 'w1',
		exerciseId: 'press-de-banca-plano',
		reps: 8,
		weight: 60,
		rir: null,
		type: 'normal',
		note: null,
		...partial
	};
}

describe('exerciseIndicators (spec: six indicators over work sets, empty state without error)', () => {
	it('is empty, not an error, for an exercise without sets', () => {
		expect(exerciseIndicators([], 'external')).toEqual({
			sets: 0,
			reps: 0,
			volume: null,
			maxWeight: null,
			totalWeight: null,
			averagePerRep: null
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
	const bodyWeight = 80;

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
			expect(exerciseIndicators(sets, loadMode)).toEqual({
				sets: 2,
				reps: 13,
				volume: null,
				maxWeight: null,
				totalWeight: null,
				averagePerRep: null
			});
		}
	});
});
