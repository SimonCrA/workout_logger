import { describe, expect, it } from 'vitest';
import { muscles } from '#lib/catalog/index.js';
import {
	dailySets,
	dashboard,
	heatIntensity,
	lastSevenDays,
	musclesToWork,
	previousSevenDays,
	setsPerMuscle,
	toWorkCards,
	weekSummary
} from './dashboard';
import type { WorkoutEntry } from './history';
import { newWorkout } from './rules';
import { makeSet } from './fixtures';
import type { WorkoutSet } from './types';

function set(
	partial: Partial<WorkoutSet> & { exerciseId: string; performedAt: string }
): WorkoutSet {
	return makeSet({ id: partial.performedAt + partial.exerciseId, ...partial });
}

const now = new Date('2026-10-31T18:00:00Z');

describe('series por músculo (spec #19: work sets of the last 7 days, 1 per primary and 0.5 per secondary)', () => {
	it('adds 1 to the primary muscle and 0.5 to each secondary per work set, every muscle of the map present', () => {
		const sets = [
			// Press de banca: pecho, con tríceps y hombros secundarios. El calentamiento no cuenta.
			set({ exerciseId: 'press-de-banca-plano', performedAt: '2026-10-30T18:00:00Z' }),
			set({
				exerciseId: 'press-de-banca-plano',
				performedAt: '2026-10-30T18:05:00Z',
				type: 'failure'
			}),
			set({
				exerciseId: 'press-de-banca-plano',
				performedAt: '2026-10-30T17:50:00Z',
				type: 'warmup'
			}),
			// Curl con barra: bíceps, con antebrazos secundario.
			set({ exerciseId: 'curl-con-barra-recta', performedAt: '2026-10-29T18:00:00Z' })
		];

		const perMuscle = setsPerMuscle(sets, lastSevenDays(now));

		expect(perMuscle).toMatchObject({
			chest: 2,
			triceps: 1,
			shoulders: 1,
			biceps: 1,
			forearms: 0.5,
			dorsals: 0
		});
		expect(Object.keys(perMuscle)).toHaveLength(16);
	});

	it('takes the sets from 7 days ago inclusive, and whatever comes after now; the 7 days before are the other window', () => {
		const sets = [
			set({ exerciseId: 'press-de-banca-plano', performedAt: '2026-10-24T18:00:00.000Z' }),
			set({ exerciseId: 'press-de-banca-plano', performedAt: '2026-10-24T17:59:59.999Z' }),
			set({ exerciseId: 'press-de-banca-plano', performedAt: '2026-10-17T18:00:00.000Z' }),
			set({ exerciseId: 'press-de-banca-plano', performedAt: '2026-10-17T17:59:59.999Z' }),
			// De otro dispositivo con el reloj adelantado: sigue siendo reciente.
			set({ exerciseId: 'press-de-banca-plano', performedAt: '2026-10-31T18:00:01Z' })
		];

		expect(setsPerMuscle(sets, lastSevenDays(now)).chest).toBe(2);
		expect(setsPerMuscle(sets, previousSevenDays(now)).chest).toBe(2);
	});

	it('ignores a set of an exercise the catalog does not have', () => {
		const sets = [set({ exerciseId: 'ya-no-existe', performedAt: '2026-10-30T18:00:00Z' })];

		expect(Object.values(setsPerMuscle(sets, lastSevenDays(now)))).toEqual(Array(16).fill(0));
	});
});

/** Una entrada del historial: un entrenamiento empezado a esa hora con sus series. */
function entry(id: string, startedAt: string, sets: WorkoutSet[]): WorkoutEntry {
	return {
		workout: { ...newWorkout(new Date(startedAt), 'companion'), id },
		sets: sets.map((set) => ({ ...set, workoutId: id }))
	};
}

describe('the "Últimos 7 días" card (spec #19: workouts with a set, work sets and reps, each against the 7 days before; muscles in band)', () => {
	const press = (performedAt: string, partial: Partial<WorkoutSet> = {}) =>
		set({ exerciseId: 'press-de-banca-plano', performedAt, ...partial });

	it('counts this week and the one before, and says whether each number went up, down or stayed', () => {
		const entries = [
			// Esta semana: dos series de trabajo y un calentamiento; una serie de curl; un entrenamiento con solo calentamiento.
			entry('a', '2026-10-30T18:00:00Z', [
				press('2026-10-30T17:50:00Z', { type: 'warmup', reps: 15, weight: 20 }),
				press('2026-10-30T18:00:00Z'),
				press('2026-10-30T18:05:00Z', { type: 'failure' })
			]),
			entry('b', '2026-10-28T18:00:00Z', [
				set({ exerciseId: 'curl-con-barra-recta', performedAt: '2026-10-28T18:00:00Z', reps: 10 })
			]),
			entry('c', '2026-10-25T10:00:00Z', [
				press('2026-10-25T10:00:00Z', { type: 'warmup', reps: 15, weight: 20 })
			]),
			// La semana anterior: un entrenamiento de cuatro series y las mismas 26 reps.
			entry('d', '2026-10-20T18:00:00Z', [
				press('2026-10-20T18:00:00Z'),
				press('2026-10-20T18:05:00Z'),
				press('2026-10-20T18:10:00Z', { reps: 5 }),
				press('2026-10-20T18:15:00Z', { reps: 5 })
			]),
			// Hace tres semanas: fuera de las dos ventanas.
			entry('e', '2026-10-10T18:00:00Z', [press('2026-10-10T18:00:00Z')])
		];

		const card = weekSummary(entries, now);

		expect(card.current).toEqual({ workouts: 3, sets: 3, reps: 26 });
		expect(card.previous).toEqual({ workouts: 1, sets: 4, reps: 26 });
		expect(card.trends).toEqual({ workouts: 'up', sets: 'down', reps: 'same' });
	});

	it('is all zeros and "same" with nothing logged', () => {
		expect(weekSummary([], now)).toMatchObject({
			current: { workouts: 0, sets: 0, reps: 0 },
			previous: { workouts: 0, sets: 0, reps: 0 },
			trends: { workouts: 'same', sets: 'same', reps: 'same' }
		});
	});

	it('counts the muscles that reach 10 series por músculo this week, secondaries included, out of those with exercises', () => {
		const tenPress = Array.from({ length: 10 }, (_, i) =>
			press(`2026-10-30T18:${String(i).padStart(2, '0')}:00Z`)
		);
		// Nueve de curl dejan el bíceps en 9; dos dominadas, donde es secundario, lo suben a 10.
		const nineCurls = Array.from({ length: 9 }, (_, i) =>
			set({
				exerciseId: 'curl-con-barra-recta',
				performedAt: `2026-10-29T18:${String(i * 5).padStart(2, '0')}:00Z`
			})
		);
		const twoPullUps = [
			set({ exerciseId: 'dominadas', performedAt: '2026-10-28T18:00:00Z' }),
			set({ exerciseId: 'dominadas', performedAt: '2026-10-28T18:05:00Z' })
		];

		const card = weekSummary(
			[entry('a', '2026-10-28T18:00:00Z', [...tenPress, ...nineCurls, ...twoPullUps])],
			now
		);

		expect(card.band).toEqual({ inBand: 2, of: 16 });
	});
});

