import 'fake-indexeddb/auto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WorkoutLoggerDb } from '#lib/log/db.js';
import { createRoutine, deleteRoutine, listRoutines, updateRoutine } from '#lib/log/routines.js';
import { addSet, deleteLastSet, deleteSet, updateSet } from '#lib/log/sets.js';
import {
	deleteWorkout,
	finishWorkout,
	moveWorkout,
	setsOf,
	startWorkout,
	workoutEntry
} from '#lib/log/workouts.js';
import { createSyncClient } from '#lib/sync/client.js';
import { createAuth, type Auth } from '../auth/create';
import { createDb, migrateDb, type Db } from '../db/client';
import { handlePull, handlePush } from './http';

/**
 * Integración HTTP contra libSQL local: dos dispositivos (dos bases Dexie) con el cliente real,
 * hablando con los manejadores reales a través de un `fetch` simulado, con sesiones reales.
 */
let dir: string;
let db: Db;
let auth: Auth;
const press = 'press-de-banca-plano';
const input = {
	exerciseId: press,
	reps: 8,
	weight: 60,
	rir: null,
	type: 'normal' as const,
	note: null
};

beforeAll(async () => {
	dir = await mkdtemp(join(tmpdir(), 'workout-logger-sync-'));
	db = await createDb({ url: `file:${join(dir, 'sync.db')}` });
	await migrateDb(db);
	auth = createAuth(db, { secret: 'test-secret' });
});

afterAll(async () => {
	await rm(dir, { recursive: true, force: true });
});

/** Una sesión real: la cookie que Better Auth pone al iniciar sesión. */
async function sessionCookie(email: string): Promise<{ cookie: string; userId: string }> {
	const password = 'contraseña-larga';
	await auth.api.signUpEmail({ body: { email, password, name: email } }).catch(() => undefined);
	const response = await auth.api.signInEmail({ body: { email, password }, asResponse: true });
	const cookie = response.headers
		.getSetCookie()
		.map((c) => c.split(';')[0])
		.join('; ');
	const { user } = (await response.json()) as { user: { id: string } };
	return { cookie, userId: user.id };
}

/** `fetch` que enruta a los manejadores del servidor, como haría el navegador contra /api/sync. */
function fetchAs(cookie?: string): typeof fetch {
	return async (input, init) => {
		const request = new Request(input, init);
		if (cookie) request.headers.set('cookie', cookie);
		const context = { db, auth };
		return request.url.includes('/api/sync/push')
			? handlePush(request, context)
			: handlePull(request, context);
	};
}

let devices = 0;
async function device(email: string) {
	const { cookie, userId } = await sessionCookie(email);
	const local = new WorkoutLoggerDb(`device-${devices++}`);
	const client = createSyncClient({
		db: local,
		userId,
		fetch: fetchAs(cookie),
		baseUrl: 'http://app.test'
	});
	return { local, client, userId, cookie };
}

