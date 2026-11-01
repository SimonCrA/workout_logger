import { z } from 'zod';
import type { Synced } from '#lib/log/types.js';
import { byTable, type SyncRows, type SyncTableKey } from './tables';

/** Lo que viaja entre el dispositivo y el servidor (ADR-0001), tabla por tabla según la lista de `tables.ts`. */

export type PushRequest = SyncRows;

/**
 * Construido de la lista, así que el tipo no sale de zod: se afirma. Una tabla que la subida no
 * trae cuenta como vacía: un dispositivo con la app anterior no conoce las tablas nuevas.
 */
export const pushRequest = z.object(
	byTable((table) => z.array(table.row).max(table.maxPerPush).default([]))
) as unknown as z.ZodType<PushRequest>;

export type PushResponse = {
	/** Ids aceptados por tabla; el dispositivo limpia la marca de pendiente solo de estos. */
	accepted: Record<SyncTableKey, string[]>;
};

export type PullResponse = SyncRows & {
	/** Secuencia del servidor; el dispositivo la guarda y la manda en la próxima bajada. */
	cursor: number;
};

/** La fila como viaja: sin la marca local `pending` ni `userId`, que pone el servidor. */
export function toSyncRow<T extends Synced>({
	pending: _pending,
	userId: _userId,
	...row
}: T): Omit<T, 'pending' | 'userId'> {
	return row;
}
