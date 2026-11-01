import { describe, expect, it } from 'vitest';
import { elapsedSeconds, hasTimes, restReached, restSeconds, restStart } from './companion';
import { attachRoutine, newWorkout } from './rules';

const started = new Date('2026-10-31T18:00:00Z');
const lastSet = '2026-10-31T18:20:00.000Z';
const free = newWorkout(started, 'companion');
const empuje = { routineId: 'empuje-a', title: 'Empuje A', mode: 'companion' as const };

describe('descanso since the last set (spec #16: a counter from the last set of the workout, any exercise)', () => {
	it('counts whole seconds since the last set, rounding down', () => {
		expect(restSeconds('2026-10-31T18:00:00.000Z', new Date('2026-10-31T18:01:32.900Z'))).toBe(92);
		expect(restSeconds('2026-10-31T18:00:00.000Z', new Date('2026-10-31T18:00:00.400Z'))).toBe(0);
	});

	it('never goes negative when the last set is in the future (another device, a skewed clock)', () => {
		expect(restSeconds('2026-10-31T18:05:00.000Z', new Date('2026-10-31T18:00:00.000Z'))).toBe(0);
	});
});

describe('rest reached (spec #16: the counter changes colour on reaching the suggested rest)', () => {
	it('is reached once the rest equals or passes the suggested seconds', () => {
		expect(restReached(89, 90)).toBe(false);
		expect(restReached(90, 90)).toBe(true);
		expect(restReached(300, 90)).toBe(true);
	});

	it('is never reached without a suggested rest: the counter just counts', () => {
		expect(restReached(300, null)).toBe(false);
	});
});

describe('times only with companion (ADR-0006: in solo registrar the hours mean nothing)', () => {
	it('shows times with companion and none in solo registrar', () => {
		expect(hasTimes('companion')).toBe(true);
		expect(hasTimes('log')).toBe(false);
	});
});

describe('when the rest counter runs (spec #16: from the last set of the workout in progress, with companion)', () => {
	const now = new Date('2026-10-31T18:21:00Z');

	it('runs from the last set of a workout in progress with companion', () => {
		expect(restStart({ workout: free, lastSetAt: lastSet }, now)).toBe(lastSet);
		expect(
			restStart({ workout: attachRoutine(free, empuje, started), lastSetAt: lastSet }, now)
		).toBe(lastSet);
	});

	it('does not run in solo registrar, nor before the first set', () => {
		expect(restStart({ workout: { ...free, mode: 'log' }, lastSetAt: lastSet }, now)).toBeNull();
		expect(restStart({ workout: free, lastSetAt: null }, now)).toBeNull();
	});

	it('does not run without a workout in progress: none unfinished, or a free one idle for 3 hours', () => {
		expect(restStart(null, now)).toBeNull();
		expect(restStart(undefined, now)).toBeNull();
		expect(
			restStart({ workout: free, lastSetAt: lastSet }, new Date('2026-10-31T21:20:00Z'))
		).toBeNull();
	});
});

describe('tiempo transcurrido (spec #16: the Hoy header shows the time since the start, with companion)', () => {
	it('counts whole seconds since the start, never negative', () => {
		expect(elapsedSeconds('2026-10-31T18:00:00.000Z', new Date('2026-10-31T18:47:30.500Z'))).toBe(
			2850
		);
		expect(elapsedSeconds('2026-10-31T18:00:00.000Z', new Date('2026-10-31T17:59:00.000Z'))).toBe(
			0
		);
	});
});
