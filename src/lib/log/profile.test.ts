import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { WorkoutLoggerDb } from './db';
import {
	bodyWeights,
	deleteBodyWeight,
	logBodyWeight,
	profile,
	updateBodyWeight,
	updateProfile
} from './profile';

let devices = 0;
const device = () => new WorkoutLoggerDb(`profile-test-${devices++}`);
const at = (hour: number) => new Date(`2026-11-02T${String(hour).padStart(2, '0')}:00:00.000Z`);

describe('body weight on the device (spec #26: log, correct, delete from Perfil)', () => {
	it('logs twice on the same day and keeps one entry with the last value', async () => {
		const db = device();

		await logBodyWeight({ date: '2026-11-02', kg: 80 }, at(8), db);
		await logBodyWeight({ date: '2026-11-02', kg: 79.5 }, at(9), db);

		expect(await bodyWeights(db)).toEqual([
			expect.objectContaining({ date: '2026-11-02', kg: 79.5, pending: 1 })
		]);
		expect(await db.bodyWeights.count()).toBe(1);
	});

	it('corrects the kilos and the date of an entry', async () => {
		const db = device();
		const [entry] = await logBodyWeight({ date: '2026-11-02', kg: 80 }, at(8), db);

		await updateBodyWeight(entry.id, { date: '2026-11-01', kg: 81 }, at(9), db);

		expect(await bodyWeights(db)).toEqual([
			expect.objectContaining({ id: entry.id, date: '2026-11-01', kg: 81 })
		]);
	});

	it('refuses a correction or a log that breaks the limits, without writing', async () => {
		const db = device();
		const [entry] = await logBodyWeight({ date: '2026-11-01', kg: 80 }, at(8), db);

		await expect(
			updateBodyWeight(entry.id, { date: '2026-11-01', kg: 500 }, at(9), db)
		).rejects.toThrow('El peso corporal va de 20 a 400 kg.');
		await expect(logBodyWeight({ date: '2099-01-01', kg: 80 }, at(9), db)).rejects.toThrow(
			'La fecha no puede ser futura.'
		);
		expect((await bodyWeights(db)).map((row) => row.kg)).toEqual([80]);
	});

	it('deletes an entry logically: it leaves the history but stays to sync', async () => {
		const db = device();
		const [entry] = await logBodyWeight({ date: '2026-11-02', kg: 80 }, at(8), db);

		await deleteBodyWeight(entry.id, at(9), db);

		expect(await bodyWeights(db)).toEqual([]);
		expect(await db.bodyWeights.get(entry.id)).toMatchObject({
			deletedAt: '2026-11-02T09:00:00.000Z',
			pending: 1
		});
	});
});

describe('profile on the device (spec #26: optional data that saves on change, with or without account)', () => {
	it('creates the profile on the first change and edits the same row afterwards', async () => {
		const db = device();

		await updateProfile({ sex: 'female' }, at(8), db);
		await updateProfile({ height: 168 }, at(9), db);

		expect(await profile(db)).toMatchObject({ sex: 'female', height: 168, birthDate: null });
		expect(await db.profiles.count()).toBe(1);
	});

	it('edits the most recent of two live profiles', async () => {
		const db = device();
		const older = await updateProfile({ height: 170 }, at(8), db);
		await db.profiles.add({ ...older, id: 'newer', height: 180, updatedAt: at(9).toISOString() });

		await updateProfile({ sex: 'male' }, at(10), db);

		expect(await profile(db)).toMatchObject({ id: 'newer', height: 180, sex: 'male' });
		expect((await db.profiles.get(older.id))?.sex).toBeNull();
	});

	it('refuses an invalid change without writing', async () => {
		const db = device();

		await expect(updateProfile({ height: 20 }, at(8), db)).rejects.toThrow('La estatura');
		expect(await profile(db)).toBeUndefined();
	});
});
