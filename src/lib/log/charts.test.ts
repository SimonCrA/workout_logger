import { describe, expect, it } from 'vitest';
import {
	axisTicks,
	bodyWeightPoints,
	bodyWeightRange,
	dateFormats,
	exerciseChartViews,
	firstWorkoutStart,
	periodStart,
	pointsInPeriod,
	progressWeeks,
	valueAxisTicks,
	weeklyWorkSets,
	weeklyWorkouts,
	workoutPoints
} from './charts';
import { makeBodyWeight, makeSet } from './fixtures';
import { formatDayMonth, formatDayMonthYear, formatMonthYear } from './labels';
import { bodyWeightAt } from './profile-rules';
import type { WorkoutEntry } from './history';
import { newWorkout } from './rules';
import type { WorkoutSet } from './types';

// Fechas en hora local: las semanas van de lunes a domingo en el reloj del teléfono.
const local = (year: number, month: number, day: number, hour = 0, minute = 0) =>
	new Date(year, month - 1, day, hour, minute);

function set(
	partial: Partial<Omit<WorkoutSet, 'performedAt'>> & { exerciseId: string; performedAt: Date }
): WorkoutSet {
	const at = partial.performedAt.toISOString();
	return makeSet({ id: at + partial.exerciseId, ...partial, performedAt: at });
}

/** Un entrenamiento del historial que empezó con su primera serie. */
function entry(sets: WorkoutSet[]): WorkoutEntry {
	const workout = { ...newWorkout(new Date(sets[0].performedAt), 'log'), id: sets[0].workoutId };
	return { workout, sets };
}

describe('semanas de Progreso (spec #20: twelve calendar weeks, Monday to Sunday, local time)', () => {
	it('ends with the current week, from its Monday at midnight, and goes back twelve weeks in order', () => {
		// Sábado 31 de octubre de 2026.
		const weeks = progressWeeks(local(2026, 10, 31, 18));

		expect(weeks).toHaveLength(12);
		expect(weeks.at(-1)).toEqual({ from: local(2026, 10, 26), to: local(2026, 11, 2) });
		expect(weeks[0]).toEqual({ from: local(2026, 8, 10), to: local(2026, 8, 17) });
		for (let i = 1; i < weeks.length; i++) expect(weeks[i].from).toEqual(weeks[i - 1].to);
	});

	it('a Sunday night still belongs to the week that began the Monday before; a Monday at midnight starts a new one', () => {
		expect(progressWeeks(local(2026, 11, 1, 23, 59)).at(-1)?.from).toEqual(local(2026, 10, 26));
		expect(progressWeeks(local(2026, 11, 2)).at(-1)?.from).toEqual(local(2026, 11, 2));
	});

	it('keeps weeks on Mondays at midnight across a change of clock (spec #20: local time)', () => {
		// En Europa la hora cambia el último domingo de marzo y de octubre; en otras zonas, otro día.
		const spring = progressWeeks(local(2027, 4, 2, 12));
		const autumn = progressWeeks(local(2026, 11, 3, 12));

		for (const week of [...spring, ...autumn]) {
			expect(week.from.getDay()).toBe(1);
			expect(week.from.getHours()).toBe(0);
		}
	});

	it('crosses the change of year: the week from Monday 28 December to Sunday 3 January is one week', () => {
		const weeks = progressWeeks(local(2027, 1, 2, 10));

		expect(weeks.at(-1)).toEqual({ from: local(2026, 12, 28), to: local(2027, 1, 4) });
		expect(weeks.at(-2)).toEqual({ from: local(2026, 12, 21), to: local(2026, 12, 28) });
	});
});

