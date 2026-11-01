import { describe, expect, it } from 'vitest';
import {
	attachRoutine,
	changeMode,
	closeWorkout,
	editSet,
	isWorkoutOpen,
	lastActivity,
	newWorkout,
	nextSetMode,
	openWorkout,
	newStartProblem,
	setChanges,
	setFieldValues,
	shiftWorkout,
	softDelete,
	startedBeforeToday,
	type UnfinishedWorkout
} from './rules';
import { makeSet } from './fixtures';
import type { WorkoutSet } from './types';

const started = new Date('2026-10-28T18:00:00Z');
const lastSet = '2026-10-28T18:00:00.000Z';
const empuje = { routineId: 'empuje-a', title: 'Empuje A', mode: 'log' as const };

const free: UnfinishedWorkout = {
	workout: newWorkout(started, 'companion'),
	lastSetAt: lastSet
};
const withRoutine: UnfinishedWorkout = {
	workout: attachRoutine(free.workout, empuje, started),
	lastSetAt: lastSet
};

describe('last activity of an unfinished workout (its last set, or its start while it has none)', () => {
	it('is the last set when there is one, and the start otherwise', () => {
		expect(lastActivity(free)).toBe(lastSet);
		expect(lastActivity({ workout: free.workout, lastSetAt: null })).toBe(
			'2026-10-28T18:00:00.000Z'
		);
	});
});

describe('en curso (ADR-0006: a routine workout only ends by hand; a free one after 3 hours idle)', () => {
	it('keeps a free workout open while its last set is less than 3 hours old', () => {
		expect(isWorkoutOpen(free, new Date('2026-10-28T20:59:00Z'))).toBe(true);
	});

	it('closes a free workout once 3 hours have passed without sets', () => {
		expect(isWorkoutOpen(free, new Date('2026-10-28T21:00:00Z'))).toBe(false);
		expect(isWorkoutOpen(free, new Date('2026-10-29T09:00:00Z'))).toBe(false);
	});

	it('counts a free workout without sets from its start', () => {
		const empty = { workout: free.workout, lastSetAt: null };

		expect(isWorkoutOpen(empty, new Date('2026-10-28T20:59:00Z'))).toBe(true);
		expect(isWorkoutOpen(empty, new Date('2026-10-28T21:00:00Z'))).toBe(false);
	});

	it('keeps a workout started from a routine open however long it has been idle', () => {
		expect(isWorkoutOpen(withRoutine, new Date('2026-10-28T21:00:00Z'))).toBe(true);
		expect(isWorkoutOpen(withRoutine, new Date('2026-10-29T09:00:00Z'))).toBe(true);
		expect(isWorkoutOpen(withRoutine, new Date('2026-11-04T09:00:00Z'))).toBe(true);
	});
});

describe('new and changed workouts (spec: routine, copied title and mode are data of the workout)', () => {
	it('creates an anonymous, pending free workout in the given mode with the sync columns of ADR-0001', () => {
		const workout = newWorkout(started, 'log');

		expect(workout).toMatchObject({
			userId: null,
			routineId: null,
			title: null,
			mode: 'log',
			startedAt: '2026-10-28T18:00:00.000Z',
			endedAt: null,
			createdAt: '2026-10-28T18:00:00.000Z',
			updatedAt: '2026-10-28T18:00:00.000Z',
			deletedAt: null,
			pending: 1
		});
		expect(workout.id).toMatch(/^[0-9a-f-]{36}$/);
	});

	it('attaches a routine, its name and the chosen mode to a workout, marking it pending', () => {
		const synced = { ...newWorkout(started, 'companion'), pending: 0 as const };

		const attached = attachRoutine(synced, empuje, new Date('2026-10-28T18:30:00Z'));

		expect(attached).toMatchObject({
			id: synced.id,
			routineId: 'empuje-a',
			title: 'Empuje A',
			mode: 'log',
			startedAt: synced.startedAt,
			updatedAt: '2026-10-28T18:30:00.000Z',
			pending: 1
		});
	});

	it('changes the mode mid-workout, marking it pending', () => {
		const synced = { ...newWorkout(started, 'companion'), pending: 0 as const };

		const changed = changeMode(synced, 'log', new Date('2026-10-28T18:30:00Z'));

		expect(changed).toMatchObject({
			mode: 'log',
			updatedAt: '2026-10-28T18:30:00.000Z',
			pending: 1
		});
	});

	it('closes a workout at the given moment (its last set, or now when finished by hand) and marks it pending', () => {
		const synced = { ...newWorkout(started, 'companion'), pending: 0 as const };

		const closed = closeWorkout(synced, new Date(lastSet), new Date('2026-10-29T09:00:00Z'));

		expect(closed.endedAt).toBe('2026-10-28T18:00:00.000Z');
		expect(closed.updatedAt).toBe('2026-10-29T09:00:00.000Z');
		expect(closed.pending).toBe(1);
	});
});

