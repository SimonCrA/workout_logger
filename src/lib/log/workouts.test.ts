import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';
import { attachRoutine, newWorkout, routineStart } from './rules';
import { addSet, deleteLastSet } from './sets';
import type { WorkoutSet } from './types';
import { createRoutine, deleteRoutine } from './routines';
import {
	changeWorkoutMode,
	deleteWorkout,
	finishWorkout,
	lastMode,
	moveWorkout,
	startWorkout,
	todayLog,
	workoutEntry,
	workoutHistory
} from './workouts';

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
	await db.routines.clear();
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

describe('what Hoy observes during the workout (spec #15: routine, its sets, last time per routine exercise)', () => {
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
	const curl = { ...input, exerciseId: 'curl-con-barra' };

	it('is empty when nothing is unfinished', async () => {
		expect(await todayLog()).toEqual({ unfinished: null, routine: null, sets: [], lastTimes: {} });
	});

	it('gives the unfinished workout, its routine, its live sets and the last time of each routine exercise', async () => {
		const routine = await createRoutine(
			{ name: 'Empuje A', baseRoutineId: null, exercises: [press, aperturas] },
			at('2026-10-27T10:00:00Z')
		);
		const start = routineStart(routine, 'companion');
		await startWorkout(start, at('2026-10-28T18:00:00Z'));
		const before = [
			await addSet(input, at('2026-10-28T18:05:00Z')),
			await addSet({ ...input, weight: 62.5 }, at('2026-10-28T18:10:00Z'))
		];
		await finishWorkout(at('2026-10-28T19:00:00Z'));
		const workout = await startWorkout(start, at('2026-10-30T18:00:00Z'));
		const today = [
			await addSet(input, at('2026-10-30T18:05:00Z')),
			await addSet(curl, at('2026-10-30T18:15:00Z'))
		];
		await deleteLastSet('curl-con-barra', at('2026-10-30T18:16:00Z'));
		const kept = await addSet(curl, at('2026-10-30T18:17:00Z'));

		const log = await todayLog();

		expect(log.unfinished?.workout.id).toBe(workout.id);
		expect(log.unfinished?.lastSetAt).toBe('2026-10-30T18:17:00.000Z');
		expect(log.routine).toEqual(routine);
		expect(log.sets).toEqual([today[0], kept]);
		expect(log.lastTimes).toEqual({
			'press-de-banca-plano': before,
			'aperturas-con-mancuernas': []
		});
	});

	it('knows a workout just started has no last set yet', async () => {
		await startWorkout(empuje, at('2026-10-30T18:00:00Z'));

		expect((await todayLog()).unfinished?.lastSetAt).toBeNull();
	});

	it('keeps guiding by a routine deleted mid-workout: the workout was started from it', async () => {
		const routine = await createRoutine(
			{ name: 'Empuje A', baseRoutineId: null, exercises: [press] },
			at('2026-10-27T10:00:00Z')
		);
		await startWorkout(routineStart(routine, 'log'), at('2026-10-30T18:00:00Z'));
		await deleteRoutine(routine.id, at('2026-10-30T18:30:00Z'));

		expect((await todayLog()).routine).toMatchObject({ id: routine.id, exercises: [press] });
	});

	it('has no routine for a free workout, only its sets', async () => {
		const set = await addSet(input, at('2026-10-30T18:00:00Z'));

		const log = await todayLog();

		expect(log.unfinished?.workout.id).toBe(set.workoutId);
		expect(log.routine).toBeNull();
		expect(log.sets).toEqual([set]);
		expect(log.lastTimes).toEqual({});
	});
});

