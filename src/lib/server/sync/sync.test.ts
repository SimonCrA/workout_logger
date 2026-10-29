import 'fake-indexeddb/auto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WorkoutLoggerDb } from '#lib/log/db.js';
import { addSet, deleteLastSet, setsOf } from '#lib/log/sets.js';
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
	return { local, client, userId };
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
