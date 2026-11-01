import { describe, expect, it } from 'vitest';
import {
	attachRoutine,
	changeMode,
	closeWorkout,
	isWorkoutOpen,
	lastActivity,
	newWorkout,
	openWorkout,
	startedBeforeToday,
	type UnfinishedWorkout
} from './rules';

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