describe('sync over HTTP', () => {
	it('refuses both operations without a session', async () => {
		const anonymous = fetchAs();

		const push = await anonymous('http://app.test/api/sync/push', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ workouts: [], sets: [] })
		});
		const pull = await anonymous('http://app.test/api/sync/pull?cursor=0');

		expect(push.status).toBe(401);
		expect(pull.status).toBe(401);
	});

	it('pushes anonymous rows after attaching them to the account, and another device pulls them', async () => {
		const a = await device('ana@example.com');
		const b = await device('ana@example.com');
		await addSet(input, new Date('2026-10-28T18:00:00Z'), a.local);

		const pushed = await a.client.sync();
		const pulled = await b.client.sync();

		expect(pushed).toMatchObject({ pushed: 2, pulled: 0 });
		expect(pulled).toMatchObject({ pushed: 0, pulled: 2 });
		const setsOnB = await setsOf(press, b.local);
		expect(setsOnB.map((s) => s.weight)).toEqual([60]);
		expect(setsOnB[0]).toMatchObject({ userId: a.userId, pending: 0 });
		expect(
			(await a.local.sets.toArray()).every((s) => s.pending === 0 && s.userId === a.userId)
		).toBe(true);
	});

	it('resolves a conflict by the most recent update, in both directions', async () => {
		const a = await device('beto@example.com');
		const b = await device('beto@example.com');
		const set = await addSet(input, new Date('2026-10-28T18:00:00Z'), a.local);
		await a.client.sync();
		await b.client.sync();

		await b.local.sets.update(set.id, {
			weight: 65,
			updatedAt: '2026-10-28T19:00:00.000Z',
			pending: 1
		});
		await a.local.sets.update(set.id, {
			weight: 70,
			updatedAt: '2026-10-28T19:30:00.000Z',
			pending: 1
		});
		await b.client.sync();
		await a.client.sync();
		await b.client.sync();

		expect((await a.local.sets.get(set.id))?.weight).toBe(70);
		expect((await b.local.sets.get(set.id))?.weight).toBe(70);
		expect((await b.local.sets.get(set.id))?.pending).toBe(0);
	});

	it('propagates a deletion to the other device', async () => {
		const a = await device('carla@example.com');
		const b = await device('carla@example.com');
		await addSet(input, new Date('2026-10-28T18:00:00Z'), a.local);
		await a.client.sync();
		await b.client.sync();
		expect(await setsOf(press, b.local)).toHaveLength(1);

		await deleteLastSet(press, new Date('2026-10-28T18:05:00Z'), a.local);
		await a.client.sync();
		await b.client.sync();

		expect(await setsOf(press, b.local)).toHaveLength(0);
		expect((await b.local.sets.toArray())[0]?.deletedAt).toBe('2026-10-28T18:05:00.000Z');
	});

	it('only ever returns the rows of the session user', async () => {
		const a = await device('dora@example.com');
		const other = await device('elsa@example.com');
		await addSet(input, new Date('2026-10-28T18:00:00Z'), a.local);
		await a.client.sync();

		const pulled = await other.client.sync();

		expect(pulled.pulled).toBe(0);
		expect(await other.local.sets.toArray()).toHaveLength(0);
	});

	it('pulls only what changed since the cursor', async () => {
		const a = await device('fede@example.com');
		const b = await device('fede@example.com');
		await addSet(input, new Date('2026-10-28T18:00:00Z'), a.local);
		await a.client.sync();
		await b.client.sync();
		await addSet({ ...input, weight: 62.5 }, new Date('2026-10-28T18:05:00Z'), a.local);
		await a.client.sync();

		const again = await b.client.sync();

		expect(again.pulled).toBe(1);
		expect((await setsOf(press, b.local)).map((s) => s.weight)).toEqual([60, 62.5]);
	});

	it('reports pending changes and the last sync time', async () => {
		const a = await device('gina@example.com');
		await addSet(input, new Date('2026-10-28T18:00:00Z'), a.local);
		expect(await a.client.status()).toMatchObject({ pending: 2, lastSyncAt: null });

		await a.client.sync();

		expect((await a.client.status()).pending).toBe(0);
		expect((await a.client.status()).lastSyncAt).not.toBeNull();
	});
});

