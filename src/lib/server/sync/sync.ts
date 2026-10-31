import { and, eq, gt, lte, sql } from 'drizzle-orm';
import type { PullResponse, PushRequest, PushResponse } from '#lib/sync/protocol.js';
import { serverAccepts } from '#lib/sync/rules.js';
import {
	byTable,
	byTableAsync,
	syncTables,
	type SyncRow,
	type SyncTableKey
} from '#lib/sync/tables.js';
import type { Db } from '../db/client';
import { syncCounter } from '../db/schema';
import { serverTables } from './tables';

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/** Una fila guardada en el servidor, por sus columnas comunes. */
type StoredRow = { userId: string; updatedAt: string; seq: number } & Record<string, unknown>;

/** El siguiente valor de la secuencia del servidor, en una sola sentencia atómica. */
async function nextSeq(tx: Tx): Promise<number> {
	await tx.insert(syncCounter).values({ id: 'global', value: 0 }).onConflictDoNothing();
	const [row] = await tx
		.update(syncCounter)
		.set({ value: sql`${syncCounter.value} + 1` })
		.where(eq(syncCounter.id, 'global'))
		.returning();
	return row.value;
}

/** La fila con ese id en la tabla del servidor de `key`, de quien sea, o nada. */
async function storedRow(tx: Tx, key: SyncTableKey, id: unknown): Promise<StoredRow | undefined> {
	const table = serverTables[key];
	return (await tx.select().from(table).where(eq(table.id, id)).get()) as StoredRow | undefined;
}

/**
 * Subida: tabla por tabla en el orden de la lista, cada fila se acepta si no existe o si se
 * actualizó después de la guardada; el resto se ignora. Solo se tocan filas del usuario de la
 * sesión, y una fila con padre solo si el padre es suyo. Responde qué aceptó.
 */
export async function push(db: Db, userId: string, body: PushRequest): Promise<PushResponse> {
	return db.transaction(async (tx) => {
		const accepted = byTable((): string[] => []);
		for (const { key, parent } of syncTables) {
			const table = serverTables[key];
			for (const row of body[key]) {
				const stored = await storedRow(tx, key, row.id);
				if (stored && stored.userId !== userId) continue;
				if (parent) {
					// La columna viene de la lista, no del tipo de cada fila: se lee como dato suelto.
					const parentId = (row as Record<string, unknown>)[parent.column];
					const parentRow = await storedRow(tx, parent.table, parentId);
					if (!parentRow || parentRow.userId !== userId) continue;
				}
				if (!serverAccepts(stored, row)) continue;
				const values = { ...row, userId, seq: await nextSeq(tx) };
				if (stored) await tx.update(table).set(values).where(eq(table.id, row.id));
				else await tx.insert(table).values(values);
				accepted[key].push(row.id);
			}
		}
		return { accepted };
	});
}

/**
 * Bajada: las filas del usuario cambiadas después del cursor, borradas incluidas, tabla por tabla
 * en el orden de la lista, y el cursor nuevo. Todo en una transacción, así ninguna escritura queda
 * entre lo leído y el cursor.
 */
export async function pull(db: Db, userId: string, since: number): Promise<PullResponse> {
	return db.transaction(async (tx) => {
		const counter = await tx.select().from(syncCounter).where(eq(syncCounter.id, 'global')).get();
		const cursor = counter?.value ?? 0;
		const rows = await byTableAsync(async ({ key }) => {
			const table = serverTables[key];
			const changed = (await tx
				.select()
				.from(table)
				.where(and(eq(table.userId, userId), gt(table.seq, since), lte(table.seq, cursor)))
				.orderBy(table.seq)) as StoredRow[];
			return changed.map(({ userId: _u, seq: _s, ...row }) => row as SyncRow);
		});
		return { ...rows, cursor } as PullResponse;
	});
}
