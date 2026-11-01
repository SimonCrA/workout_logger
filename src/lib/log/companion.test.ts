import { describe, expect, it } from 'vitest';
import { elapsedSeconds, restReached, restSeconds, suggestedRest } from './companion';

const press = {
	exerciseId: 'press-de-banca-plano',
	sets: 3,
	repsMin: 5,
	repsMax: 8,
	rir: null,
	rest: 150
};
const curl = { exerciseId: 'curl-con-barra', sets: 3, repsMin: 8, repsMax: 12, rir: 2, rest: null };

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

describe('suggested rest in Hoy (the rest the routine prescribes for the exercise of the last set)', () => {
	it('takes the rest of the routine entry for that exercise', () => {
		expect(suggestedRest([press, curl], 'press-de-banca-plano')).toBe(150);
	});

	it('is nothing when the routine has no rest for it, or does not include it', () => {
		expect(suggestedRest([press, curl], 'curl-con-barra')).toBeNull();
		expect(suggestedRest([press, curl], 'sentadilla')).toBeNull();
		expect(suggestedRest([], 'press-de-banca-plano')).toBeNull();
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
