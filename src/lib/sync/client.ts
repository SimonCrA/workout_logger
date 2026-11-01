import type { WorkoutLoggerDb } from '#lib/log/db.js';
import type { Synced } from '#lib/log/types.js';
import { liveQuery, type Table } from 'dexie';
import { toSyncRow, type PullResponse, type PushResponse } from './protocol';
import { attachToAccount, mergeRemote, ownsOtherAccountData } from './rules';
import { byTable, byTableAsync, syncTables, type SyncTableKey } from './tables';

export type SyncResult = { pushed: number; pulled: number };
export type SyncStatus = { pending: number; lastSyncAt: string | null };

export type SyncClient = {
	/** Asocia lo anónimo a la cuenta, sube lo pendiente y baja lo nuevo. Las llamadas simultáneas se unen. */
	sync(): Promise<SyncResult>;
	status(): Promise<SyncStatus>;
};

export type SyncClientOptions = {
	db: WorkoutLoggerDb;
	userId: string;
	fetch?: typeof fetch;
	/** Vacío en el navegador (mismo origen); los tests pasan uno absoluto. */
	baseUrl?: string;
	now?: () => Date;
};

/** Una tabla sincronizada del dispositivo, vista por sus columnas comunes. */
type DeviceTable = Table<Synced, string>;

/** La tabla declarada con ese nombre en la base del dispositivo; si no existe ahí, no compila. */
function deviceTable(db: WorkoutLoggerDb, key: SyncTableKey): DeviceTable {
	return db.table<Synced, string>(key satisfies keyof WorkoutLoggerDb);
}

/** Las tablas sincronizadas del dispositivo, en el orden de la lista: padres antes que hijos. */
function deviceTables(db: WorkoutLoggerDb): DeviceTable[] {
	return syncTables.map(({ key }) => deviceTable(db, key));
}

export function createSyncClient(options: SyncClientOptions): SyncClient {
	const { db, userId, baseUrl = '', now = () => new Date() } = options;
	const fetchFn = options.fetch ?? ((input, init) => fetch(input, init));
	const tables = byTable(({ key }) => deviceTable(db, key));
	const allTables = deviceTables(db);
	let running: Promise<SyncResult> | null = null;
	let again = false;

	async function attachAnonymous(): Promise<void> {
		await db.transaction('rw', allTables, async () => {
			for (const table of allTables) {
				const anonymous = await table.filter((row) => row.userId === null).toArray();
				if (anonymous.length > 0)
					await table.bulkPut(anonymous.map((row) => attachToAccount(row, userId)));
			}
		});
	}

	async function clearPending(
		table: DeviceTable,
		pushed: Synced[],
		acceptedIds: string[]
	): Promise<void> {
		const accepted = new Set(acceptedIds);
		for (const row of pushed) {
			if (!accepted.has(row.id)) continue;
			const current = await table.get(row.id);
			// Solo si no cambió mientras subía; si cambió, sigue pendiente y sube la próxima vez.
			if (current && current.updatedAt === row.updatedAt)
				await table.put({ ...current, pending: 0 });
		}
	}

	async function pushPending(): Promise<number> {
		const pending = await byTableAsync(({ key }) =>
			tables[key].where('pending').equals(1).toArray()
		);
		if (syncTables.every(({ key }) => pending[key].length === 0)) return 0;
		const response = await fetchFn(`${baseUrl}/api/sync/push`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(byTable(({ key }) => pending[key].map(toSyncRow)))
		});
		if (!response.ok) throw new Error(`Subida rechazada (${response.status})`);
		const { accepted } = (await response.json()) as PushResponse;
		await db.transaction('rw', allTables, async () => {
			for (const { key } of syncTables)
				await clearPending(tables[key], pending[key], accepted[key]);
		});
		return syncTables.reduce((total, { key }) => total + accepted[key].length, 0);
	}

	async function pullChanges(): Promise<number> {
		const since = Number((await db.meta.get('cursor'))?.value ?? 0);
		const response = await fetchFn(`${baseUrl}/api/sync/pull?cursor=${since}`);
		if (!response.ok) throw new Error(`Bajada rechazada (${response.status})`);
		const data = (await response.json()) as PullResponse;
		let changed = 0;
		await db.transaction('rw', [...allTables, db.meta], async () => {
			for (const { key } of syncTables) {
				for (const row of data[key]) {
					const local = await tables[key].get(row.id);
					if (!local || row.updatedAt > local.updatedAt) changed++;
					await tables[key].put(mergeRemote(local, { ...row, userId, pending: 0 }));
				}
			}
			await db.meta.put({ key: 'cursor', value: data.cursor });
		});
		return changed;
	}

	/** El cursor es de una cuenta: si el dispositivo sincronizó antes con otra, se baja desde cero. */
	async function resetCursorIfOwnerChanged(): Promise<void> {
		const owner = await db.meta.get('ownerUserId');
		if (owner && owner.value !== userId) await db.meta.bulkDelete(['cursor', 'lastSyncAt']);
	}

	async function run(): Promise<SyncResult> {
		await resetCursorIfOwnerChanged();
		await attachAnonymous();
		const pushed = await pushPending();
		const pulled = await pullChanges();
		await db.meta.bulkPut([
			{ key: 'lastSyncAt', value: now().toISOString() },
			{ key: 'ownerUserId', value: userId }
		]);
		return { pushed, pulled };
	}

	return {
		sync() {
			// Una petición durante una sincronización no se pierde: se repite una vez al terminar.
			if (running) {
				again = true;
				return running;
			}
			running = run()
				.then(async (result) => {
					if (!again) return result;
					again = false;
					const more = await run();
					return { pushed: result.pushed + more.pushed, pulled: result.pulled + more.pulled };
				})
				.finally(() => {
					running = null;
					again = false;
				});
			return running;
		},
		status: () => readStatus(db)
	};
}

/** Si el dispositivo guarda alguna fila sincronizable, de quien sea. */
export async function hasLocalData(db: WorkoutLoggerDb): Promise<boolean> {
	for (const table of deviceTables(db)) if ((await table.count()) > 0) return true;
	return false;
}

/** Si el dispositivo guarda filas de otra cuenta distinta de la que entra. */
export async function hasOtherAccountData(db: WorkoutLoggerDb, userId: string): Promise<boolean> {
	const owners: (string | null)[] = [];
	for (const table of deviceTables(db))
		owners.push(...(await table.toArray()).map((row) => row.userId));
	return ownsOtherAccountData(owners, userId);
}

/** Borra todo lo local (las tablas sincronizadas y el cursor) para entrar con otra cuenta. */
export async function clearLocalData(db: WorkoutLoggerDb): Promise<void> {
	const tables = deviceTables(db);
	await db.transaction('rw', [...tables, db.meta], async () => {
		await Promise.all([...tables.map((table) => table.clear()), db.meta.clear()]);
	});
}

async function readStatus(db: WorkoutLoggerDb): Promise<SyncStatus> {
	let pending = 0;
	for (const table of deviceTables(db)) pending += await table.where('pending').equals(1).count();
	const last = await db.meta.get('lastSyncAt');
	return { pending, lastSyncAt: typeof last?.value === 'string' ? last.value : null };
}

/** Pendientes y última sincronización como consulta viva, para Perfil. */
export function liveSyncStatus(db: WorkoutLoggerDb) {
	return liveQuery(() => readStatus(db));
}
