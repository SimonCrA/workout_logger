import { describe, expect, it } from 'vitest';
import { groupByWorkout, lastTime, nonNegative, prefillFor, stepValue } from './rules';
import type { WorkoutSet } from './types';

function set(
	partial: Partial<WorkoutSet> & { workoutId: string; performedAt: string }
): WorkoutSet {
	return {
		id: partial.performedAt,
		userId: null,
		createdAt: partial.performedAt,
		updatedAt: partial.performedAt,
		deletedAt: null,
		pending: 1,
		exerciseId: 'press-de-banca-plano',
		reps: 8,
		weight: 60,
		rir: null,
		type: 'normal',
		note: null,
		...partial
	};
}

describe('stepValue (spec: steps of 1 rep and 2,5 kg, never negative)', () => {
	it('adds and subtracts the step', () => {
		expect(stepValue(10, 1)).toBe(11);
		expect(stepValue(60, -2.5)).toBe(57.5);
	});

	it('does not go below zero', () => {
		expect(stepValue(0, -1)).toBe(0);
		expect(stepValue(1, -2.5)).toBe(0);
	});

	it('keeps weights to one decimal despite float arithmetic', () => {
		expect(stepValue(57.5, 2.5)).toBe(60);
		expect(stepValue(0.1, 0.2)).toBe(0.3);
	});
});

describe('nonNegative (spec: no negative values can be typed)', () => {
	it('turns negatives and non-numbers into zero and keeps two decimals', () => {
		expect(nonNegative(-5)).toBe(0);
		expect(nonNegative(Number.POSITIVE_INFINITY)).toBe(0);
		expect(nonNegative(62.349)).toBe(62.35);
	});
});

describe('prefillFor (spec: reps and weight come from the last time)', () => {
	it('defaults to 10 reps and 0 kg with no history', () => {
		expect(prefillFor([])).toEqual({ reps: 10, weight: 0 });
	});

	it('takes the most recent set, whatever the array order', () => {
		const sets = [
			set({ workoutId: 'w2', performedAt: '2026-10-28T18:10:00Z', reps: 6, weight: 70 }),
			set({ workoutId: 'w1', performedAt: '2026-10-26T18:00:00Z', reps: 10, weight: 50 }),
			set({ workoutId: 'w2', performedAt: '2026-10-28T18:00:00Z', reps: 8, weight: 65 })
		];

		expect(prefillFor(sets)).toEqual({ reps: 6, weight: 70 });
	});
});

describe('lastTime (GLOSSARY: the sets of the most recent workout with the exercise)', () => {
	const sets = [
		set({ workoutId: 'w1', performedAt: '2026-10-26T18:00:00Z', weight: 50 }),
		set({ workoutId: 'w2', performedAt: '2026-10-27T18:00:00Z', weight: 55 }),
		set({ workoutId: 'w2', performedAt: '2026-10-27T18:05:00Z', weight: 57.5 }),
		set({ workoutId: 'w3', performedAt: '2026-10-28T18:00:00Z', weight: 60 })
	];

	it('returns the sets of the latest workout, in order', () => {
		expect(lastTime(sets).map((s) => s.weight)).toEqual([60]);
	});

	it('skips the workout in progress so today is compared with the previous time', () => {
		expect(lastTime(sets, 'w3').map((s) => s.weight)).toEqual([55, 57.5]);
	});

	it('is empty without history', () => {
		expect(lastTime([])).toEqual([]);
	});
});

describe('groupByWorkout (spec: history grouped by date)', () => {
	it('groups newest workout first with its sets in time order', () => {
		const sets = [
			set({ workoutId: 'w2', performedAt: '2026-10-28T18:05:00Z', weight: 62.5 }),
			set({ workoutId: 'w1', performedAt: '2026-10-26T18:00:00Z', weight: 50 }),
			set({ workoutId: 'w2', performedAt: '2026-10-28T18:00:00Z', weight: 60 })
		];

		expect(groupByWorkout(sets)).toEqual([
			{ workoutId: 'w2', date: '2026-10-28T18:00:00Z', sets: [sets[2], sets[0]] },
			{ workoutId: 'w1', date: '2026-10-26T18:00:00Z', sets: [sets[1]] }
		]);
	});
});