describe('what Historial reads (spec #17: live workouts with live sets, newest first, each with its sets)', () => {
	it('lists finished and unfinished workouts that have live sets, newest first, with their sets in order', async () => {
		const first = await startWorkout(empuje, at('2026-10-28T18:00:00Z'));
		const a = await addSet(input, at('2026-10-28T18:05:00Z'));
		const b = await addSet({ ...input, weight: 62.5 }, at('2026-10-28T18:10:00Z'));
		await finishWorkout(at('2026-10-28T18:47:00Z'));
		const c = await addSet(input, at('2026-10-30T09:00:00Z'));

		const history = await workoutHistory();

		expect(history.map((entry) => entry.workout.id)).toEqual([c.workoutId, first.id]);
		expect(history[0].sets).toEqual([c]);
		expect(history[1].sets).toEqual([a, b]);
		expect(history[1].workout.endedAt).toBe('2026-10-28T18:47:00.000Z');
	});

	it('hides a workout without sets, one whose sets were all deleted, and a deleted one', async () => {
		await addSet(input, at('2026-10-28T18:00:00Z'));
		await deleteLastSet(input.exerciseId, at('2026-10-28T18:01:00Z'));
		const started = await startWorkout(empuje, at('2026-10-29T18:00:00Z'));
		const kept = await addSet(input, at('2026-10-29T18:05:00Z'));
		await finishWorkout(at('2026-10-29T18:30:00Z'));
		await db.workouts.update(started.id, { deletedAt: '2026-10-29T19:00:00.000Z' });
		await startWorkout(empuje, at('2026-10-30T18:00:00Z'));

		expect(await workoutHistory()).toEqual([]);
		expect(await workoutEntry(kept.workoutId)).toBeUndefined();
	});

	it('opens one workout with its live sets, and nothing for an unknown id', async () => {
		const workout = await startWorkout(empuje, at('2026-10-28T18:00:00Z'));
		const a = await addSet(input, at('2026-10-28T18:05:00Z'));
		await addSet(input, at('2026-10-28T18:10:00Z'));
		await deleteLastSet(input.exerciseId, at('2026-10-28T18:11:00Z'));

		expect(await workoutEntry(workout.id)).toEqual({ workout, sets: [a] });
		expect(await workoutEntry('no-existe')).toBeUndefined();
	});
});

describe('deleting a workout (spec #18: whole, with its sets, from its detail; soft, ADR-0001)', () => {
	it('deletes the workout and its live sets, all marked deleted now and pending, and Historial forgets it', async () => {
		const workout = await startWorkout(empuje, at('2026-10-28T18:00:00Z'));
		const kept = await addSet(input, at('2026-10-28T18:05:00Z'));
		const gone = await addSet(input, at('2026-10-28T18:10:00Z'));
		await deleteLastSet(input.exerciseId, at('2026-10-28T18:11:00Z'));
		await finishWorkout(at('2026-10-28T18:30:00Z'));

		const deleted = await deleteWorkout(workout.id, at('2026-10-29T09:00:00Z'));

		expect(deleted).toMatchObject({
			id: workout.id,
			deletedAt: '2026-10-29T09:00:00.000Z',
			updatedAt: '2026-10-29T09:00:00.000Z',
			pending: 1
		});
		expect(await db.sets.get(kept.id)).toMatchObject({
			deletedAt: '2026-10-29T09:00:00.000Z',
			updatedAt: '2026-10-29T09:00:00.000Z',
			pending: 1
		});
		// La serie borrada antes conserva su propia hora de borrado.
		expect(await db.sets.get(gone.id)).toMatchObject({ deletedAt: '2026-10-28T18:11:00.000Z' });
		expect(await workoutHistory()).toEqual([]);
		expect(await workoutEntry(workout.id)).toBeUndefined();
	});

	it('deleting the workout in progress leaves nothing in progress: the next set opens a new one', async () => {
		const set = await addSet(input, at('2026-10-28T18:00:00Z'));

		await deleteWorkout(set.workoutId, at('2026-10-28T18:05:00Z'));

		expect(await todayLog()).toEqual({ unfinished: null, routine: null, sets: [], lastTimes: {} });
		expect((await addSet(input, at('2026-10-28T18:06:00Z'))).workoutId).not.toBe(set.workoutId);
	});

	it('does nothing for a workout that does not exist or was already deleted', async () => {
		const workout = await startWorkout(empuje, at('2026-10-28T18:00:00Z'));
		await deleteWorkout(workout.id, at('2026-10-28T18:05:00Z'));

		expect(await deleteWorkout(workout.id, at('2026-10-29T09:00:00Z'))).toBeUndefined();
		expect(await deleteWorkout('no-existe', at('2026-10-29T09:00:00Z'))).toBeUndefined();
		expect((await db.workouts.get(workout.id))?.deletedAt).toBe('2026-10-28T18:05:00.000Z');
	});
});