describe('workout with routine, copied name and mode (spec: a device with the previous app keeps syncing)', () => {
	it('carries routine, name and mode to the other device', async () => {
		const a = await device('nora@example.com');
		const b = await device('nora@example.com');
		await startWorkout(
			{ routineId: 'empuje-a', title: 'Empuje A', mode: 'log' },
			new Date('2026-10-28T18:00:00Z'),
			a.local
		);

		await a.client.sync();
		await b.client.sync();

		expect(await b.local.workouts.toArray()).toEqual([
			expect.objectContaining({
				routineId: 'empuje-a',
				title: 'Empuje A',
				mode: 'log',
				startedAt: '2026-10-28T18:00:00.000Z',
				endedAt: null,
				pending: 0
			})
		]);
	});

	it('accepts a push without the routines table and a workout row without the new columns, as the previous app sends them', async () => {
		const a = await device('olga@example.com');
		const legacy = {
			id: 'legacy-workout',
			createdAt: '2026-10-28T18:00:00.000Z',
			updatedAt: '2026-10-28T18:00:00.000Z',
			deletedAt: null,
			startedAt: '2026-10-28T18:00:00.000Z',
			endedAt: '2026-10-28T19:00:00.000Z'
		};

		const response = await fetchAs(a.cookie)('http://app.test/api/sync/push', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ workouts: [legacy], sets: [] })
		});
		await a.client.sync();

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			accepted: { routines: [], workouts: ['legacy-workout'], sets: [] }
		});
		expect(await a.local.workouts.get('legacy-workout')).toEqual({
			...legacy,
			userId: a.userId,
			routineId: null,
			title: null,
			mode: 'companion',
			pending: 0
		});
	});

	it('keeps routine, name and mode when the previous app updates the workout without those columns', async () => {
		const a = await device('pepa@example.com');
		const workout = await startWorkout(
			{ routineId: 'empuje-a', title: 'Empuje A', mode: 'log' },
			new Date('2026-10-28T18:00:00Z'),
			a.local
		);
		await a.client.sync();
		const { pending: _p, userId: _u, routineId: _r, title: _t, mode: _m, ...legacy } = workout;

		// La app anterior lo cierra a las 3 horas y sube la fila como la conoce: sin las columnas nuevas.
		const response = await fetchAs(a.cookie)('http://app.test/api/sync/push', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				workouts: [
					{ ...legacy, endedAt: '2026-10-28T18:00:00.000Z', updatedAt: '2026-10-28T21:00:00.000Z' }
				],
				sets: []
			})
		});
		await a.client.sync();

		expect(response.status).toBe(200);
		expect(await a.local.workouts.get(workout.id)).toMatchObject({
			routineId: 'empuje-a',
			title: 'Empuje A',
			mode: 'log',
			endedAt: '2026-10-28T18:00:00.000Z',
			updatedAt: '2026-10-28T21:00:00.000Z',
			pending: 0
		});
	});
});

describe('custom routines between devices (spec #14: whole-row conflicts, the most recent wins)', () => {
	const pressEntry = { exerciseId: press, sets: 3, repsMin: 5, repsMax: 8, rir: null, rest: 150 };
	const remoEntry = {
		exerciseId: 'remo-con-barra',
		sets: 3,
		repsMin: 8,
		repsMax: 12,
		rir: 2,
		rest: 90
	};
	const empujeA = { name: 'Empuje A', baseRoutineId: 'empuje', exercises: [pressEntry] };

	it('carries a routine created on one device, exercises included, to the other', async () => {
		const a = await device('rita@example.com');
		const b = await device('rita@example.com');
		const routine = await createRoutine(empujeA, new Date('2026-10-31T10:00:00Z'), a.local);

		await a.client.sync();
		await b.client.sync();

		expect(await listRoutines(b.local)).toEqual([{ ...routine, userId: a.userId, pending: 0 }]);
	});

	it('resolves a routine edited on both devices without network by the most recent routine as a whole', async () => {
		const a = await device('sara@example.com');
		const b = await device('sara@example.com');
		const routine = await createRoutine(empujeA, new Date('2026-10-31T10:00:00Z'), a.local);
		await a.client.sync();
		await b.client.sync();

		// B la renombra antes; A añade un ejercicio después. Gana A entera: el nombre de B se pierde.
		await updateRoutine(
			routine.id,
			{ ...empujeA, name: 'Empuje B' },
			new Date('2026-10-31T11:00:00Z'),
			b.local
		);
		await updateRoutine(
			routine.id,
			{ ...empujeA, exercises: [pressEntry, remoEntry] },
			new Date('2026-10-31T11:30:00Z'),
			a.local
		);
		await b.client.sync();
		await a.client.sync();
		await b.client.sync();

		const expected = {
			name: 'Empuje A',
			exercises: [pressEntry, remoEntry],
			updatedAt: '2026-10-31T11:30:00.000Z',
			pending: 0
		};
		expect(await a.local.routines.get(routine.id)).toMatchObject(expected);
		expect(await b.local.routines.get(routine.id)).toMatchObject(expected);
	});

	it('makes a routine deleted on one device disappear from the other', async () => {
		const a = await device('tina@example.com');
		const b = await device('tina@example.com');
		const routine = await createRoutine(empujeA, new Date('2026-10-31T10:00:00Z'), a.local);
		await a.client.sync();
		await b.client.sync();
		expect(await listRoutines(b.local)).toHaveLength(1);

		await deleteRoutine(routine.id, new Date('2026-10-31T12:00:00Z'), a.local);
		await a.client.sync();
		await b.client.sync();

		expect(await listRoutines(b.local)).toEqual([]);
		expect((await b.local.routines.get(routine.id))?.deletedAt).toBe('2026-10-31T12:00:00.000Z');
	});
});

