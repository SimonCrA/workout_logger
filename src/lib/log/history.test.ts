import { describe, expect, it } from 'vitest';
import { entryEnd, groupByMonth, historyEntries, historyRow, type WorkoutEntry } from './history';
import { attachRoutine, newWorkout } from './rules';
import type { Workout, WorkoutSet } from './types';

const empuje = { routineId: 'empuje-a', title: 'Empuje A', mode: 'companion' as const };

/** Un entrenamiento empezado a esa hora local; terminado si se da el fin. */
function workout(startedAt: Date, partial: Partial<Workout> = {}): Workout {
	return { ...newWorkout(startedAt, 'companion'), ...partial };
}

function set(
	partial: Partial<WorkoutSet> & { workoutId: string; performedAt: string }
): WorkoutSet {
	return {
		id: partial.performedAt + partial.workoutId,
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

describe('what Historial lists (spec #17: live workouts with at least one live set, most recent first)', () => {
	const older = workout(new Date('2026-10-26T18:00:00Z'), { id: 'older' });
	const newer = workout(new Date('2026-10-28T18:00:00Z'), { id: 'newer' });
	const empty = workout(new Date('2026-10-29T18:00:00Z'), { id: 'empty' });
	const deleted = workout(new Date('2026-10-30T18:00:00Z'), {
		id: 'deleted',
		deletedAt: '2026-10-30T19:00:00Z'
	});
	const sets = [
		set({ workoutId: 'newer', performedAt: '2026-10-28T18:10:00Z' }),
		set({ workoutId: 'older', performedAt: '2026-10-26T18:05:00Z' }),
		set({ workoutId: 'newer', performedAt: '2026-10-28T18:05:00Z' }),
		set({ workoutId: 'deleted', performedAt: '2026-10-30T18:05:00Z' }),
		set({
			workoutId: 'empty',
			performedAt: '2026-10-29T18:05:00Z',
			deletedAt: '2026-10-29T18:06:00Z'
		})
	];

	it('orders by start, newest first, each with its live sets in time order', () => {
		expect(historyEntries([older, empty, deleted, newer], sets)).toEqual([
			{ workout: newer, sets: [sets[2], sets[0]] },
			{ workout: older, sets: [sets[1]] }
		]);
	});

	it('hides deleted workouts and those whose only sets were deleted', () => {
		const ids = historyEntries([older, empty, deleted, newer], sets).map((e) => e.workout.id);

		expect(ids).not.toContain('deleted');
		expect(ids).not.toContain('empty');
	});

	it('is empty without workouts', () => {
		expect(historyEntries([], [])).toEqual([]);
	});
});

describe('the row of a workout (spec #17: name or "Libre", duration only with companion, exercises and all sets)', () => {
	const started = new Date('2026-10-28T18:00:00Z');
	const sets = [
		set({ workoutId: 'w', performedAt: '2026-10-28T18:05:00Z', type: 'warmup' }),
		set({ workoutId: 'w', performedAt: '2026-10-28T18:10:00Z' }),
		set({ workoutId: 'w', performedAt: '2026-10-28T18:20:00Z', exerciseId: 'aperturas' }),
		set({ workoutId: 'w', performedAt: '2026-10-28T18:30:00Z' })
	];

	it('counts distinct exercises and every logged set, warm-ups included, and measures a finished companion workout', () => {
		const finished = attachRoutine(
			workout(started, { id: 'w', endedAt: '2026-10-28T18:47:00.000Z' }),
			empuje,
			started
		);

		expect(historyRow({ workout: finished, sets })).toEqual({
			workout: finished,
			exercises: 2,
			sets: 4,
			duration: 2820
		});
	});

	it('measures an unfinished workout up to its last set, and a solo registrar one not at all', () => {
		const unfinished = workout(started, { id: 'w' });
		const logged = workout(started, { id: 'w', mode: 'log', endedAt: '2026-10-28T18:47:00Z' });

		expect(historyRow({ workout: unfinished, sets }).duration).toBe(1800);
		expect(historyRow({ workout: logged, sets }).duration).toBeNull();
	});
});

describe('month separators (spec #17: the list is split by the local month the workout started in)', () => {
	// Fechas en hora local, para que el test no dependa de la zona horaria de la máquina.
	const entry = (id: string, started: Date): WorkoutEntry => ({
		workout: workout(started, { id }),
		sets: [set({ workoutId: id, performedAt: started.toISOString() })]
	});
	const lateOctober = entry('oct-31', new Date(2026, 9, 31, 23, 50));
	const earlyOctober = entry('oct-1', new Date(2026, 9, 1, 0, 10));
	const november = entry('nov', new Date(2026, 10, 1, 0, 10));
	const january = entry('jan', new Date(2026, 0, 15, 12, 0));

	it('groups consecutive entries by month, newest month first, keyed by year and month', () => {
		expect(groupByMonth([november, lateOctober, earlyOctober, january])).toEqual([
			{ month: '2026-11', entries: [november] },
			{ month: '2026-10', entries: [lateOctober, earlyOctober] },
			{ month: '2026-01', entries: [january] }
		]);
	});

	it('has no groups without entries', () => {
		expect(groupByMonth([])).toEqual([]);
	});
});

describe('where a workout ends (spec #18: how far a move may go without landing in the future)', () => {
	const started = workout(new Date('2026-10-28T18:00:00Z'), { id: 'w' });
	const sets = [
		set({ workoutId: 'w', performedAt: '2026-10-28T18:05:00.000Z' }),
		set({ workoutId: 'w', performedAt: '2026-10-28T18:40:00.000Z' })
	];

	it('is its end when finished, its last set while unfinished, and its start with nothing yet', () => {
		expect(entryEnd({ workout: { ...started, endedAt: '2026-10-28T19:00:00.000Z' }, sets })).toBe(
			'2026-10-28T19:00:00.000Z'
		);
		expect(entryEnd({ workout: started, sets })).toBe('2026-10-28T18:40:00.000Z');
		expect(entryEnd({ workout: started, sets: [] })).toBe('2026-10-28T18:00:00.000Z');
	});
});
