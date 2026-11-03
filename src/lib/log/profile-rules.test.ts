import { describe, expect, it } from 'vitest';
import { makeBodyWeight, makeProfile } from './fixtures';
import {
	bodyWeightHistory,
	bodyWeightProblem,
	correctBodyWeightWrites,
	deleteBodyWeightWrites,
	currentProfile,
	localDate,
	logBodyWeightWrites,
	profileProblem,
	saveProfile
} from './profile-rules';

const now = new Date('2026-11-02T10:00:00.000Z');

describe('logBodyWeightWrites (spec: logging twice on the same day leaves one entry with the last value)', () => {
	it('creates a new anonymous, pending entry on a day without one', () => {
		const [entry] = logBodyWeightWrites([], { date: '2026-11-02', kg: 80.5 }, now);

		expect(entry).toMatchObject({
			userId: null,
			date: '2026-11-02',
			kg: 80.5,
			createdAt: '2026-11-02T10:00:00.000Z',
			updatedAt: '2026-11-02T10:00:00.000Z',
			deletedAt: null,
			pending: 1
		});
		expect(entry.id).toEqual(expect.any(String));
	});

	it('updates the entry of that day instead of adding another', () => {
		const existing = makeBodyWeight({ id: 'b1', date: '2026-11-02', kg: 80, pending: 0 });

		const written = logBodyWeightWrites([existing], { date: '2026-11-02', kg: 79.5 }, now);

		expect(written).toEqual([
			{ ...existing, kg: 79.5, updatedAt: '2026-11-02T10:00:00.000Z', pending: 1 }
		]);
	});

	it('ignores a deleted entry of that day and creates a new one', () => {
		const deleted = makeBodyWeight({
			id: 'b1',
			date: '2026-11-02',
			deletedAt: '2026-11-01T00:00:00.000Z'
		});

		const [entry] = logBodyWeightWrites([deleted], { date: '2026-11-02', kg: 79 }, now);

		expect(entry.id).not.toBe('b1');
	});

	it('rounds the kilos to one decimal', () => {
		const [entry] = logBodyWeightWrites([], { date: '2026-11-02', kg: 80.26 }, now);

		expect(entry.kg).toBe(80.3);
	});
});

describe('correctBodyWeightWrites (spec: correcting edits the kilos or the date)', () => {
	it('changes kilos and date of the entry', () => {
		const entry = makeBodyWeight({ id: 'b1', date: '2026-11-01', kg: 80 });

		const written = correctBodyWeightWrites([entry], entry, { date: '2026-10-31', kg: 81 }, now);

		expect(written).toEqual([
			{ ...entry, date: '2026-10-31', kg: 81, updatedAt: '2026-11-02T10:00:00.000Z', pending: 1 }
		]);
	});

	it('moving it to a day that already has an entry keeps only the corrected one', () => {
		const moved = makeBodyWeight({ id: 'b1', date: '2026-11-01', kg: 80 });
		const other = makeBodyWeight({ id: 'b2', date: '2026-10-31', kg: 82 });

		const written = correctBodyWeightWrites(
			[moved, other],
			moved,
			{ date: '2026-10-31', kg: 81 },
			now
		);

		expect(written).toEqual([
			expect.objectContaining({ id: 'b1', date: '2026-10-31', kg: 81 }),
			expect.objectContaining({ id: 'b2', deletedAt: '2026-11-02T10:00:00.000Z', pending: 1 })
		]);
	});
});

describe('bodyWeightProblem (spec: kg with up to one decimal between 20 and 400, a local date)', () => {
	it.each([
		[{ date: '2026-11-02', kg: 20 }, null],
		[{ date: '2026-11-02', kg: 400 }, null],
		[{ date: '2026-11-02', kg: 19.9 }, 'El peso corporal va de 20 a 400 kg.'],
		[{ date: '2026-11-02', kg: 400.1 }, 'El peso corporal va de 20 a 400 kg.'],
		[{ date: '2026-11-02', kg: Number.NaN }, 'El peso corporal va de 20 a 400 kg.'],
		[{ date: '', kg: 80 }, 'Elige una fecha.'],
		[{ date: '2026-02-30', kg: 80 }, 'Elige una fecha.'],
		[{ date: '2026-11-03', kg: 80 }, 'La fecha no puede ser futura.']
	])('%o → %s', (input, problem) => {
		expect(bodyWeightProblem(input, '2026-11-02')).toBe(problem);
	});
});

