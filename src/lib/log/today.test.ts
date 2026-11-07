import { describe, expect, it } from 'vitest';
import { addedExercises, nextInRoutine, routineProgress, startDestination } from './today';
import { makeSet } from './fixtures';
import type { WorkoutSet } from './types';

function set(
	partial: Partial<WorkoutSet> & { exerciseId: string; performedAt: string }
): WorkoutSet {
	return makeSet({ id: partial.performedAt, ...partial });
}

const press = {
	exerciseId: 'press-de-banca-plano',
	sets: 3,
	repsMin: 5,
	repsMax: 8,
	rir: null,
	rest: 150
};
const aperturas = {
	exerciseId: 'aperturas-con-mancuernas',
	sets: 3,
	repsMin: 8,
	repsMax: 12,
	rir: 2,
	rest: 90
};

describe('progress against the routine (spec #15: work sets over prescribed; warm-ups do not count)', () => {
	it('counts the work sets of each routine exercise, in routine order, and marks the objective met', () => {
		const sets = [
			set({ exerciseId: 'aperturas-con-mancuernas', performedAt: '2026-10-31T18:20:00Z' }),
			set({
				exerciseId: 'press-de-banca-plano',
				performedAt: '2026-10-31T18:00:00Z',
				type: 'warmup'
			}),
			set({ exerciseId: 'press-de-banca-plano', performedAt: '2026-10-31T18:05:00Z' }),
			set({
				exerciseId: 'press-de-banca-plano',
				performedAt: '2026-10-31T18:08:00Z',
				type: 'drop'
			}),
			set({
				exerciseId: 'press-de-banca-plano',
				performedAt: '2026-10-31T18:11:00Z',
				type: 'failure'
			})
		];

		expect(routineProgress([press, aperturas], sets)).toEqual([
			{ entry: press, done: 3, met: true },
			{ entry: aperturas, done: 1, met: false }
		]);
	});

	it('leaves a skipped exercise at 0 of n, and keeps counting past the objective', () => {
		const sets = [
			set({ exerciseId: 'aperturas-con-mancuernas', performedAt: '2026-10-31T18:20:00Z' }),
			set({ exerciseId: 'aperturas-con-mancuernas', performedAt: '2026-10-31T18:22:00Z' }),
			set({ exerciseId: 'aperturas-con-mancuernas', performedAt: '2026-10-31T18:24:00Z' }),
			set({ exerciseId: 'aperturas-con-mancuernas', performedAt: '2026-10-31T18:26:00Z' })
		];

		expect(routineProgress([press, aperturas], sets)).toEqual([
			{ entry: press, done: 0, met: false },
			{ entry: aperturas, done: 4, met: true }
		]);
	});
});

describe('added exercises (spec #15: logged outside the routine, in order of first set)', () => {
	it('lists what the routine does not prescribe, each with its sets in order, by first set', () => {
		const sets = [
			set({ exerciseId: 'curl-con-barra', performedAt: '2026-10-31T18:30:00Z' }),
			set({ exerciseId: 'press-de-banca-plano', performedAt: '2026-10-31T18:00:00Z' }),
			set({ exerciseId: 'fondos-en-paralelas', performedAt: '2026-10-31T18:25:00Z' }),
			set({ exerciseId: 'curl-con-barra', performedAt: '2026-10-31T18:20:00Z' })
		];

		expect(addedExercises([press], sets)).toEqual([
			{ exerciseId: 'curl-con-barra', sets: [sets[3], sets[0]] },
			{ exerciseId: 'fondos-en-paralelas', sets: [sets[2]] }
		]);
	});

	it('is empty when everything logged belongs to the routine', () => {
		const sets = [set({ exerciseId: 'press-de-banca-plano', performedAt: '2026-10-31T18:00:00Z' })];

		expect(addedExercises([press], sets)).toEqual([]);
	});
});

describe('the exercise that comes next (Hoy highlights it)', () => {
	it('is the first routine exercise, in order, short of its prescribed sets', () => {
		const progress = [
			{ entry: press, done: 3, met: true },
			{ entry: aperturas, done: 1, met: false }
		];

		expect(nextInRoutine(progress)).toBe(1);
		expect(nextInRoutine([{ entry: press, done: 0, met: false }, ...progress])).toBe(0);
	});

	it('is none once every exercise met its sets', () => {
		expect(nextInRoutine([{ entry: press, done: 4, met: true }])).toBe(-1);
		expect(nextInRoutine([])).toBe(-1);
	});
});

describe('where Empezar leads (the log of the exercise that comes next)', () => {
	it('opens the first exercise of a fresh routine', () => {
		expect(startDestination([press, aperturas], [])).toBe('/ejercicios/press-de-banca-plano');
	});

	it('skips the exercises the workout already met, counting its sets', () => {
		const done = ['18:00', '18:03', '18:06'].map((time) =>
			set({ exerciseId: press.exerciseId, performedAt: `2026-11-07T${time}:00.000Z` })
		);
		expect(startDestination([press, aperturas], done)).toBe('/ejercicios/aperturas-con-mancuernas');
	});

	it('goes to Hoy when nothing is left or the routine has no exercises', () => {
		expect(startDestination([], [])).toBe('/');
	});
});
