import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';
import { createRoutine } from './routines';
import { routineStart } from './rules';
import { addSet, addSets, deleteLastSet, deleteSet, exerciseLog, updateSet } from './sets';
import { changeWorkoutMode, setsOf, startWorkout } from './workouts';

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
	await db.routines.clear();
	await db.workouts.clear();
	await db.sets.clear();
	await db.meta.clear();
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

	it('counts the sets of any exercise as activity that keeps the workout open', async () => {
		const first = await addSet(input, at('2026-10-28T18:00:00Z'));
		await addSet({ ...input, exerciseId: 'curl-martillo' }, at('2026-10-28T20:30:00Z'));
		const later = await addSet(input, at('2026-10-28T22:00:00Z'));

		expect(later.workoutId).toBe(first.workoutId);
	});

	it('does not delete anything once a free workout has been idle for 3 hours', async () => {
		await addSet(input, at('2026-10-28T18:00:00Z'));

		expect(await deleteLastSet(press, at('2026-10-28T21:00:00Z'))).toBeUndefined();
		expect(await setsOf(press)).toHaveLength(1);
	});

	it('keeps adding sets to a workout started from a routine however long it has been idle (ADR-0006)', async () => {
		const workout = await startWorkout(
			{ routineId: 'empuje-a', title: 'Empuje A', mode: 'log' },
			at('2026-10-28T18:00:00Z')
		);
		const first = await addSet(input, at('2026-10-28T18:05:00Z'));
		const nextMorning = await addSet(input, at('2026-10-29T09:00:00Z'));

		expect(first.workoutId).toBe(workout.id);
		expect(nextMorning.workoutId).toBe(workout.id);
		expect(await db.workouts.count()).toBe(1);
	});

	it('deletes the last set of a routine workout even hours after it was registered', async () => {
		await startWorkout(
			{ routineId: 'empuje-a', title: 'Empuje A', mode: 'log' },
			at('2026-10-28T18:00:00Z')
		);
		await addSet(input, at('2026-10-28T18:05:00Z'));

		expect(await deleteLastSet(press, at('2026-10-29T09:00:00Z'))).toBeDefined();
		expect(await setsOf(press)).toHaveLength(0);
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

describe('several identical sets at once (spec #16: solo registrar notes "3 × 10 × 60 kg" in one go)', () => {
	it('creates N identical sets with the same hour and distinct ids, in the one workout in progress', async () => {
		await startWorkout(
			{ routineId: 'empuje-a', title: 'Empuje A', mode: 'log' },
			at('2026-10-28T18:00:00Z')
		);

		const created = await addSets({ ...input, reps: 10, rir: 2 }, 3, at('2026-10-28T18:05:00Z'));

		expect(created).toHaveLength(3);
		expect(new Set(created.map((s) => s.id)).size).toBe(3);
		expect(created.map((s) => s.workoutId)).toEqual(Array(3).fill(created[0].workoutId));
		for (const set of created) {
			expect(set).toMatchObject({
				reps: 10,
				weight: 60,
				rir: 2,
				type: 'normal',
				performedAt: '2026-10-28T18:05:00.000Z',
				pending: 1
			});
		}
		// Con la misma hora, el orden entre ellas no significa nada.
		expect((await setsOf(press)).map((s) => s.id).sort()).toEqual(created.map((s) => s.id).sort());
		expect(await db.workouts.count()).toBe(1);
	});

	it('with one set is the same as registering a set', async () => {
		const [set] = await addSets(input, 1, at('2026-10-28T18:00:00Z'));

		expect(await setsOf(press)).toEqual([set]);
	});

	it('refuses fewer than one set or a fractional count', async () => {
		await expect(addSets(input, 0, at('2026-10-28T18:00:00Z'))).rejects.toThrow(RangeError);
		await expect(addSets(input, 1.5, at('2026-10-28T18:00:00Z'))).rejects.toThrow(RangeError);
		expect(await setsOf(press)).toEqual([]);
	});
});

describe('what the exercise page observes (spec #16: the workout mode, its last set, and what the routine prescribes)', () => {
	const prescribed = {
		exerciseId: press,
		sets: 3,
		repsMin: 5,
		repsMax: 8,
		rir: 1,
		rest: 150
	};

	it('gives the sets of the exercise, the unfinished workout with its last set of any exercise, the prescription and the last mode', async () => {
		const routine = await createRoutine(
			{ name: 'Empuje A', baseRoutineId: null, exercises: [prescribed] },
			at('2026-10-27T10:00:00Z')
		);
		const workout = await startWorkout(
			routineStart(routine, 'companion'),
			at('2026-10-28T18:00:00Z')
		);
		const mine = await addSet(input, at('2026-10-28T18:05:00Z'));
		await addSet({ ...input, exerciseId: 'curl-martillo' }, at('2026-10-28T18:09:00Z'));

		const log = await exerciseLog(press);

		expect(log.sets).toEqual([mine]);
		expect(log.unfinished).toEqual({ workout, lastSetAt: '2026-10-28T18:09:00.000Z' });
		expect(log.prescribed).toEqual(prescribed);
		expect(log.lastMode).toBe('companion');
	});

	it('has no prescription when the routine does not include the exercise, nor in a free workout', async () => {
		const routine = await createRoutine(
			{
				name: 'Tirón A',
				baseRoutineId: null,
				exercises: [{ ...prescribed, exerciseId: 'remo-con-barra' }]
			},
			at('2026-10-27T10:00:00Z')
		);
		await startWorkout(routineStart(routine, 'log'), at('2026-10-28T18:00:00Z'));
		expect((await exerciseLog(press)).prescribed).toBeNull();

		await db.workouts.clear();
		await addSet(input, at('2026-10-29T18:00:00Z'));
		expect((await exerciseLog(press)).prescribed).toBeNull();
	});

	it('with nothing unfinished, carries the last mode chosen so the next free workout logs the same way', async () => {
		await changeWorkoutMode('log', at('2026-10-28T18:00:00Z'));

		const log = await exerciseLog(press);

		expect(log).toEqual({
			sets: [],
			unfinished: null,
			prescribed: null,
			lastMode: 'log',
			startedAt: {}
		});
	});

	it('knows when each workout with the exercise started, for the chart (spec #20: the axis by workout date)', async () => {
		const workout = await startWorkout(
			routineStart({ id: 'r1', name: 'Empuje A' }, 'companion'),
			at('2026-10-28T17:50:00Z')
		);
		await addSet(input, at('2026-10-28T18:05:00Z'));

		expect((await exerciseLog(press)).startedAt).toEqual({
			[workout.id]: '2026-10-28T17:50:00.000Z'
		});
	});
});

describe('correcting a set (spec #18: any set, of today or an earlier day, edited or deleted from its row)', () => {
	const changes = { reps: 6, weight: 65, rir: 1, type: 'failure' as const, note: 'pesada' };

	it('edits reps, weight, RIR, type and note of a set of an earlier day and leaves it pending', async () => {
		const set = await addSet(input, at('2026-10-20T18:00:00Z'));

		const edited = await updateSet(set.id, changes, at('2026-10-28T09:00:00Z'));

		expect(edited).toEqual({
			...set,
			...changes,
			updatedAt: '2026-10-28T09:00:00.000Z',
			pending: 1
		});
		expect(await db.sets.get(set.id)).toEqual(edited);
	});

	it('deletes any set by id, keeping the row marked deleted and pending', async () => {
		const first = await addSet(input, at('2026-10-20T18:00:00Z'));
		const second = await addSet({ ...input, weight: 62.5 }, at('2026-10-20T18:05:00Z'));

		const deleted = await deleteSet(first.id, at('2026-10-28T09:00:00Z'));

		expect(deleted).toEqual({
			...first,
			deletedAt: '2026-10-28T09:00:00.000Z',
			updatedAt: '2026-10-28T09:00:00.000Z',
			pending: 1
		});
		expect(await setsOf(press)).toEqual([second]);
	});

	it('does nothing for a set that does not exist or was already deleted', async () => {
		const set = await addSet(input, at('2026-10-20T18:00:00Z'));
		await deleteSet(set.id, at('2026-10-20T18:01:00Z'));

		expect(await updateSet(set.id, changes, at('2026-10-28T09:00:00Z'))).toBeUndefined();
		expect(await deleteSet(set.id, at('2026-10-28T09:00:00Z'))).toBeUndefined();
		expect(await updateSet('no-existe', changes, at('2026-10-28T09:00:00Z'))).toBeUndefined();
		expect(await db.sets.get(set.id)).toMatchObject({
			reps: 8,
			deletedAt: '2026-10-20T18:01:00.000Z',
			updatedAt: '2026-10-20T18:01:00.000Z'
		});
	});
});