describe('bodyWeightHistory (spec: the history, newest day first)', () => {
	it('lists live entries by date, newest first', () => {
		const rows = [
			makeBodyWeight({ id: 'b1', date: '2026-10-30' }),
			makeBodyWeight({ id: 'b2', date: '2026-11-01' }),
			makeBodyWeight({ id: 'b3', date: '2026-10-31', deletedAt: '2026-11-01T00:00:00.000Z' })
		];

		expect(bodyWeightHistory(rows).map((row) => row.id)).toEqual(['b2', 'b1']);
	});

	it('shows one entry per day when two devices logged the same day offline: the most recent', () => {
		const rows = [
			makeBodyWeight({
				id: 'b1',
				date: '2026-11-01',
				kg: 80,
				updatedAt: '2026-11-01T08:00:00.000Z'
			}),
			makeBodyWeight({
				id: 'b2',
				date: '2026-11-01',
				kg: 81,
				updatedAt: '2026-11-01T09:00:00.000Z'
			})
		];

		expect(bodyWeightHistory(rows).map((row) => row.kg)).toEqual([81]);
	});

	it('logging on that day then updates the visible entry', () => {
		const rows = [
			makeBodyWeight({ id: 'b1', date: '2026-11-01', updatedAt: '2026-11-01T08:00:00.000Z' }),
			makeBodyWeight({ id: 'b2', date: '2026-11-01', updatedAt: '2026-11-01T09:00:00.000Z' })
		];

		expect(logBodyWeightWrites(rows, { date: '2026-11-01', kg: 79 }, now)[0].id).toBe('b2');
	});
});

describe('the same day logged on two devices without network (spec: one entry per day)', () => {
	const older = makeBodyWeight({
		id: 'b1',
		date: '2026-11-01',
		kg: 80,
		updatedAt: '2026-11-01T08:00:00.000Z'
	});
	const newer = makeBodyWeight({
		id: 'b2',
		date: '2026-11-01',
		kg: 81,
		updatedAt: '2026-11-01T09:00:00.000Z'
	});

	it('logging on that day keeps the visible entry and deletes the other', () => {
		const written = logBodyWeightWrites([older, newer], { date: '2026-11-01', kg: 79 }, now);

		expect(written).toEqual([
			expect.objectContaining({ id: 'b2', kg: 79, deletedAt: null }),
			expect.objectContaining({ id: 'b1', deletedAt: '2026-11-02T10:00:00.000Z' })
		]);
	});

	it('deleting the visible entry deletes the day, so the older one does not come back', () => {
		const written = deleteBodyWeightWrites([older, newer], newer, now);

		expect(bodyWeightHistory(merge([older, newer], written))).toEqual([]);
	});

	it('moving the visible entry to another day leaves nothing behind on the old one', () => {
		const written = correctBodyWeightWrites(
			[older, newer],
			newer,
			{ date: '2026-10-31', kg: 81 },
			now
		);

		expect(
			bodyWeightHistory(merge([older, newer], written)).map((row) => [row.id, row.date])
		).toEqual([['b2', '2026-10-31']]);
	});
});

/** Las filas tras escribir lo que devuelve una regla, como quedarían en la base. */
function merge<T extends { id: string }>(rows: readonly T[], written: readonly T[]): T[] {
	const byId = new Map(rows.map((row) => [row.id, row]));
	for (const row of written) byId.set(row.id, row);
	return [...byId.values()];
}

describe('currentProfile (spec: with two live profiles after attaching the anonymous one, the most recent)', () => {
	it('is the live profile updated last', () => {
		const rows = [
			makeProfile({ id: 'p1', updatedAt: '2026-11-01T09:00:00.000Z' }),
			makeProfile({ id: 'p2', updatedAt: '2026-11-01T08:00:00.000Z' }),
			makeProfile({
				id: 'p3',
				updatedAt: '2026-11-01T10:00:00.000Z',
				deletedAt: '2026-11-01T10:00:00.000Z'
			})
		];

		expect(currentProfile(rows)?.id).toBe('p1');
	});

	it('is nothing without profiles', () => {
		expect(currentProfile([])).toBeUndefined();
	});
});

describe('saveProfile (spec: sex, birth date and height, all optional, save on change)', () => {
	it('creates the profile with the change when there is none', () => {
		const profile = saveProfile(undefined, { sex: 'female' }, now);

		expect(profile).toMatchObject({
			userId: null,
			sex: 'female',
			birthDate: null,
			height: null,
			createdAt: '2026-11-02T10:00:00.000Z',
			updatedAt: '2026-11-02T10:00:00.000Z',
			deletedAt: null,
			pending: 1
		});
	});

	it('changes only the given field of the current profile', () => {
		const current = makeProfile({ sex: 'male', height: 180, pending: 0 });

		expect(saveProfile(current, { height: null }, now)).toEqual({
			...current,
			height: null,
			updatedAt: '2026-11-02T10:00:00.000Z',
			pending: 1
		});
	});
});

describe('profileProblem', () => {
	it.each([
		[{ height: 175 }, null],
		[{ height: null }, null],
		[{ height: 49 }, 'La estatura va de 50 a 250 cm.'],
		[{ height: 175.5 }, 'La estatura va de 50 a 250 cm.'],
		[{ birthDate: '1990-05-01' }, null],
		[{ birthDate: null }, null],
		[{ birthDate: '1899-12-31' }, 'Elige una fecha de nacimiento.'],
		[{ birthDate: '2026-11-03' }, 'Elige una fecha de nacimiento.'],
		[{ sex: 'female' as const }, null]
	])('%o → %s', (changes, problem) => {
		expect(profileProblem(changes, '2026-11-02')).toBe(problem);
	});
});

describe('localDate', () => {
	it('is the local day as a date field writes it', () => {
		expect(localDate(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
	});
});
