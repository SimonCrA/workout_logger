import { describe, expect, it } from 'vitest';
import {
	exerciseChartViews,
	progressWeeks,
	weeklyWorkouts,
	weeklyWorkSets,
	workoutPoints
} from './charts';
import { makeBodyWeight, makeSet } from './fixtures';
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
