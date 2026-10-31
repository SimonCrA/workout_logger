import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';
import { attachRoutine, newWorkout } from './rules';
import { addSet } from './sets';
import type { WorkoutSet } from './types';
import { changeWorkoutMode, finishWorkout, lastMode, startWorkout } from './workouts';

const input = {
	exerciseId: 'press-de-banca-plano',
	reps: 8,
	weight: 60,
	rir: null,
	type: 'normal' as const,
	note: null
};
const empuje = { routineId: 'empuje-a', title: 'Empuje A', mode: 'log' as const };
const at = (iso: string) => new Date(iso);
const openWorkouts = () => db.workouts.filter((w) => w.endedAt === null).toArray();

beforeEach(async () => {
	await db.workouts.clear();
	await db.sets.clear();
	await db.meta.clear();
});

describe('starting from a routine (spec: the workout is born with routine, copied name and mode)', () => {
	it('creates a pending workout with the routine, its name and the chosen mode', async () => {
		const workout = await startWorkout(empuje, at('2026-10-28T18:00:00Z'));

		expect(workout).toMatchObject({
			routineId: 'empuje-a',
			title: 'Empuje A',
			mode: 'log',
			startedAt: '2026-10-28T18:00:00.000Z',
			endedAt: null,
			userId: null,
			pending: 1
		});
		expect(await db.workouts.get(workout.id)).toEqual(workout);
	});

	it('attaches the routine to a free workout in progress instead of opening another', async () => {
		const set = await addSet(input, at('2026-10-28T18:00:00Z'));

		const workout = await startWorkout(empuje, at('2026-10-28T18:10:00Z'));

		expect(workout.id).toBe(set.workoutId);
		expect(workout).toMatchObject({
			routineId: 'empuje-a',
			title: 'Empuje A',
			mode: 'log',
			startedAt: '2026-10-28T18:00:00.000Z',
			updatedAt: '2026-10-28T18:10:00.000Z'
		});
		expect(await db.workouts.count()).toBe(1);
	});

	it('closes the previous routine workout at its last set and opens a new one', async () => {
		const first = await startWorkout(empuje, at('2026-10-28T18:00:00Z'));
		await addSet(input, at('2026-10-28T18:10:00Z'));

		const next = await startWorkout(
			{ ...empuje, routineId: 'tiron-a', title: 'Tirón A' },
			at('2026-10-29T09:00:00Z')
		);

		expect(next.id).not.toBe(first.id);
		expect(await db.workouts.get(first.id)).toMatchObject({
			endedAt: '2026-10-28T18:10:00.000Z',
			updatedAt: '2026-10-29T09:00:00.000Z',
			pending: 1
		});
		expect(await openWorkouts()).toEqual([next]);
	});

	it('closes a previous routine workout without sets at its start', async () => {
		const first = await startWorkout(empuje, at('2026-10-28T18:00:00Z'));

		await startWorkout(empuje, at('2026-10-28T18:30:00Z'));

		expect((await db.workouts.get(first.id))?.endedAt).toBe('2026-10-28T18:00:00.000Z');
	});

	it('does not attach to a free workout that went idle for 3 hours: closes it at its last set', async () => {
		const set = await addSet(input, at('2026-10-28T18:00:00Z'));

		const workout = await startWorkout(empuje, at('2026-10-28T21:00:00Z'));

		expect(workout.id).not.toBe(set.workoutId);
		expect((await db.workouts.get(set.workoutId))?.endedAt).toBe('2026-10-28T18:00:00.000Z');
		expect(await openWorkouts()).toHaveLength(1);
	});
});

