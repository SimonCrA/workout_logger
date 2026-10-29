import type { Synced } from '#lib/log/types.js';

/**
 * Reglas de fusión de la sincronización (ADR-0001): funciones puras, porque un error aquí es
 * silencioso y destruye datos. Un borrado lógico es una actualización más y compite igual.
 */

/** El servidor acepta una fila si no la tiene o si la que llega se actualizó después. */
export function serverAccepts(
	stored: Pick<Synced, 'updatedAt'> | undefined,
	incoming: Pick<Synced, 'updatedAt'>
): boolean {
	return stored === undefined || incoming.updatedAt > stored.updatedAt;
}

/** En el dispositivo gana la más reciente; si la local es más nueva sigue pendiente de subir. */
export function mergeRemote<T extends Synced>(local: T | undefined, remote: T): T {
	if (local === undefined || remote.updatedAt > local.updatedAt) return { ...remote, pending: 0 };
	if (remote.updatedAt === local.updatedAt) return { ...local, pending: 0 };
	return local;
}

/** Al iniciar sesión por primera vez, lo registrado sin cuenta pasa a la cuenta y se sube. */
export function attachToAccount<T extends Synced>(row: T, userId: string): T {
	return row.userId === null ? { ...row, userId, pending: 1 } : row;
}

/** Hay datos de otra cuenta si alguna fila local tiene un dueño distinto del que entra. */
export function ownsOtherAccountData(owners: readonly (string | null)[], userId: string): boolean {
	return owners.some((owner) => owner !== null && owner !== userId);
}
