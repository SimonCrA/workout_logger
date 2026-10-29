import { describe, expect, it } from 'vitest';
import { closeWorkout, currentWorkoutId, isWorkoutOpen, newWorkout } from './rules';

describe('free workout per day (spec: open while sets arrive, closed after 3 hours idle)', () => {
	const lastSet = new Date('2026-10-28T18:00:00Z');

	it('stays open while the last set is less than 3 hours old', () => {
		expect(isWorkoutOpen(lastSet, new Date('2026-10-28T20:59:00Z'))).toBe(true);
	});

	it('is closed once 3 hours have passed without sets', () => {
		expect(isWorkoutOpen(lastSet, new Date('2026-10-28T21:00:00Z'))).toBe(false);
		expect(isWorkoutOpen(lastSet, new Date('2026-10-29T09:00:00Z'))).toBe(false);
	});

	it('creates an anonymous, pending workout with the sync columns of ADR-0001', () => {
		const workout = newWorkout(new Date('2026-10-28T18:00:00Z'));

		expect(workout).toMatchObject({
			userId: null,
			startedAt: '2026-10-28T18:00:00.000Z',
			endedAt: null,
			createdAt: '2026-10-28T18:00:00.000Z',
			updatedAt: '2026-10-28T18:00:00.000Z',
			deletedAt: null,
			pending: 1
		});
		expect(workout.id).toMatch(/^[0-9a-f-]{36}$/);
	});

	it('closes a workout at its last activity and marks it pending again', () => {
		const workout = { ...newWorkout(new Date('2026-10-28T18:00:00Z')), pending: 0 as const };

		const closed = closeWorkout(workout, lastSet, new Date('2026-10-29T09:00:00Z'));

		expect(closed.endedAt).toBe('2026-10-28T18:00:00.000Z');
		expect(closed.updatedAt).toBe('2026-10-29T09:00:00.000Z');
		expect(closed.pending).toBe(1);
	});
});

describe('currentWorkoutId', () => {
	const open = {
		workout: newWorkout(new Date('2026-10-28T18:00:00Z')),
		lastActivity: '2026-10-28T19:00:00Z'
	};

	it('is the open workout while its last set is recent', () => {
		expect(currentWorkoutId(open, new Date('2026-10-28T21:30:00Z'))).toBe(open.workout.id);
	});

	it('is nothing once 3 hours passed, or when no workout is open', () => {
		expect(currentWorkoutId(open, new Date('2026-10-28T22:00:00Z'))).toBeUndefined();
		expect(currentWorkoutId(undefined, new Date('2026-10-28T18:30:00Z'))).toBeUndefined();
	});
});
