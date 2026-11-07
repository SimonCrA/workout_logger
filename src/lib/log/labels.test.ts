import { describe, expect, it } from 'vitest';
import {
	bandLabel,
	formatCount,
	formatDay,
	formatDayMonth,
	formatElapsed,
	formatKg,
	formatRest,
	formatTime,
	formatWeight,
	lastDoneLabel,
	lastTimeLine,
	modeLabel,
	monthLabel,
	recordNotice,
	relativeDayLabel,
	setCountLabel,
	workoutModeLine,
	workoutSummaryLabel,
	toDatetimeLocal,
	dayInitial,
	daySetsLabel,
	weekDeltaLabel,
	weekdayLabel,
	workoutTitle,
	differenceLabel
} from './labels';
import { makeSet } from './fixtures';
import { newWorkout } from './rules';

describe('kilos as read in Spanish', () => {
	it('uses a decimal comma, a thousands dot from five digits and at most two decimals', () => {
		expect(formatKg(57.5)).toBe('57,5 kg');
		expect(formatKg(1225)).toBe('1225 kg');
		expect(formatKg(12000)).toBe('12.000 kg');
		expect(formatKg(61.254)).toBe('61,25 kg');
	});

	it('reads counts the same way, half series included', () => {
		expect(formatCount(2.5)).toBe('2,5');
		expect(formatCount(12000)).toBe('12.000');
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
	const set = (weight: number, performedAt: string) =>
		makeSet({ id: performedAt, weight, performedAt, pending: 0 });

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

describe('history row labels (spec #17: "Hoy", "Ayer" or weekday and date; month separators; "N ejercicios · M series")', () => {
	// Fechas en hora local, para que el test no dependa de la zona horaria de la máquina.
	const now = new Date(2026, 9, 31, 19, 0);

	it('says "Hoy" and "Ayer" by local calendar day, and otherwise the weekday with the date', () => {
		expect(relativeDayLabel(new Date(2026, 9, 31, 0, 10).toISOString(), now)).toBe('Hoy');
		expect(relativeDayLabel(new Date(2026, 9, 30, 23, 50).toISOString(), now)).toBe('Ayer');
		expect(relativeDayLabel(new Date(2026, 9, 28, 18, 5).toISOString(), now)).toBe(
			'Miércoles, 28 oct'
		);
		expect(relativeDayLabel(new Date(2026, 0, 1, 18, 5).toISOString(), now)).toBe('Jueves, 1 ene');
	});

	it('names a month separator by month and year', () => {
		expect(monthLabel('2026-10')).toBe('Octubre de 2026');
		expect(monthLabel('2025-01')).toBe('Enero de 2025');
	});

	it('summarises a workout as exercises and sets', () => {
		expect(workoutSummaryLabel(5, 16)).toBe('5 ejercicios · 16 series');
		expect(workoutSummaryLabel(1, 1)).toBe('1 ejercicio · 1 serie');
	});

	it('reads the mode of a workout with its duration only when there is one', () => {
		expect(workoutModeLine('companion', 2850)).toBe('Acompañamiento · 47 min');
		expect(workoutModeLine('log', null)).toBe('Solo registrar');
	});
});

describe('the start of a workout as a datetime-local field reads it (spec #18: "Cambiar fecha")', () => {
	it('writes the local date and time to the minute, as the field wants it', () => {
		// Construida en hora local, para que el test no dependa de la zona horaria de la máquina.
		const iso = new Date(2026, 9, 30, 18, 5, 42).toISOString();

		expect(toDatetimeLocal(iso)).toBe('2026-10-30T18:05');
	});

	it('pads single-digit months, days, hours and minutes', () => {
		expect(toDatetimeLocal(new Date(2026, 0, 2, 3, 4).toISOString())).toBe('2026-01-02T03:04');
	});
});

describe('the dashboard lines (spec #19: each week number against the 7 days before; "Músculos en banda: n de m")', () => {
	it('says how far each number of the week went from the 7 days before', () => {
		expect(weekDeltaLabel(62, 58)).toBe('+4 vs antes');
		expect(weekDeltaLabel(540, 610)).toBe('−70 vs antes');
		expect(weekDeltaLabel(12500, 0)).toBe('+12.500 vs antes');
		expect(weekDeltaLabel(3, 3)).toBe('Igual que antes');
	});

	it('names each day of the strip by its initial, and reads it out with its sets', () => {
		expect([2, 3, 4, 5, 6, 7, 8].map((day) => dayInitial(new Date(2026, 10, day)))).toEqual([
			'L',
			'M',
			'X',
			'J',
			'V',
			'S',
			'D'
		]);
		expect(daySetsLabel(new Date(2026, 10, 3), 12)).toBe('Martes, 3 nov: 12 series');
		expect(daySetsLabel(new Date(2026, 10, 3), 0)).toBe('Martes, 3 nov: 0 series');
	});

	it('reads the date under the Hoy title with its weekday', () => {
		expect(weekdayLabel(new Date(2026, 10, 3, 9))).toBe('Martes, 3 nov');
	});

	it('counts the muscles in band out of those with exercises', () => {
		expect(bandLabel({ inBand: 3, of: 16 })).toBe('Músculos en banda: 3 de 16');
	});
});

describe('chart axis dates (spec #20: the date of the workout or the Monday of the week)', () => {
	it('reads a local day as day and short month, the year out', () => {
		expect(formatDayMonth(new Date(2026, 9, 26, 23, 30))).toBe('26 oct');
		expect(formatDayMonth(new Date(2027, 0, 4))).toBe('4 ene');
	});
});

describe('a local day without time, as Perfil shows body weight entries', () => {
	it('reads the day as written, whatever the time zone', () => {
		expect(formatDay('2026-11-02')).toBe('2 nov 2026');
		expect(formatDay('2026-01-01')).toBe('1 ene 2026');
	});
});

describe('recordNotice (spec #25: "Récord: 1RM estimado 92,5 kg", one notice naming every measure)', () => {
	it('names a single record with its value', () => {
		expect(recordNotice([{ measure: 'e1RM', kg: 92.5 }])).toBe('Récord: 1RM estimado 92,5 kg');
	});

	it('names several records in one sentence, reps with the weight they were done at', () => {
		expect(
			recordNotice([
				{ measure: 'maxWeight', kg: 100 },
				{ measure: 'e1RM', kg: 116.67 },
				{ measure: 'repsAtWeight', reps: 5, kg: 100 }
			])
		).toBe('Récord: peso máximo 100 kg, 1RM estimado 116,67 kg y 5 reps con 100 kg');
	});
});

describe('differences against the previous session (Indicadores: "Esta vez frente a la anterior")', () => {
	it('signs kilos and counts, and says "Igual" when there is no change', () => {
		expect(differenceLabel(67.5, 'kg')).toBe('+67,5 kg');
		expect(differenceLabel(-3.17, 'kg')).toBe('−3,17 kg');
		expect(differenceLabel(2, 'count')).toBe('+2');
		expect(differenceLabel(0, 'count')).toBe('Igual');
	});
});