describe('moving a workout (ADR-0006: the start is corrected after and its sets move with it)', () => {
	it('moves a finished workout and its live sets to the new start, and Historial reorders by it', async () => {
		const earlier = await addSet(input, at('2026-10-27T18:00:00Z'));
		const workout = await startWorkout(empuje, at('2026-10-28T18:00:00Z'));
		const a = await addSet(input, at('2026-10-28T18:05:00Z'));
		const b = await addSet({ ...input, weight: 62.5 }, at('2026-10-28T18:10:00Z'));
		await deleteLastSet(input.exerciseId, at('2026-10-28T18:11:00Z'));
		await finishWorkout(at('2026-10-28T18:30:00Z'));

		// Se registró a la mañana siguiente lo de la víspera: un día atrás.
		const moved = await moveWorkout(
			workout.id,
			at('2026-10-27T17:00:00Z'),
			at('2026-10-29T09:00:00Z')
		);

		expect(moved?.workout).toMatchObject({
			id: workout.id,
			startedAt: '2026-10-27T17:00:00.000Z',
			endedAt: '2026-10-27T17:30:00.000Z',
			updatedAt: '2026-10-29T09:00:00.000Z',
			pending: 1
		});
		expect(moved?.sets).toEqual([
			{
				...a,
				performedAt: '2026-10-27T17:05:00.000Z',
				updatedAt: '2026-10-29T09:00:00.000Z',
				pending: 1
			}
		]);
		expect(await db.workouts.get(workout.id)).toEqual(moved?.workout);
		expect(await db.sets.get(a.id)).toEqual(moved?.sets[0]);
		// La serie borrada no se mueve: ya no cuenta.
		expect(await db.sets.get(b.id)).toMatchObject({ performedAt: '2026-10-28T18:10:00.000Z' });
		expect((await workoutHistory()).map((entry) => entry.workout.id)).toEqual([
			earlier.workoutId,
			workout.id
		]);
	});

	it('moves the workout in progress, which stays without an end', async () => {
		const workout = await startWorkout(empuje, at('2026-10-28T18:00:00Z'));
		await addSet(input, at('2026-10-28T18:05:00Z'));

		const moved = await moveWorkout(
			workout.id,
			at('2026-10-28T17:00:00Z'),
			at('2026-10-28T18:10:00Z')
		);

		expect(moved?.workout.endedAt).toBeNull();
		expect(moved?.sets.map((s) => s.performedAt)).toEqual(['2026-10-28T17:05:00.000Z']);
		expect((await todayLog()).unfinished).toEqual({
			workout: moved?.workout,
			lastSetAt: '2026-10-28T17:05:00.000Z'
		});
	});

	it('does nothing for a workout that does not exist, was deleted, or is already at that start', async () => {
		const workout = await startWorkout(empuje, at('2026-10-28T18:00:00Z'));
		await addSet(input, at('2026-10-28T18:05:00Z'));

		expect(
			await moveWorkout(workout.id, at('2026-10-28T18:00:00Z'), at('2026-10-29T09:00:00Z'))
		).toBeUndefined();
		expect(await db.sets.toArray()).toEqual([
			expect.objectContaining({ updatedAt: '2026-10-28T18:05:00.000Z' })
		]);
		await deleteWorkout(workout.id, at('2026-10-29T09:00:00Z'));
		expect(
			await moveWorkout(workout.id, at('2026-10-27T18:00:00Z'), at('2026-10-29T09:01:00Z'))
		).toBeUndefined();
		expect(
			await moveWorkout('no-existe', at('2026-10-27T18:00:00Z'), at('2026-10-29T09:01:00Z'))
		).toBeUndefined();
	});
});