describe('openWorkout (GLOSSARY: the only unfinished workout that is still in progress)', () => {
	it('is the unfinished workout while it is in progress', () => {
		expect(openWorkout(free, new Date('2026-10-28T20:30:00Z'))).toBe(free.workout);
		expect(openWorkout(withRoutine, new Date('2026-11-04T09:00:00Z'))).toBe(withRoutine.workout);
	});

	it('is nothing once a free workout went idle for 3 hours, or when no workout is unfinished', () => {
		expect(openWorkout(free, new Date('2026-10-28T22:00:00Z'))).toBeUndefined();
		expect(openWorkout(undefined, new Date('2026-10-28T18:30:00Z'))).toBeUndefined();
		expect(openWorkout(null, new Date('2026-10-28T18:30:00Z'))).toBeUndefined();
	});
});

describe('the mode of the next set (spec #16: the one in progress decides; without one, the last chosen)', () => {
	const inLog: UnfinishedWorkout = {
		workout: { ...free.workout, mode: 'log' },
		lastSetAt: lastSet
	};

	it('is the mode of the workout in progress, whatever was chosen last', () => {
		expect(nextSetMode(inLog, 'companion', new Date('2026-10-28T18:30:00Z'))).toBe('log');
		expect(nextSetMode(free, 'log', new Date('2026-10-28T18:30:00Z'))).toBe('companion');
	});

	it('is the last mode chosen when nothing is in progress: the free workout will be born with it', () => {
		expect(nextSetMode(null, 'log', new Date('2026-10-28T18:30:00Z'))).toBe('log');
		expect(nextSetMode(free, 'log', new Date('2026-10-28T22:00:00Z'))).toBe('log');
	});
});

describe('startedBeforeToday (spec: Hoy warns when the open workout started on an earlier local date)', () => {
	// Fechas construidas en hora local, para que el test no dependa de la zona horaria de la máquina.
	const lateYesterday = new Date(2026, 9, 30, 23, 30);
	const earlyToday = new Date(2026, 9, 31, 0, 10);
	const laterToday = new Date(2026, 9, 31, 19, 0);

	it('is true when the workout started on an earlier local day, even minutes before midnight', () => {
		expect(startedBeforeToday(lateYesterday.toISOString(), earlyToday)).toBe(true);
	});

	it('is false when it started today, however many hours ago', () => {
		expect(startedBeforeToday(earlyToday.toISOString(), laterToday)).toBe(false);
	});
});

describe('correcting the past (spec #18: any set is edited or deleted; everything is a soft delete, ADR-0001)', () => {
	const synced = { ...newWorkout(started, 'companion'), pending: 0 as const };
	const set: WorkoutSet = makeSet({
		id: 's1',
		userId: 'u1',
		workoutId: synced.id,
		performedAt: '2026-10-28T18:05:00.000Z',
		pending: 0
	});
	const later = new Date('2026-10-29T09:00:00Z');

	it('edits reps, weight, RIR, type and note of a set, keeping its place, and marks it pending', () => {
		const edited = editSet(
			set,
			{ reps: 6, weight: 65, rir: 2, type: 'failure', note: 'última al fallo' },
			later
		);

		expect(edited).toEqual({
			...set,
			reps: 6,
			weight: 65,
			rir: 2,
			type: 'failure',
			note: 'última al fallo',
			updatedAt: '2026-10-29T09:00:00.000Z',
			pending: 1
		});
	});

	it('soft-deletes any synced row: it stays, marked deleted now and pending', () => {
		expect(softDelete(set, later)).toEqual({
			...set,
			deletedAt: '2026-10-29T09:00:00.000Z',
			updatedAt: '2026-10-29T09:00:00.000Z',
			pending: 1
		});
		expect(softDelete(synced, later)).toMatchObject({
			deletedAt: '2026-10-29T09:00:00.000Z',
			pending: 1
		});
	});
});