describe('series de trabajo por semana (spec #20: Todos counts work sets; a muscle counts series por músculo)', () => {
	const now = local(2026, 10, 31, 18);
	const entries = [
		entry([
			// Lunes 26 de octubre, la semana actual. Press de banca: pecho, con tríceps y hombros secundarios.
			set({ exerciseId: 'press-de-banca-plano', performedAt: local(2026, 10, 26, 9) }),
			set({ exerciseId: 'press-de-banca-plano', performedAt: local(2026, 10, 26, 9, 5) }),
			set({
				exerciseId: 'press-de-banca-plano',
				performedAt: local(2026, 10, 26, 8, 55),
				type: 'warmup'
			}),
			// Curl con barra: bíceps, sin nada para el pecho.
			set({ exerciseId: 'curl-con-barra-recta', performedAt: local(2026, 10, 26, 9, 10) })
		]),
		entry([
			// Domingo 25 de octubre a última hora: la semana anterior.
			set({
				workoutId: 'w2',
				exerciseId: 'press-de-banca-plano',
				performedAt: local(2026, 10, 25, 23, 50)
			})
		])
	];

	it('with Todos, counts the work sets of each week, warm-ups out, and the weeks without sets at zero', () => {
		const points = weeklyWorkSets(entries, progressWeeks(now), null);

		expect(points).toHaveLength(12);
		expect(points.at(-1)).toEqual({ date: local(2026, 10, 26), value: 3 });
		expect(points.at(-2)).toEqual({ date: local(2026, 10, 19), value: 1 });
		expect(points.slice(0, -2).map((point) => point.value)).toEqual(Array(10).fill(0));
	});

	it('with a muscle, counts 1 for each work set where it is primary and 0.5 where it is secondary', () => {
		const weeks = progressWeeks(now);

		expect(weeklyWorkSets(entries, weeks, 'chest').at(-1)?.value).toBe(2);
		expect(weeklyWorkSets(entries, weeks, 'triceps').at(-1)?.value).toBe(1);
		expect(weeklyWorkSets(entries, weeks, 'biceps').at(-1)?.value).toBe(1);
		expect(weeklyWorkSets(entries, weeks, 'forearms').at(-1)?.value).toBe(0.5);
		expect(weeklyWorkSets(entries, weeks, 'chest').at(-2)?.value).toBe(1);
	});
});

describe('entrenamientos por semana (spec #20: the same twelve weeks)', () => {
	it('counts each workout in the week it started, even one that ended after midnight on Monday', () => {
		const now = local(2026, 10, 31, 18);
		const late = entry([
			set({
				workoutId: 'w1',
				exerciseId: 'sentadilla-con-barra',
				performedAt: local(2026, 10, 25, 23, 50)
			}),
			set({
				workoutId: 'w1',
				exerciseId: 'sentadilla-con-barra',
				performedAt: local(2026, 10, 26, 0, 10)
			})
		]);
		const monday = entry([
			set({
				workoutId: 'w2',
				exerciseId: 'sentadilla-con-barra',
				performedAt: local(2026, 10, 26, 18)
			})
		]);
		const friday = entry([
			set({
				workoutId: 'w3',
				exerciseId: 'sentadilla-con-barra',
				performedAt: local(2026, 10, 30, 18)
			})
		]);

		const points = weeklyWorkouts([friday, monday, late], progressWeeks(now));

		expect(points.at(-1)).toEqual({ date: local(2026, 10, 26), value: 2 });
		expect(points.at(-2)).toEqual({ date: local(2026, 10, 19), value: 1 });
		expect(points.reduce((sum, point) => sum + point.value, 0)).toBe(3);
	});
});

