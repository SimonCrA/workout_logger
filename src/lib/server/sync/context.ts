import { getAuth } from '../auth/index';
import { getDb } from '../db/index';
import type { SyncContext } from './http';

/** Base y cuenta del servidor para los manejadores de sincronización; nada si la cuenta no está configurada. */
export async function syncContext(): Promise<SyncContext | undefined> {
	const auth = getAuth();
	if (!auth) return undefined;
	return { db: await getDb(), auth: await auth };
}

export const unavailable = () =>
	new Response('La cuenta no está configurada en este servidor', { status: 503 });
