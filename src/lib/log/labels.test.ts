import { describe, expect, it } from 'vitest';
import { formatKg, formatTime, formatWeight, modeLabel, workoutTitle } from './labels';
import { newWorkout } from './rules';

describe('kilos as read in Spanish', () => {
	it('uses a decimal comma, a thousands dot from five digits and at most two decimals', () => {
		expect(formatKg(57.5)).toBe('57,5 kg');
		expect(formatKg(1225)).toBe('1225 kg');
		expect(formatKg(12000)).toBe('12.000 kg');
		expect(formatKg(61.254)).toBe('61,25 kg');
	});

	it('signs the weight by load mode: external as is, additional with +, assistance with −', () => {
		expect(formatWeight(60, 'external')).toBe('60 kg');
		expect(formatWeight(5, 'bodyweight')).toBe('+5 kg');
		expect(formatWeight(20, 'assisted')).toBe('−20 kg');
	});
});

describe('workout header labels (spec: "Libre" or the copied name, the start time, the mode)', () => {
	const free = newWorkout(new Date('2026-10-28T18:05:00Z'), 'companion');

	it('calls a workout without routine "Libre" and one with routine by its copied name', () => {
		expect(workoutTitle(free)).toBe('Libre');
		expect(workoutTitle({ ...free, title: 'Empuje A' })).toBe('Empuje A');
	});

	it('names the modes as the glossary does', () => {
		expect(modeLabel.companion).toBe('Acompañamiento');
		expect(modeLabel.log).toBe('Solo registrar');
	});

	it('formats a time of day as hours and minutes in local time', () => {
		const local = new Date(2026, 9, 28, 18, 5);

		expect(formatTime(local.toISOString())).toBe('18:05');
	});
});