describe('gráfico del ejercicio (spec #20: one point per workout over its work sets)', () => {
	const bench = 'press-de-banca-plano';
	const sets = [
		// El segundo entrenamiento llega primero: los puntos salen por fecha.
		set({
			workoutId: 'w2',
			exerciseId: bench,
			performedAt: local(2026, 10, 30, 18),
			reps: 5,
			weight: 70
		}),
		set({
			workoutId: 'w2',
			exerciseId: bench,
			performedAt: local(2026, 10, 30, 18, 3),
			reps: 6,
			weight: 67.5,
			type: 'failure'
		}),
		set({
			workoutId: 'w1',
			exerciseId: bench,
			performedAt: local(2026, 10, 27, 17, 50),
			reps: 10,
			weight: 40,
			type: 'warmup'
		}),
		set({
			workoutId: 'w1',
			exerciseId: bench,
			performedAt: local(2026, 10, 27, 18),
			reps: 8,
			weight: 60
		}),
		set({
			workoutId: 'w1',
			exerciseId: bench,
			performedAt: local(2026, 10, 27, 18, 3),
			reps: 8,
			weight: 62.5
		}),
		// Solo calentamiento: ese entrenamiento no tiene punto.
		set({
			workoutId: 'w3',
			exerciseId: bench,
			performedAt: local(2026, 10, 31, 9),
			reps: 10,
			weight: 80,
			type: 'warmup'
		})
	];

	it('offers Peso máximo, 1RM estimado and Volumen with external load, and Fuerza relativa once there is a body weight (spec #29)', () => {
		expect(exerciseChartViews('external', false)).toEqual(['maxWeight', 'e1RM', 'volume']);
		expect(exerciseChartViews('external', true)).toEqual([
			'maxWeight',
			'e1RM',
			'relativeStrength',
			'volume'
		]);
	});

	it('with body weight or assistance, the kilo views and Fuerza relativa once there is a body weight; only Reps before (spec #27, #29)', () => {
		const all = ['maxWeight', 'e1RM', 'relativeStrength', 'volume'];
		expect(exerciseChartViews('bodyweight', true)).toEqual(all);
		expect(exerciseChartViews('assisted', true)).toEqual(all);
		expect(exerciseChartViews('bodyweight', false)).toEqual(['reps']);
		expect(exerciseChartViews('assisted', false)).toEqual(['reps']);
	});

	it('Peso máximo: the heaviest work set of each workout, dated at its first work set, oldest first', () => {
		expect(workoutPoints(sets, 'maxWeight')).toEqual([
			{ date: local(2026, 10, 27, 18), value: 62.5 },
			{ date: local(2026, 10, 30, 18), value: 70 }
		]);
	});

	it('dates each point at the start of its workout when known, so a workout begun on Sunday night stays on Sunday', () => {
		const startedAt = {
			w1: local(2026, 10, 27, 17, 45).toISOString(),
			w2: local(2026, 10, 29, 23, 50).toISOString()
		};

		expect(workoutPoints(sets, 'maxWeight', { startedAt }).map((point) => point.date)).toEqual([
			local(2026, 10, 27, 17, 45),
			local(2026, 10, 29, 23, 50)
		]);
	});

	it('Volumen: the sum of weight times reps of the work sets of each workout', () => {
		// 8 × 60 + 8 × 62,5 = 980; 5 × 70 + 6 × 67,5 = 755.
		expect(workoutPoints(sets, 'volume').map((point) => point.value)).toEqual([980, 755]);
	});

	it('1RM estimado: the best of the work sets of each workout (spec #28)', () => {
		// w1: 60 × 8 → 76, 62,5 × 8 → 79,17; w2: 70 × 5 → 81,67, 67,5 × 6 → 81. The warm-up never counts.
		expect(workoutPoints(sets, 'e1RM').map((point) => point.value)).toEqual([79.17, 81.67]);
	});

	it('1RM estimado: a workout with more than 10 reps efectivas in every set has no point', () => {
		const long = set({
			workoutId: 'w4',
			exerciseId: bench,
			performedAt: local(2026, 11, 1, 18),
			reps: 12,
			weight: 50
		});
		expect(workoutPoints([...sets, long], 'e1RM')).toHaveLength(2);
	});

	it('Fuerza relativa: the best of each workout, over the body weight of its date (spec #29)', () => {
		// 80 kg until 14 Oct, 75 kg from 15 Oct.
		const bodyWeight = bodyWeightAt([
			makeBodyWeight({ id: 'b1', date: '2026-10-01', kg: 80 }),
			makeBodyWeight({ id: 'b2', date: '2026-10-15', kg: 75 })
		]);
		const lifts = [
			// 100 × 5 → 116,67 kg at 80 kg → 1,46.
			set({
				workoutId: 'a',
				exerciseId: bench,
				performedAt: local(2026, 10, 10, 18),
				reps: 5,
				weight: 100
			}),
			// 95 × 5 → 110,83 kg at 75 kg → 1,48; 90 × 5 → 105 kg → 1,40.
			set({
				workoutId: 'b',
				exerciseId: bench,
				performedAt: local(2026, 10, 28, 18),
				reps: 5,
				weight: 95
			}),
			set({
				workoutId: 'b',
				exerciseId: bench,
				performedAt: local(2026, 10, 28, 18, 3),
				reps: 5,
				weight: 90
			})
		];
		expect(
			workoutPoints(lifts, 'relativeStrength', { bodyWeightAt: bodyWeight }).map((p) => p.value)
		).toEqual([1.46, 1.48]);
		expect(workoutPoints(lifts, 'relativeStrength')).toEqual([]);
	});

	it('Reps: the reps of the work sets of each workout', () => {
		expect(workoutPoints(sets, 'reps').map((point) => point.value)).toEqual([16, 11]);
	});

	it('without work sets there are no points', () => {
		expect(workoutPoints([], 'volume')).toEqual([]);
		expect(
			workoutPoints(
				sets.filter((s) => s.type === 'warmup'),
				'reps'
			)
		).toEqual([]);
	});
});

