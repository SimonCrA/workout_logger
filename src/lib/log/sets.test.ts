import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';
import { addSet, deleteLastSet, setsOf } from './sets';

const press = 'press-de-banca-plano';
const input = {
	exerciseId: press,
	reps: 8,
	weight: 60,
	rir: null,
	type: 'normal' as const,
	note: null
};
const at = (iso: string) => new Date(iso);

beforeEach(async () => {
	await db.workouts.clear();
	await db.sets.clear();
});

describe('registering sets locally', () => {
	it('stores the set with the sync columns of ADR-0001, hanging from an automatic workout', async () => {
		const set = await addSet(input, at('2026-10-28T18:00:00Z'));

		expect(set).toMatchObject({
			reps: 8,
			weight: 60,
			rir: null,
			type: 'normal',
			note: null,
			userId: null,
			performedAt: '2026-10-28T18:00:00.000Z',
			deletedAt: null,
			pending: 1
		});
		expect(await db.workouts.get(set.workoutId)).toMatchObject({
			startedAt: '2026-10-28T18:00:00.000Z',
			endedAt: null,
			pending: 1
		});
	});

	it('keeps sets less than 3 hours apart in one workout and starts another after that, closing the first', async () => {
		const first = await addSet(input, at('2026-10-28T18:00:00Z'));
		const second = await addSet(input, at('2026-10-28T20:30:00Z'));
		const next = await addSet(input, at('2026-10-29T09:00:00Z'));

		expect(second.workoutId).toBe(first.workoutId);
		expect(next.workoutId).not.toBe(first.workoutId);
		expect((await db.workouts.get(first.workoutId))?.endedAt).toBe('2026-10-28T20:30:00.000Z');
		expect((await db.workouts.get(next.workoutId))?.endedAt).toBeNull();
	});

	it('lists the sets of an exercise in time order, without those of other exercises', async () => {
		await addSet({ ...input, weight: 60 }, at('2026-10-28T18:00:00Z'));
		await addSet({ ...input, exerciseId: 'curl-martillo' }, at('2026-10-28T18:02:00Z'));
		await addSet({ ...input, weight: 62.5 }, at('2026-10-28T18:05:00Z'));

		expect((await setsOf(press)).map((s) => s.weight)).toEqual([60, 62.5]);
	});

	it('deleting the last set hides it but keeps the row, marked deleted and pending, for sync', async () => {
		await addSet({ ...input, weight: 60 }, at('2026-10-28T18:00:00Z'));
		const last = await addSet({ ...input, weight: 62.5 }, at('2026-10-28T18:05:00Z'));

		const deleted = await deleteLastSet(press, at('2026-10-28T18:06:00Z'));

		expect(deleted?.id).toBe(last.id);
		expect((await setsOf(press)).map((s) => s.weight)).toEqual([60]);
		expect(await db.sets.get(last.id)).toMatchObject({
			deletedAt: '2026-10-28T18:06:00.000Z',
			updatedAt: '2026-10-28T18:06:00.000Z',
			pending: 1
		});
	});

	it('deleting with nothing registered does nothing', async () => {
		expect(await deleteLastSet(press, at('2026-10-28T18:06:00Z'))).toBeUndefined();
	});
});
