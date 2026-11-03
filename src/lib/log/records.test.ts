import { describe, expect, it } from 'vitest';
import { makeSet } from './fixtures';
import { personalRecords, recordsBrokenBy } from './records';
import type { WorkoutSet } from './types';

function set(partial: Partial<WorkoutSet> & { performedAt: string }): WorkoutSet {
	return makeSet({ id: partial.performedAt, ...partial });
}

describe('personalRecords: which set broke which record (spec #25: strictly greater, first set never)', () => {
	it('the first set of the exercise breaks nothing; a heavier second set breaks the max weight', () => {
		const first = set({ performedAt: '2026-10-28T18:00:00Z', reps: 8, weight: 60 });
		const heavier = set({ performedAt: '2026-10-28T18:05:00Z', reps: 8, weight: 70 });

		const { broken } = personalRecords([first, heavier], 'external');

		expect(broken.get(first.id)).toBeUndefined();
		expect(broken.get(heavier.id)).toContainEqual({ measure: 'maxWeight', kg: 70 });
	});

	it('a lighter set with more reps breaks the 1RM estimado alone', () => {
		// Epley: 60 × (1 + 8/30) = 76; 70 × (1 + 3/30) = 77; 65 × (1 + 6/30) = 78.
		const sets = [
			set({ performedAt: '2026-10-28T18:00:00Z', reps: 8, weight: 60 }),
			set({ performedAt: '2026-10-28T18:05:00Z', reps: 3, weight: 70 }),
			set({ performedAt: '2026-10-30T18:00:00Z', reps: 6, weight: 65 })
		];

		const { broken } = personalRecords(sets, 'external');

		expect(broken.get(sets[1].id)).toEqual([
			{ measure: 'maxWeight', kg: 70 },
			{ measure: 'e1RM', kg: 77 }
		]);
		expect(broken.get(sets[2].id)).toEqual([{ measure: 'e1RM', kg: 78 }]);
	});

	it('a tie breaks nothing: it has to be strictly greater', () => {
		const sets = [
			set({ performedAt: '2026-10-28T18:00:00Z', reps: 8, weight: 60 }),
			set({ performedAt: '2026-10-30T18:00:00Z', reps: 8, weight: 60 })
		];

		expect(personalRecords(sets, 'external').broken.size).toBe(0);
	});

	it('more reps at the same effective weight break the reps at that weight, not at another', () => {
		// The third set has more reps at 60 kg than ever; the 100 kg single does not count for 60 kg.
		// 60 × (1 + 10/30) = 80 is under the 100 kg single, so no 1RM estimado either.
		const sets = [
			set({ performedAt: '2026-10-26T18:00:00Z', reps: 8, weight: 60 }),
			set({ performedAt: '2026-10-26T18:05:00Z', reps: 1, weight: 100 }),
			set({ performedAt: '2026-10-28T18:00:00Z', reps: 10, weight: 60 }),
			set({ performedAt: '2026-10-28T18:05:00Z', reps: 12, weight: 50 })
		];

		const { broken } = personalRecords(sets, 'external');

		expect(broken.get(sets[2].id)).toEqual([{ measure: 'repsAtWeight', reps: 10, kg: 60 }]);
		// The first set at 50 kg has nothing earlier at that weight to beat.
		expect(broken.get(sets[3].id)).toBeUndefined();
	});
});

describe('personalRecords: the records of the exercise (spec #25: weight and 1RM estimado with date, reps per weight heaviest first)', () => {
	it('dates each record at the first set that reached it and lists the reps per weight from heaviest to lightest', () => {
		const sets = [
			set({ performedAt: '2026-10-26T18:00:00Z', reps: 8, weight: 60 }),
			set({ performedAt: '2026-10-26T18:05:00Z', reps: 5, weight: 70 }),
			set({ performedAt: '2026-10-26T17:55:00Z', type: 'warmup', reps: 1, weight: 90 }),
			set({ performedAt: '2026-10-28T18:00:00Z', reps: 10, weight: 60 }),
			set({ performedAt: '2026-10-30T18:00:00Z', reps: 5, weight: 70 })
		];

		const records = personalRecords(sets, 'external');

		// 70 × (1 + 5/30) = 81,67 beats 60 × (1 + 10/30) = 80; the 90 kg warm-up never counts.
		expect(records.maxWeight).toEqual({ kg: 70, at: '2026-10-26T18:05:00Z' });
		expect(records.e1RM).toEqual({ kg: 81.67, at: '2026-10-26T18:05:00Z' });
		expect(records.repsByWeight).toEqual([
			{ kg: 70, reps: 5, at: '2026-10-26T18:05:00Z' },
			{ kg: 60, reps: 10, at: '2026-10-28T18:00:00Z' }
		]);
	});

	it('is empty without sets or while the effective weight is unknown', () => {
		const empty = {
			maxWeight: null,
			e1RM: null,
			repsByWeight: [],
			broken: new Map(),
			held: new Map()
		};
		expect(personalRecords([], 'external')).toEqual(empty);
		const pullUps = [set({ performedAt: '2026-10-26T18:00:00Z', reps: 8, weight: 0 })];
		expect(personalRecords(pullUps, 'bodyweight')).toEqual(empty);
	});
});