describe('puntos con peso efectivo (spec #27: body-weight and assisted charts use the body weight in force)', () => {
	const pullUps = 'dominadas';
	// 82 kg desde el 20 de octubre, 80 kg desde el 28.
	const bodyWeight = bodyWeightAt([
		makeBodyWeight({ id: 'b1', date: '2026-10-20', kg: 82 }),
		makeBodyWeight({ id: 'b2', date: '2026-10-28', kg: 80 })
	]);
	const sets = [
		set({
			workoutId: 'w1',
			exerciseId: pullUps,
			performedAt: local(2026, 10, 25, 18),
			reps: 8,
			weight: 0
		}),
		set({
			workoutId: 'w1',
			exerciseId: pullUps,
			performedAt: local(2026, 10, 25, 18, 3),
			reps: 5,
			weight: 10
		}),
		set({
			workoutId: 'w2',
			exerciseId: pullUps,
			performedAt: local(2026, 10, 30, 18),
			reps: 6,
			weight: 5
		})
	];

	it('Peso máximo: the heaviest effective weight of each workout', () => {
		const points = workoutPoints(sets, 'maxWeight', {
			loadMode: 'bodyweight',
			bodyWeightAt: bodyWeight
		});

		// 82 + 10 = 92 on the 25th; 80 + 5 = 85 on the 30th.
		expect(points.map((point) => point.value)).toEqual([92, 85]);
	});

	it('Volumen: effective weight times reps, assisted subtracting the assistance', () => {
		// 82 × 8 + 92 × 5 = 1116; 85 × 6 = 510.
		expect(
			workoutPoints(sets, 'volume', { loadMode: 'bodyweight', bodyWeightAt: bodyWeight }).map(
				(point) => point.value
			)
		).toEqual([1116, 510]);
		// 82 × 8 + 72 × 5 = 1016; 75 × 6 = 450.
		expect(
			workoutPoints(sets, 'volume', { loadMode: 'assisted', bodyWeightAt: bodyWeight }).map(
				(point) => point.value
			)
		).toEqual([1016, 450]);
	});

	it('without a body weight there are no kilo points, only reps', () => {
		expect(workoutPoints(sets, 'volume', { loadMode: 'bodyweight' })).toEqual([]);
		expect(
			workoutPoints(sets, 'reps', { loadMode: 'bodyweight' }).map((point) => point.value)
		).toEqual([13, 6]);
	});
});

describe('gráfico de peso corporal (spec #31: one point per live entry, by date)', () => {
	it('puts one point per entry at local midnight of its day, oldest first', () => {
		const points = bodyWeightPoints([
			makeBodyWeight({ id: 'b', date: '2026-10-30', kg: 79.5 }),
			makeBodyWeight({ id: 'a', date: '2026-10-02', kg: 81 }),
			makeBodyWeight({ id: 'c', date: '2026-11-01', kg: 80.2 })
		]);
		expect(points).toEqual([
			{ date: local(2026, 10, 2), value: 81 },
			{ date: local(2026, 10, 30), value: 79.5 },
			{ date: local(2026, 11, 1), value: 80.2 }
		]);
	});

	it('leaves deleted entries out and keeps the newest of a day duplicated by another device', () => {
		const points = bodyWeightPoints([
			makeBodyWeight({ id: 'gone', date: '2026-10-20', deletedAt: '2026-10-21T08:00:00.000Z' }),
			makeBodyWeight({
				id: 'old',
				date: '2026-10-28',
				kg: 82,
				updatedAt: '2026-10-28T07:00:00.000Z'
			}),
			makeBodyWeight({
				id: 'new',
				date: '2026-10-28',
				kg: 81.5,
				updatedAt: '2026-10-28T09:00:00.000Z'
			})
		]);
		expect(points).toEqual([{ date: local(2026, 10, 28), value: 81.5 }]);
	});

	it('has no points without entries', () => {
		expect(bodyWeightPoints([])).toEqual([]);
	});

	it('scales the axis to the entries with a kilo of margin, not from zero', () => {
		const points = bodyWeightPoints([
			makeBodyWeight({ id: 'a', date: '2026-10-02', kg: 81 }),
			makeBodyWeight({ id: 'b', date: '2026-10-30', kg: 79.5 })
		]);
		expect(bodyWeightRange(points)).toEqual([78.5, 82]);
		expect(bodyWeightRange(points.slice(0, 1))).toEqual([80, 82]);
		expect(bodyWeightRange([])).toBeUndefined();
	});
});

