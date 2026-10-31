import { describe, expect, it } from 'vitest';
import { objectiveLabel, restLabel } from './index';

describe('objectiveLabel', () => {
	it('reads sets by reps range, as the spec writes it', () => {
		expect(objectiveLabel({ sets: 3, repsMin: 8, repsMax: 12 })).toBe('3 × 8–12');
	});

	it('collapses a range of one value into a single number', () => {
		expect(objectiveLabel({ sets: 4, repsMin: 10, repsMax: 10 })).toBe('4 × 10');
	});
});

describe('restLabel', () => {
	it('reads the suggested rest in seconds', () => {
		expect(restLabel(150)).toBe('150 s');
	});
});
