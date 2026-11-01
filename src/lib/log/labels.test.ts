import { describe, expect, it } from 'vitest';
import {
	formatElapsed,
	formatKg,
	formatRest,
	formatTime,
	formatWeight,
	lastDoneLabel,
	lastTimeLine,
	modeLabel,
	setCountLabel,
	workoutTitle
} from './labels';
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

describe('last done label in Mis rutinas (spec #15: "Última vez hace N días" or "Nunca")', () => {
	// Fechas en hora local, para que el test no dependa de la zona horaria de la máquina.
	const now = new Date(2026, 9, 31, 19, 0);

	it('says "Nunca" for a routine never done', () => {
		expect(lastDoneLabel(null, now)).toBe('Nunca');
	});

	it('counts local calendar days: today, yesterday even minutes before midnight, and N days', () => {
		expect(lastDoneLabel(new Date(2026, 9, 31, 8, 0).toISOString(), now)).toBe('Última vez hoy');
		expect(lastDoneLabel(new Date(2026, 9, 30, 23, 50).toISOString(), now)).toBe('Última vez ayer');
		expect(lastDoneLabel(new Date(2026, 9, 28, 23, 50).toISOString(), now)).toBe(
			'Última vez hace 3 días'
		);
		expect(lastDoneLabel(new Date(2026, 8, 1, 10, 0).toISOString(), now)).toBe(
			'Última vez hace 60 días'
		);
	});
});

describe('lines of the routine exercises in Hoy (spec #15: the last time line, the added sets)', () => {
	const set = (weight: number, performedAt: string) => ({
		id: performedAt,
		userId: null,
		workoutId: 'w1',
		exerciseId: 'press-de-banca-plano',
		reps: 8,
		weight,
		rir: null,
		type: 'normal' as const,
		note: null,
		performedAt,
		createdAt: performedAt,
		updatedAt: performedAt,
		deletedAt: null,
		pending: 0 as const
	});

	it('reads the last time as its date and its sets, weight by load mode × reps', () => {
		const day = new Date(2026, 9, 28, 18, 0).toISOString();

		expect(lastTimeLine([set(60, day), set(62.5, day)], 'external')).toBe(
			'Última vez (28 oct 2026): 60 kg × 8, 62,5 kg × 8'
		);
		expect(lastTimeLine([set(5, day)], 'bodyweight')).toBe('Última vez (28 oct 2026): +5 kg × 8');
	});

	it('counts sets in Spanish', () => {
		expect(setCountLabel(1)).toBe('1 serie');
		expect(setCountLabel(3)).toBe('3 series');
	});
});

describe('durations with companion (spec #16: the rest counter and the elapsed time in the header)', () => {
	it('reads the rest as minutes and two-digit seconds, with hours only past one hour', () => {
		expect(formatRest(0)).toBe('0:00');
		expect(formatRest(5)).toBe('0:05');
		expect(formatRest(92)).toBe('1:32');
		expect(formatRest(3665)).toBe('1:01:05');
	});

	it('reads the elapsed time in minutes, and in hours and minutes past one hour', () => {
		expect(formatElapsed(0)).toBe('0 min');
		expect(formatElapsed(2850)).toBe('47 min');
		expect(formatElapsed(3600)).toBe('1 h');
		expect(formatElapsed(4320)).toBe('1 h 12 min');
	});
});