describe('periodos (spec #25: 12 semanas, 6 meses, 1 año y Todo, in calendar weeks)', () => {
	// Sábado 31 de octubre de 2026: la semana actual empezó el lunes 26.
	const now = local(2026, 10, 31, 18);

	it('starts each bounded period on a Monday at midnight, counting the current week: 12, 26 and 52 weeks', () => {
		expect(periodStart('12w', now)).toEqual(local(2026, 8, 10));
		expect(periodStart('6m', now)).toEqual(local(2026, 5, 4));
		expect(periodStart('1y', now)).toEqual(local(2025, 11, 3));
		expect(periodStart('all', now)).toBeNull();
	});

	it('the weeks of a period are its calendar weeks, oldest first, ending with the current one', () => {
		for (const [period, count] of [
			['12w', 12],
			['6m', 26],
			['1y', 52]
		] as const) {
			const weeks = progressWeeks(now, period);
			expect(weeks).toHaveLength(count);
			expect(weeks[0].from).toEqual(periodStart(period, now));
			expect(weeks.at(-1)).toEqual({ from: local(2026, 10, 26), to: local(2026, 11, 2) });
		}
		expect(progressWeeks(now)).toEqual(progressWeeks(now, '12w'));
	});

	it('a year of weeks crosses the change of year and the changes of clock without leaving Mondays', () => {
		const weeks = progressWeeks(local(2027, 1, 2, 10), '1y');

		expect(weeks).toHaveLength(52);
		expect(weeks.at(-1)).toEqual({ from: local(2026, 12, 28), to: local(2027, 1, 4) });
		for (let i = 1; i < weeks.length; i++) expect(weeks[i].from).toEqual(weeks[i - 1].to);
		for (const week of weeks) {
			expect(week.from.getDay()).toBe(1);
			expect(week.from.getHours()).toBe(0);
		}
	});

	it('Todo starts in the week of the first workout, even more than a year ago and across the change of year', () => {
		// Jueves 31 de diciembre de 2026: su semana empezó el lunes 28.
		const weeks = progressWeeks(local(2027, 1, 13, 9), 'all', local(2026, 12, 31, 20));

		expect(weeks.map((week) => week.from)).toEqual([
			local(2026, 12, 28),
			local(2027, 1, 4),
			local(2027, 1, 11)
		]);

		const long = progressWeeks(now, 'all', local(2025, 3, 5, 9));
		expect(long[0].from).toEqual(local(2025, 3, 3));
		expect(long.at(-1)?.from).toEqual(local(2026, 10, 26));
		expect(long).toHaveLength(87);
	});

	it('Todo without workouts, or with only this week, is the current week alone', () => {
		const current = [{ from: local(2026, 10, 26), to: local(2026, 11, 2) }];
		expect(progressWeeks(now, 'all')).toEqual(current);
		expect(progressWeeks(now, 'all', local(2026, 10, 27, 9))).toEqual(current);
		// Un entrenamiento fechado en el futuro (un reloj adelantado) no deja la semana actual fuera.
		expect(progressWeeks(now, 'all', local(2026, 11, 20))).toEqual(current);
	});

	it('the first workout is the one that started earliest, whatever the order of the entries', () => {
		const late = entry([
			set({ exerciseId: 'press-de-banca-plano', performedAt: local(2026, 10, 20, 9) })
		]);
		const early = entry([
			set({ exerciseId: 'sentadilla-con-barra', performedAt: local(2026, 3, 2, 9) })
		]);

		expect(firstWorkoutStart([late, early])).toEqual(local(2026, 3, 2, 9));
		expect(firstWorkoutStart([])).toBeUndefined();
	});

	it('keeps the points from the start of the period on, and all of them with Todo', () => {
		const points = [
			{ date: local(2026, 8, 9, 23, 59), value: 1 },
			{ date: local(2026, 8, 10), value: 2 },
			{ date: local(2026, 10, 30), value: 3 }
		];

		expect(pointsInPeriod(points, periodStart('12w', now))).toEqual(points.slice(1));
		expect(pointsInPeriod(points, periodStart('all', now))).toEqual(points);
		expect(pointsInPeriod(points, periodStart('1y', now))).toEqual(points);
	});

	it('cuts the body-weight points by date: an entry the day the period starts is in', () => {
		const points = bodyWeightPoints([
			makeBodyWeight({ id: 'a', date: '2026-08-09', kg: 82 }),
			makeBodyWeight({ id: 'b', date: '2026-08-10', kg: 81 }),
			makeBodyWeight({ id: 'c', date: '2026-10-31', kg: 80 })
		]);

		expect(pointsInPeriod(points, periodStart('12w', now)).map((point) => point.value)).toEqual([
			81, 80
		]);
	});
});