describe('correcting the past between devices (spec #18: edits, deletions and moves are rows like any other)', () => {
	it('resolves a set edited on one device and deleted on the other by the most recent change', async () => {
		const a = await device('ursula@example.com');
		const b = await device('ursula@example.com');
		const set = await addSet(input, new Date('2026-10-28T18:00:00Z'), a.local);
		await a.client.sync();
		await b.client.sync();

		// A la corrige a las 19:00; B la borra a las 19:30 sin red. Gana el borrado, el más reciente.
		await updateSet(set.id, { ...input, weight: 65 }, new Date('2026-10-28T19:00:00Z'), a.local);
		await deleteSet(set.id, new Date('2026-10-28T19:30:00Z'), b.local);
		await a.client.sync();
		await b.client.sync();
		await a.client.sync();

		expect(await setsOf(press, a.local)).toEqual([]);
		expect(await setsOf(press, b.local)).toEqual([]);
		expect(await a.local.sets.get(set.id)).toMatchObject({
			deletedAt: '2026-10-28T19:30:00.000Z',
			pending: 0
		});
	});

	it('resolves the same conflict the other way round when the edit is the most recent', async () => {
		const a = await device('vera@example.com');
		const b = await device('vera@example.com');
		const set = await addSet(input, new Date('2026-10-28T18:00:00Z'), a.local);
		await a.client.sync();
		await b.client.sync();

		await deleteSet(set.id, new Date('2026-10-28T19:00:00Z'), b.local);
		await updateSet(set.id, { ...input, weight: 65 }, new Date('2026-10-28T19:30:00Z'), a.local);
		await b.client.sync();
		await a.client.sync();
		await b.client.sync();

		expect((await setsOf(press, b.local)).map((s) => s.weight)).toEqual([65]);
		expect(await b.local.sets.get(set.id)).toMatchObject({ deletedAt: null, pending: 0 });
	});

	it('brings a moved workout to the other device with its sets moved', async () => {
		const a = await device('wanda@example.com');
		const b = await device('wanda@example.com');
		const workout = await startWorkout(
			{ routineId: 'empuje-a', title: 'Empuje A', mode: 'companion' },
			new Date('2026-10-28T18:00:00Z'),
			a.local
		);
		await addSet(input, new Date('2026-10-28T18:05:00Z'), a.local);
		await addSet({ ...input, weight: 62.5 }, new Date('2026-10-28T18:10:00Z'), a.local);
		await finishWorkout(new Date('2026-10-28T18:30:00Z'), a.local);
		await a.client.sync();
		await b.client.sync();

		await moveWorkout(
			workout.id,
			new Date('2026-10-27T18:00:00Z'),
			new Date('2026-10-29T09:00:00Z'),
			a.local
		);
		await a.client.sync();
		await b.client.sync();

		const onB = await workoutEntry(workout.id, b.local);
		expect(onB?.workout).toMatchObject({
			startedAt: '2026-10-27T18:00:00.000Z',
			endedAt: '2026-10-27T18:30:00.000Z',
			pending: 0
		});
		expect(onB?.sets.map((s) => [s.performedAt, s.pending])).toEqual([
			['2026-10-27T18:05:00.000Z', 0],
			['2026-10-27T18:10:00.000Z', 0]
		]);
	});

	it('brings a deleted workout and its sets to the other device as deleted', async () => {
		const a = await device('xena@example.com');
		const b = await device('xena@example.com');
		const set = await addSet(input, new Date('2026-10-28T18:00:00Z'), a.local);
		await a.client.sync();
		await b.client.sync();
		expect(await workoutEntry(set.workoutId, b.local)).toBeDefined();

		await deleteWorkout(set.workoutId, new Date('2026-10-28T19:00:00Z'), a.local);
		await a.client.sync();
		await b.client.sync();

		expect(await workoutEntry(set.workoutId, b.local)).toBeUndefined();
		expect(await setsOf(press, b.local)).toEqual([]);
	});
});

