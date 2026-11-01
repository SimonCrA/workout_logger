import { describe, expect, it } from 'vitest';
import { exerciseCountLabel, objectiveLabel, prescriptionLabel, restLabel } from './index';

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

describe('prescriptionLabel', () => {
	it('joins objective, RIR and rest with middle dots', () => {
		expect(
			prescriptionLabel({ exerciseId: 'x', sets: 3, repsMin: 8, repsMax: 12, rir: 2, rest: 90 })
		).toBe('3 × 8–12 · RIR 2 · 90 s');
	});

	it('leaves out RIR and rest when the routine does not prescribe them', () => {
		expect(
			prescriptionLabel({ exerciseId: 'x', sets: 3, repsMin: 5, repsMax: 8, rir: null, rest: 150 })
		).toBe('3 × 5–8 · 150 s');
		expect(
			prescriptionLabel({ exerciseId: 'x', sets: 3, repsMin: 5, repsMax: 8, rir: null, rest: null })
		).toBe('3 × 5–8');
	});
});

describe('exerciseCountLabel (Mis rutinas shows how many exercises a routine has)', () => {
	it('reads naturally for none, one and several', () => {
		expect(exerciseCountLabel(0)).toBe('Sin ejercicios');
		expect(exerciseCountLabel(1)).toBe('1 ejercicio');
		expect(exerciseCountLabel(6)).toBe('6 ejercicios');
	});
});