describe('moving a workout (ADR-0006: the start is corrected after and the sets move with it)', () => {
	// Empezó a las 23:30, con una serie antes y otra después de medianoche, y terminó a las 00:20.
	const overMidnight = {
		...newWorkout(new Date('2026-10-30T23:30:00Z'), 'companion'),
		endedAt: '2026-10-31T00:20:00.000Z',
		pending: 0 as const
	};
	const sets: WorkoutSet[] = [
		makeSet({
			id: 'before',
			userId: 'u1',
			workoutId: overMidnight.id,
			performedAt: '2026-10-30T23:40:00.000Z',
			pending: 0
		}),
		makeSet({
			id: 'after',
			userId: 'u1',
			workoutId: overMidnight.id,
			performedAt: '2026-10-31T00:10:30.500Z',
			pending: 0
		})
	];
	const now = new Date('2026-10-31T10:00:00Z');

	it('moves start, end and every set by the same difference, even across days, and marks them pending', () => {
		const moved = shiftWorkout(overMidnight, sets, new Date('2026-10-29T23:30:00Z'), now);

		expect(moved.workout).toEqual({
			...overMidnight,
			startedAt: '2026-10-29T23:30:00.000Z',
			endedAt: '2026-10-30T00:20:00.000Z',
			updatedAt: '2026-10-31T10:00:00.000Z',
			pending: 1
		});
		expect(moved.sets).toEqual([
			{
				...sets[0],
				performedAt: '2026-10-29T23:40:00.000Z',
				updatedAt: '2026-10-31T10:00:00.000Z',
				pending: 1
			},
			{
				...sets[1],
				performedAt: '2026-10-30T00:10:30.500Z',
				updatedAt: '2026-10-31T10:00:00.000Z',
				pending: 1
			}
		]);
	});

	it('keeps a workout in progress without an end, and moves forward as well as back', () => {
		const unfinished = { ...overMidnight, endedAt: null };

		const moved = shiftWorkout(unfinished, [sets[0]], new Date('2026-10-31T00:00:00Z'), now);

		expect(moved.workout.startedAt).toBe('2026-10-31T00:00:00.000Z');
		expect(moved.workout.endedAt).toBeNull();
		expect(moved.sets.map((s) => s.performedAt)).toEqual(['2026-10-31T00:10:00.000Z']);
	});

	it('moves a workout without sets on its own', () => {
		const moved = shiftWorkout(overMidnight, [], new Date('2026-10-30T18:00:00Z'), now);

		expect(moved.workout.startedAt).toBe('2026-10-30T18:00:00.000Z');
		expect(moved.workout.endedAt).toBe('2026-10-30T18:50:00.000Z');
		expect(moved.sets).toEqual([]);
	});
});

describe('what a new start may be (spec #18: a date and time, with nothing of the workout in the future)', () => {
	const now = new Date('2026-10-31T10:00:00Z');
	const hour = 60 * 60 * 1000;

	it('accepts a past moment, even one that ends a minute ago', () => {
		expect(newStartProblem(new Date('2026-10-30T18:00:00Z'), 0, now)).toBeNull();
		expect(newStartProblem(new Date('2026-10-31T08:59:00Z'), hour, now)).toBeNull();
	});

	it('rejects an empty or unreadable field and a start after now', () => {
		expect(newStartProblem(new Date(Number.NaN), 0, now)).toBe('Elige una fecha y una hora.');
		expect(newStartProblem(new Date('2026-10-31T10:01:00Z'), 0, now)).toBe(
			'Un entrenamiento no puede empezar en el futuro.'
		);
	});

	it('rejects a start whose end (or last set) would land in the future', () => {
		expect(newStartProblem(new Date('2026-10-31T09:30:00Z'), hour, now)).toBe(
			'Así acabaría en el futuro: elige una hora anterior.'
		);
	});
});

describe('the fields of a set (spec #18: the same controls when registering and when correcting)', () => {
	it('reads a set into the fields, RIR and note as the controls hold them', () => {
		expect(setFieldValues({ reps: 8, weight: 60, rir: null, type: 'normal', note: null })).toEqual({
			reps: 8,
			weight: 60,
			rir: '',
			type: 'normal',
			note: ''
		});
		expect(
			setFieldValues({ reps: 6, weight: 65, rir: 2, type: 'failure', note: 'pesada' })
		).toEqual({ reps: 6, weight: 65, rir: '2', type: 'failure', note: 'pesada' });
	});

	it('turns the fields back into a set: no RIR and a blank note are nothing, and the note is trimmed', () => {
		expect(setChanges({ reps: 8, weight: 60, rir: '', type: 'normal', note: '   ' })).toEqual({
			reps: 8,
			weight: 60,
			rir: null,
			type: 'normal',
			note: null
		});
		expect(
			setChanges({ reps: 6, weight: 65, rir: '0', type: 'drop', note: ' última al fallo ' })
		).toEqual({ reps: 6, weight: 65, rir: 0, type: 'drop', note: 'última al fallo' });
	});
});