describe('eje de fechas (spec #25: the axis adapts so it does not overflow on a phone)', () => {
	const weekly = (count: number) =>
		progressWeeks(local(2026, 10, 31), count === 52 ? '1y' : count === 26 ? '6m' : '12w').map(
			(week) => week.from
		);

	it('labels every date while they fit', () => {
		const dates = weekly(12).slice(-5);
		expect(axisTicks(dates, formatDayMonth)).toEqual(dates);
	});

	it('labels a month once: two workouts in the same month on a long axis give one "oct 2026"', () => {
		const dates = [local(2026, 1, 5), local(2026, 10, 2), local(2026, 10, 20), local(2026, 11, 1)];

		expect(axisTicks(dates, formatMonthYear)).toEqual([dates[0], dates[1], dates[3]]);
	});

	it('with a year of weeks, labels at most six evenly spaced dates, always the latest', () => {
		const dates = weekly(52);
		const ticks = axisTicks(dates, formatDayMonth);

		expect(ticks.length).toBeLessThanOrEqual(6);
		expect(ticks.length).toBeGreaterThan(1);
		expect(ticks.at(-1)).toBe(dates.at(-1));
		const gaps = ticks.slice(1).map((tick, i) => dates.indexOf(tick) - dates.indexOf(ticks[i]));
		expect(new Set(gaps).size).toBe(1);
	});

	it('names months with their year once the dates span most of a year, and days otherwise', () => {
		const year = dateFormats(weekly(52));
		expect(year.axis(local(2026, 8, 10))).toBe(formatMonthYear(local(2026, 8, 10)));

		const weeks = dateFormats(weekly(12));
		expect(weeks.axis(local(2026, 8, 10))).toBe(formatDayMonth(local(2026, 8, 10)));
	});

	it('the tooltip carries the year only when the dates cross a change of year', () => {
		const sameYear = dateFormats([local(2026, 1, 5), local(2026, 12, 28)]);
		expect(sameYear.tooltip(local(2026, 12, 28))).toBe(formatDayMonth(local(2026, 12, 28)));

		const crossing = dateFormats([local(2026, 12, 28), local(2027, 1, 4)]);
		expect(crossing.tooltip(local(2026, 12, 28))).toBe(formatDayMonthYear(local(2026, 12, 28)));
		expect(dateFormats([]).tooltip(local(2026, 12, 28))).toBe(formatDayMonth(local(2026, 12, 28)));
	});
});

describe('the value axis ticks (to measure their labels: LayerChart rounds the range out to round ticks)', () => {
	it('rounds a weight up to round tens', () => {
		expect(valueAxisTicks([57.5, 62.5], undefined, 5)).toEqual([0, 10, 20, 30, 40, 50, 60, 70]);
	});

	it('uses steps of hundreds for a volume', () => {
		expect(valueAxisTicks([1500], undefined, 5)).toEqual([0, 500, 1000, 1500]);
	});

	it('follows a given range that does not start at zero', () => {
		expect(valueAxisTicks([80.4, 81.2], [79, 82], 5)).toEqual([79, 79.5, 80, 80.5, 81, 81.5, 82]);
	});

	it('does not fail without points', () => {
		expect(valueAxisTicks([], undefined, 5).length).toBeGreaterThan(0);
	});
});