describe('sync edge cases', () => {
	it('does not accept a row older than the stored one, and the next pull brings the device up to date', async () => {
		const a = await device('hugo@example.com');
		const b = await device('hugo@example.com');
		const set = await addSet(input, new Date('2026-10-28T18:00:00Z'), a.local);
		await a.client.sync();
		await b.client.sync();
		await a.local.sets.update(set.id, {
			weight: 70,
			updatedAt: '2026-10-28T20:00:00.000Z',
			pending: 1
		});
		await a.client.sync();

		// B edita una versión vieja y la sube después: no se acepta y B recibe la de A.
		await b.local.sets.update(set.id, {
			weight: 65,
			updatedAt: '2026-10-28T19:00:00.000Z',
			pending: 1
		});
		const result = await b.client.sync();

		expect(result.pushed).toBe(0);
		expect(await b.local.sets.get(set.id)).toMatchObject({ weight: 70, pending: 0 });
	});

	it("ignores a set that points at another user's workout", async () => {
		const a = await device('ines@example.com');
		const intruder = await device('juan@example.com');
		const set = await addSet(input, new Date('2026-10-28T18:00:00Z'), a.local);
		await a.client.sync();

		await intruder.local.sets.put({ ...set, id: 'stolen-set', userId: null });
		const result = await intruder.client.sync();

		expect(result.pushed).toBe(0);
		await a.client.sync();
		expect(await a.local.sets.get('stolen-set')).toBeUndefined();
	});

	it('starts the cursor again when another account uses a device that synced before', async () => {
		const first = await device('kiko@example.com');
		await first.client.sync();
		const other = await device('lola@example.com');
		await addSet(input, new Date('2026-10-28T18:00:00Z'), other.local);
		await other.client.sync();

		// La misma base local que usó `first`, ahora con la cuenta de `other`.
		const { cookie, userId } = await sessionCookie('lola@example.com');
		const reused = createSyncClient({
			db: first.local,
			userId,
			fetch: fetchAs(cookie),
			baseUrl: 'http://app.test'
		});
		const result = await reused.sync();

		expect(result.pulled).toBe(2);
		expect(await setsOf(press, first.local)).toHaveLength(1);
	});

	it('does not lose a change made while a sync is running', async () => {
		const a = await device('mara@example.com');
		await addSet(input, new Date('2026-10-28T18:00:00Z'), a.local);

		const first = a.client.sync();
		await addSet({ ...input, weight: 62.5 }, new Date('2026-10-28T18:05:00Z'), a.local);
		const second = a.client.sync();
		await Promise.all([first, second]);

		expect((await a.client.status()).pending).toBe(0);
	});
});
