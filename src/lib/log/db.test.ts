import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { describe, expect, it } from 'vitest';
import { WorkoutLoggerDb } from './db';

/** La base de la fase 1 (versión 2): entrenamientos sin rutina, nombre ni modo. */
async function phaseOneDevice(name: string) {
	const old = new Dexie(name);
	old.version(1).stores({
		workouts: 'id, startedAt, endedAt, updatedAt, pending',
		sets: 'id, workoutId, exerciseId, performedAt, updatedAt, pending'
	});
	old.version(2).stores({ meta: 'key' });
	await old.table('workouts').add({
		id: 'w1',
		userId: 'u1',
		startedAt: '2026-10-28T18:00:00.000Z',
		endedAt: '2026-10-28T19:00:00.000Z',
		createdAt: '2026-10-28T18:00:00.000Z',
		updatedAt: '2026-10-28T19:00:00.000Z',
		deletedAt: null,
		pending: 0
	});
	old.close();
}

describe('device database upgrade (spec: existing workouts become free, in companion mode)', () => {
	it('fills routine, title and mode on the workouts of the previous version without touching the rest', async () => {
		await phaseOneDevice('upgrade-test');

		const db = new WorkoutLoggerDb('upgrade-test');
		const workout = await db.workouts.get('w1');

		expect(workout).toEqual({
			id: 'w1',
			userId: 'u1',
			routineId: null,
			title: null,
			mode: 'companion',
			startedAt: '2026-10-28T18:00:00.000Z',
			endedAt: '2026-10-28T19:00:00.000Z',
			createdAt: '2026-10-28T18:00:00.000Z',
			updatedAt: '2026-10-28T19:00:00.000Z',
			deletedAt: null,
			pending: 0
		});
	});

	it('opens a device of the previous version with an empty table of custom routines (#14)', async () => {
		await phaseOneDevice('routines-upgrade-test');

		const db = new WorkoutLoggerDb('routines-upgrade-test');

		expect(await db.routines.count()).toBe(0);
		expect(await db.workouts.count()).toBe(1);
	});

	it('opens a device of the previous version with empty profile and body weight tables (#26)', async () => {
		await phaseOneDevice('profile-upgrade-test');

		const db = new WorkoutLoggerDb('profile-upgrade-test');

		expect(await db.profiles.count()).toBe(0);
		expect(await db.bodyWeights.count()).toBe(0);
		expect(await db.workouts.count()).toBe(1);
	});
});
