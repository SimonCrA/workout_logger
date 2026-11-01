import { describe, expect, it } from 'vitest';
import {
	exerciseChartViews,
	progressWeeks,
	weeklyWorkouts,
	weeklyWorkSets,
	workoutPoints
} from './charts';
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
	return {
		id: at + partial.exerciseId,
		userId: null,
		workoutId: 'w1',
		createdAt: at,
		updatedAt: at,
		deletedAt: null,
		pending: 1,
		reps: 8,
		weight: 60,
		rir: null,
		type: 'normal',
		note: null,
		...partial,
		performedAt: at
	};
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

	it('offers Peso máximo and Volumen with external load, and only Reps with body weight or assistance', () => {
		expect(exerciseChartViews('external')).toEqual(['maxWeight', 'volume']);
		expect(exerciseChartViews('bodyweight')).toEqual(['reps']);
		expect(exerciseChartViews('assisted')).toEqual(['reps']);
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

		expect(workoutPoints(sets, 'maxWeight', startedAt).map((point) => point.date)).toEqual([
			local(2026, 10, 27, 17, 45),
			local(2026, 10, 29, 23, 50)
		]);
	});

	it('Volumen: the sum of weight times reps of the work sets of each workout', () => {
		// 8 × 60 + 8 × 62,5 = 980; 5 × 70 + 6 × 67,5 = 755.
		expect(workoutPoints(sets, 'volume').map((point) => point.value)).toEqual([980, 755]);
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