describe('"Menos trabajados" and the heat tone (spec #19: muscles with exercises under maintenance; linear fill from 0 to 20 series, saturated past it)', () => {
	it('lists the muscles with exercises under 6 series por músculo, the most neglected first, ties in catalog order', () => {
		const perMuscle = {
			...Object.fromEntries(muscles.map((muscle) => [muscle.code, 7])),
			chest: 6,
			biceps: 5.5,
			triceps: 2,
			dorsals: 0,
			neck: 0
		};

		expect(musclesToWork(perMuscle).map((muscle) => muscle.name)).toEqual([
			'Dorsales',
			'Cuello',
			'Tríceps',
			'Bíceps'
		]);
	});

	it('names every muscle of the map when nothing was logged', () => {
		expect(musclesToWork(setsPerMuscle([], lastSevenDays(now)))).toHaveLength(16);
	});

	it('gives each muscle to work its series por músculo and the share of maintenance it has', () => {
		const perMuscle = {
			...Object.fromEntries(muscles.map((muscle) => [muscle.code, 7])),
			triceps: 4.5,
			dorsals: 0
		};

		expect(
			toWorkCards(perMuscle).map(({ muscle, sets, progress }) => [muscle.name, sets, progress])
		).toEqual([
			['Dorsales', 0, 0],
			['Tríceps', 4.5, 0.75]
		]);
	});

	it('goes from the base at 0 to the darkest tone at 20 and stays there', () => {
		expect(heatIntensity(0)).toBe(0);
		expect(heatIntensity(6)).toBe(0.3);
		expect(heatIntensity(10)).toBe(0.5);
		expect(heatIntensity(20)).toBe(1);
		expect(heatIntensity(27.5)).toBe(1);
	});
});

describe('the last workout of the dashboard (Hoy shows the one in progress apart)', () => {
	const entry = (id: string, startedAt: string): WorkoutEntry => ({
		workout: { ...newWorkout(new Date(startedAt), 'log'), id },
		sets: [set({ exerciseId: 'press-de-banca-plano', performedAt: startedAt, workoutId: id })]
	});
	const entries = [
		entry('today', '2026-10-31T17:00:00Z'),
		entry('yesterday', '2026-10-30T17:00:00Z')
	];

	it('is the most recent workout when none is in progress', () => {
		expect(dashboard(entries, now).last?.workout.id).toBe('today');
	});

	it('skips the workout in progress', () => {
		expect(dashboard(entries, now, 'today').last?.workout.id).toBe('yesterday');
		expect(dashboard(entries.slice(0, 1), now, 'today').last).toBeNull();
	});
});

describe('the strip of "Últimos 7 días" (today and the 6 days before, work sets per local day)', () => {
	it('counts the work sets of each local day, oldest first, today last', () => {
		const zone = process.env.TZ;
		process.env.TZ = 'America/Mexico_City';
		try {
			const here = new Date(2026, 9, 31, 18);
			const at = (day: number, hour: number) => new Date(2026, 9, day, hour).toISOString();
			const entries: WorkoutEntry[] = [
				{
					workout: { ...newWorkout(here, 'log'), id: 'w' },
					sets: [
						set({ exerciseId: 'press-de-banca-plano', performedAt: at(31, 9) }),
						set({ exerciseId: 'press-de-banca-plano', performedAt: at(31, 0) }),
						set({ exerciseId: 'press-de-banca-plano', performedAt: at(30, 23) }),
						set({ exerciseId: 'press-de-banca-plano', performedAt: at(25, 1) }),
						set({ exerciseId: 'press-de-banca-plano', performedAt: at(24, 23) }),
						set({ exerciseId: 'press-de-banca-plano', performedAt: at(31, 10), type: 'warmup' })
					]
				}
			];

			const days = dailySets(entries, here);

			expect(days.map((day) => day.day.getDate())).toEqual([25, 26, 27, 28, 29, 30, 31]);
			expect(days.map((day) => day.sets)).toEqual([1, 0, 0, 0, 0, 1, 2]);
		} finally {
			if (zone === undefined) delete process.env.TZ;
			else process.env.TZ = zone;
		}
	});
});