describe('never two in progress (ADR-0006), even when another device brought an unfinished workout', () => {
	/** Como si hubieran bajado de otro dispositivo: dos entrenamientos sin hora de fin, ya sincronizados. */
	async function pulledUnfinishedPair() {
		const routine = {
			...attachRoutine(
				newWorkout(at('2026-10-28T18:00:00Z'), 'companion'),
				empuje,
				at('2026-10-28T18:00:00Z')
			),
			userId: 'u1',
			pending: 0 as const
		};
		const routineSet: WorkoutSet = {
			id: 'set-of-routine',
			userId: 'u1',
			workoutId: routine.id,
			...input,
			performedAt: '2026-10-28T18:10:00.000Z',
			createdAt: '2026-10-28T18:10:00.000Z',
			updatedAt: '2026-10-28T18:10:00.000Z',
			deletedAt: null,
			pending: 0
		};
		const free = {
			...newWorkout(at('2026-10-28T19:00:00Z'), 'companion'),
			userId: 'u1',
			pending: 0 as const
		};
		await db.workouts.bulkPut([routine, free]);
		await db.sets.put(routineSet);
		return { routine, free };
	}

	it('the newest one wins and the older closes at its last set, so the next set lands in one workout only', async () => {
		const { routine, free } = await pulledUnfinishedPair();

		const set = await addSet(input, at('2026-10-28T19:05:00Z'));

		expect(set.workoutId).toBe(free.id);
		expect(await db.workouts.get(routine.id)).toMatchObject({
			endedAt: '2026-10-28T18:10:00.000Z',
			updatedAt: '2026-10-28T19:05:00.000Z',
			pending: 1
		});
		expect(await openWorkouts()).toEqual([expect.objectContaining({ id: free.id })]);
	});

	it('does not let the older routine workout resurface once the free one went idle', async () => {
		const { routine, free } = await pulledUnfinishedPair();

		const set = await addSet(input, at('2026-10-28T23:00:00Z'));

		expect(set.workoutId).not.toBe(routine.id);
		expect(set.workoutId).not.toBe(free.id);
		expect(await openWorkouts()).toHaveLength(1);
	});
});

describe('finishing (ADR-0006: "Terminar" closes now; nothing is reopened)', () => {
	it('closes the workout in progress now, and the next set opens a new one', async () => {
		const set = await addSet(input, at('2026-10-28T18:00:00Z'));

		const finished = await finishWorkout(at('2026-10-28T18:05:00Z'));
		const later = await addSet(input, at('2026-10-28T18:06:00Z'));

		expect(finished).toMatchObject({
			id: set.workoutId,
			endedAt: '2026-10-28T18:05:00.000Z',
			updatedAt: '2026-10-28T18:05:00.000Z',
			pending: 1
		});
		expect(later.workoutId).not.toBe(set.workoutId);
		expect((await db.workouts.get(set.workoutId))?.endedAt).toBe('2026-10-28T18:05:00.000Z');
	});

	it('closes a routine workout however long ago its last set was', async () => {
		const workout = await startWorkout(empuje, at('2026-10-28T18:00:00Z'));

		const finished = await finishWorkout(at('2026-10-29T09:00:00Z'));

		expect(finished?.id).toBe(workout.id);
		expect(finished?.endedAt).toBe('2026-10-29T09:00:00.000Z');
	});

	it('does nothing when no workout is in progress', async () => {
		await addSet(input, at('2026-10-28T18:00:00Z'));

		expect(await finishWorkout(at('2026-10-28T21:00:00Z'))).toBeUndefined();
		expect(await finishWorkout(at('2026-10-28T21:01:00Z'))).toBeUndefined();
	});
});

describe('mode (spec: chosen when starting, remembered on the device, changeable mid-workout)', () => {
	it('is companion until something else is chosen, so the first free workout is in companion mode', async () => {
		expect(await lastMode()).toBe('companion');

		const set = await addSet(input, at('2026-10-28T18:00:00Z'));

		expect((await db.workouts.get(set.workoutId))?.mode).toBe('companion');
	});

	it('remembers the mode chosen when starting, and a later free workout is born with it', async () => {
		await startWorkout(empuje, at('2026-10-28T18:00:00Z'));
		await finishWorkout(at('2026-10-28T19:00:00Z'));

		const set = await addSet(input, at('2026-10-30T18:00:00Z'));

		expect(await lastMode()).toBe('log');
		expect((await db.workouts.get(set.workoutId))?.mode).toBe('log');
	});

	it('changes the mode of the workout in progress, marks it pending and remembers the choice', async () => {
		const set = await addSet(input, at('2026-10-28T18:00:00Z'));

		const changed = await changeWorkoutMode('log', at('2026-10-28T18:05:00Z'));

		expect(changed).toMatchObject({
			id: set.workoutId,
			mode: 'log',
			updatedAt: '2026-10-28T18:05:00.000Z',
			pending: 1
		});
		expect(await lastMode()).toBe('log');
	});

	it('only remembers the choice when nothing is in progress', async () => {
		expect(await changeWorkoutMode('log', at('2026-10-28T18:05:00Z'))).toBeUndefined();
		expect(await lastMode()).toBe('log');
	});
});