describe('personalRecords: marks are derived, never stored (spec #25: recalculated after deleting or correcting)', () => {
	const sets = [
		set({ performedAt: '2026-10-26T18:00:00Z', reps: 5, weight: 60 }),
		set({ performedAt: '2026-10-28T18:00:00Z', reps: 5, weight: 70 }),
		set({ performedAt: '2026-10-30T18:00:00Z', reps: 5, weight: 75 })
	];
	const maxWeightOf = (rows: WorkoutSet[], id: string) =>
		personalRecords(rows, 'external')
			.broken.get(id)
			?.find((record) => record.measure === 'maxWeight');

	it('deleting the set that held the record makes the next one beat the one before it', () => {
		const withoutMiddle = [sets[0], sets[2]];

		expect(maxWeightOf(withoutMiddle, sets[2].id)).toEqual({ measure: 'maxWeight', kg: 75 });
		expect(personalRecords(withoutMiddle, 'external').maxWeight?.kg).toBe(75);
	});

	it('correcting a set below the record takes its mark away', () => {
		const corrected = [sets[0], sets[1], { ...sets[2], weight: 65 }];

		expect(maxWeightOf(corrected, sets[2].id)).toBeUndefined();
		expect(personalRecords(corrected, 'external').maxWeight).toEqual({
			kg: 70,
			at: '2026-10-28T18:00:00Z'
		});
	});

	it('of several sets logged together, only one carries the mark, the same in any order', () => {
		const at = '2026-10-30T18:00:00Z';
		const batch = ['b', 'a', 'c'].map((id) => makeSet({ id, performedAt: at, weight: 70 }));
		const earlier = set({ performedAt: '2026-10-28T18:00:00Z', weight: 60 });

		const forward = personalRecords([earlier, ...batch], 'external').broken;
		const backward = personalRecords([...batch].reverse().concat(earlier), 'external').broken;

		expect([...forward.keys()]).toEqual(['a']);
		expect([...backward.keys()]).toEqual(['a']);
	});
});

describe('recordsBrokenBy: what a registration announces (spec #25: one notice naming every measure)', () => {
	const earlier = set({ performedAt: '2026-10-28T18:00:00Z', reps: 5, weight: 60 });
	const heavier = set({ performedAt: '2026-10-30T18:00:00Z', reps: 5, weight: 70 });

	it('names every record the new sets broke, whether or not the earlier sets already include them', () => {
		const expected = [
			{ measure: 'maxWeight', kg: 70 },
			{ measure: 'e1RM', kg: 81.67 }
		];

		expect(recordsBrokenBy([earlier], [heavier], 'external')).toEqual(expected);
		expect(recordsBrokenBy([earlier, heavier], [heavier], 'external')).toEqual(expected);
	});

	it('announces nothing for the first set of the exercise or a set that beats nothing', () => {
		expect(recordsBrokenBy([], [earlier], 'external')).toEqual([]);
		expect(recordsBrokenBy([heavier], [earlier], 'external')).toEqual([]);
	});
});

describe('personalRecords: the Récord mark is on the set that holds the record now (owner, 2026-11-02)', () => {
	it('a set that broke a record later beaten loses its mark; the one that beat it keeps it', () => {
		const sets = [
			set({ performedAt: '2026-10-26T18:00:00Z', reps: 5, weight: 60 }),
			set({ performedAt: '2026-10-28T18:00:00Z', reps: 5, weight: 70 }),
			set({ performedAt: '2026-10-30T18:00:00Z', reps: 5, weight: 80 })
		];

		const { held } = personalRecords(sets, 'external');

		expect([...held.keys()]).toEqual([sets[2].id]);
		expect(held.get(sets[2].id)).toEqual([
			{ measure: 'maxWeight', kg: 80 },
			{ measure: 'e1RM', kg: 93.33 }
		]);
	});

	it('each measure marks its own holder, and a record nobody has beaten yet marks nothing', () => {
		// 80 × 1 holds the max weight and the 1RM estimado (80 beats 60 × (1 + 8/30) = 76);
		// 60 × 10 holds the reps at 60 kg; the first 60 kg set held them before and has nothing left.
		const sets = [
			set({ performedAt: '2026-10-26T18:00:00Z', reps: 8, weight: 60 }),
			set({ performedAt: '2026-10-28T18:00:00Z', reps: 1, weight: 80 }),
			set({ performedAt: '2026-10-30T18:00:00Z', reps: 10, weight: 60 })
		];

		const { held } = personalRecords(sets, 'external');

		expect(held.get(sets[0].id)).toBeUndefined();
		expect(held.get(sets[1].id)).toEqual([
			{ measure: 'maxWeight', kg: 80 },
			{ measure: 'e1RM', kg: 80 }
		]);
		expect(held.get(sets[2].id)).toEqual([{ measure: 'repsAtWeight', reps: 10, kg: 60 }]);
	});
});
