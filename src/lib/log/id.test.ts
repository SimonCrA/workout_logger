import { describe, expect, it } from 'vitest';
import { uuidv7 } from './id';

describe('uuidv7', () => {
	it('produces a well-formed version 7 UUID', () => {
		expect(uuidv7()).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
		);
	});

	it('sorts by the time it was generated', () => {
		const earlier = uuidv7(Date.UTC(2026, 9, 28, 10, 0, 0));
		const later = uuidv7(Date.UTC(2026, 9, 28, 10, 0, 1));

		expect(earlier < later).toBe(true);
	});

	it('never repeats', () => {
		const ids = new Set(Array.from({ length: 1000 }, () => uuidv7()));

		expect(ids.size).toBe(1000);
	});
});
