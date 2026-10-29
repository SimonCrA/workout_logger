import type { WorkoutLoggerDb } from '#lib/log/db.js';
import type { Synced } from '#lib/log/types.js';
import { liveQuery } from 'dexie';
import { toSetRow, toWorkoutRow, type PullResponse, type PushResponse } from './protocol';
import { attachToAccount, mergeRemote, ownsOtherAccountData } from './rules';

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

export function createSyncClient(options: SyncClientOptions): SyncClient {
	const { db, userId, baseUrl = '', now = () => new Date() } = options;
	const fetchFn = options.fetch ?? ((input, init) => fetch(input, init));
	let running: Promise<SyncResult> | null = null;
	let again = false;

	async function attachAnonymous(): Promise<void> {
		await db.transaction('rw', db.workouts, db.sets, async () => {
			const workouts = await db.workouts.filter((row) => row.userId === null).toArray();
			if (workouts.length > 0)
				await db.workouts.bulkPut(workouts.map((row) => attachToAccount(row, userId)));
			const sets = await db.sets.filter((row) => row.userId === null).toArray();
			if (sets.length > 0) await db.sets.bulkPut(sets.map((row) => attachToAccount(row, userId)));
		});
	}

	async function clearPending<T extends Synced>(
		table: {
			get(id: string): PromiseLike<NoInfer<T> | undefined>;
			put(row: NoInfer<T>): PromiseLike<unknown>;
		},
		pushed: T[],
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
		const workouts = await db.workouts.where('pending').equals(1).toArray();
		const sets = await db.sets.where('pending').equals(1).toArray();
		if (workouts.length === 0 && sets.length === 0) return 0;
		const response = await fetchFn(`${baseUrl}/api/sync/push`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ workouts: workouts.map(toWorkoutRow), sets: sets.map(toSetRow) })
		});
		if (!response.ok) throw new Error(`Subida rechazada (${response.status})`);
		const { accepted } = (await response.json()) as PushResponse;
		await db.transaction('rw', db.workouts, db.sets, async () => {
			await clearPending(db.workouts, workouts, accepted.workouts);
			await clearPending(db.sets, sets, accepted.sets);
		});
		return accepted.workouts.length + accepted.sets.length;
	}

	async function pullChanges(): Promise<number> {
		const since = Number((await db.meta.get('cursor'))?.value ?? 0);
		const response = await fetchFn(`${baseUrl}/api/sync/pull?cursor=${since}`);
		if (!response.ok) throw new Error(`Bajada rechazada (${response.status})`);
		const data = (await response.json()) as PullResponse;
		let changed = 0;
		await db.transaction('rw', db.workouts, db.sets, db.meta, async () => {
			for (const row of data.workouts) {
				const local = await db.workouts.get(row.id);
				if (!local || row.updatedAt > local.updatedAt) changed++;
				await db.workouts.put(mergeRemote(local, { ...row, userId, pending: 0 }));
			}
			for (const row of data.sets) {
				const local = await db.sets.get(row.id);
				if (!local || row.updatedAt > local.updatedAt) changed++;
				await db.sets.put(mergeRemote(local, { ...row, userId, pending: 0 }));
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

/** Si el dispositivo guarda filas de otra cuenta distinta de la que entra. */
export async function hasOtherAccountData(db: WorkoutLoggerDb, userId: string): Promise<boolean> {
	const owners = [
		...(await db.workouts.toArray()).map((row) => row.userId),
		...(await db.sets.toArray()).map((row) => row.userId)
	];
	return ownsOtherAccountData(owners, userId);
}

/** Borra todo lo local (series, entrenamientos y cursor) para entrar con otra cuenta. */
export async function clearLocalData(db: WorkoutLoggerDb): Promise<void> {
	await db.transaction('rw', db.workouts, db.sets, db.meta, async () => {
		await Promise.all([db.workouts.clear(), db.sets.clear(), db.meta.clear()]);
	});
}

async function readStatus(db: WorkoutLoggerDb): Promise<SyncStatus> {
	const pending =
		(await db.workouts.where('pending').equals(1).count()) +
		(await db.sets.where('pending').equals(1).count());
	const last = await db.meta.get('lastSyncAt');
	return { pending, lastSyncAt: typeof last?.value === 'string' ? last.value : null };
}

/** Pendientes y última sincronización como consulta viva, para Perfil. */
export function liveSyncStatus(db: WorkoutLoggerDb) {
	return liveQuery(() => readStatus(db));
}
