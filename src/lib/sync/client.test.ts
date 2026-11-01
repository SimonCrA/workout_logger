import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { WorkoutLoggerDb } from '#lib/log/db.js';
import type { Synced } from '#lib/log/types.js';
import { createSyncClient } from './client';
import type { PushRequest } from './protocol';
import { byTable, syncTables, type SyncTableKey } from './tables';

/**
 * El cliente recorre la lista de tablas, así que estas pruebas no nombran ninguna. El servidor es
 * uno simulado en la frontera HTTP: acepta todo lo que sube y devuelve una fila nueva por tabla.
 */
const at = '2026-10-31T10:00:00.000Z';
const userId = 'u1';

function row(id: string, pending: 0 | 1, owner: string | null = null): Synced {
	return { id, userId: owner, createdAt: at, updatedAt: at, deletedAt: null, pending };
}

/** Una fila como viaja: lo que el servidor devolvería de la tabla `key`. */
function remoteRow(key: SyncTableKey) {
	const { pending: _pending, userId: _userId, ...traveling } = row(`remote-${key}`, 0);
	return traveling;
}

function fakeServer() {
	const pushes: PushRequest[] = [];
	const fetchFn: typeof fetch = async (input, init) => {
		const request = new Request(input, init);
		if (request.url.includes('/api/sync/push')) {
			const body = (await request.json()) as PushRequest;
			pushes.push(body);
			return Response.json({ accepted: byTable(({ key }) => body[key].map((r) => r.id)) });
		}
		return Response.json({ ...byTable(({ key }) => [remoteRow(key)]), cursor: 7 });
	};
	return { fetch: fetchFn, pushes };
}

let devices = 0;
async function deviceWithAnonymousRows() {
	const db = new WorkoutLoggerDb(`client-test-${devices++}`);
	for (const { key } of syncTables) await db.table<Synced, string>(key).put(row(`local-${key}`, 1));
	const server = fakeServer();
	const client = createSyncClient({ db, userId, fetch: server.fetch, baseUrl: 'http://app.test' });
	return { db, client, server };
}

describe('sync client (spec: a declared table takes part in push and pull without touching anything else)', () => {
	it('pushes the pending rows of every declared table under its key, as they travel', async () => {
		const { client, server } = await deviceWithAnonymousRows();

		await client.sync();

		expect(Object.keys(server.pushes[0])).toEqual(syncTables.map(({ key }) => key));
		expect(server.pushes[0]).toEqual(
			byTable(({ key }) => [{ id: `local-${key}`, createdAt: at, updatedAt: at, deletedAt: null }])
		);
	});

	it('attaches anonymous rows to the account and clears the pending mark in every declared table', async () => {
		const { db, client } = await deviceWithAnonymousRows();

		const result = await client.sync();

		expect(result.pushed).toBe(syncTables.length);
		for (const { key } of syncTables) {
			expect(await db.table<Synced, string>(key).get(`local-${key}`), key).toMatchObject({
				userId,
				pending: 0
			});
		}
	});

	it('puts the pulled rows of every declared table in that table, owned and not pending', async () => {
		const { db, client } = await deviceWithAnonymousRows();

		const result = await client.sync();

		expect(result.pulled).toBe(syncTables.length);
		for (const { key } of syncTables) {
			expect(await db.table<Synced, string>(key).get(`remote-${key}`), key).toEqual(
				row(`remote-${key}`, 0, userId)
			);
		}
		expect(await db.meta.get('cursor')).toEqual({ key: 'cursor', value: 7 });
	});
});
