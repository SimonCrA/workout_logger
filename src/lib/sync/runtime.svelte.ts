import { db } from '#lib/log/db.js';
import { clearLocalData, createSyncClient, hasOtherAccountData, type SyncClient } from './client';

/**
 * La sincronización en la app: con sesión, sube y baja al abrir, al recuperar red, al volver a
 * primer plano y tras cada registro. No hay botón de guardar (ADR-0001).
 */
export const syncState = $state({
	/** Hay datos locales de otra cuenta: no se sincroniza hasta que la persona decida. */
	otherAccountData: false,
	error: null as string | null
});

let client: SyncClient | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;

/** La sesión cambió: con cuenta se prepara el cliente y se sincroniza; sin cuenta se para. */
export async function setSyncAccount(account: { id: string; email: string } | null): Promise<void> {
	client = null;
	syncState.otherAccountData = false;
	if (!account) return;
	if (await hasOtherAccountData(db, account.id)) {
		syncState.otherAccountData = true;
		return;
	}
	await db.meta.put({ key: 'ownerEmail', value: account.email });
	client = createSyncClient({ db, userId: account.id });
	requestSync();
}

/** Sincroniza en breve; varias peticiones seguidas se agrupan en una. */
export function requestSync(): void {
	if (!client) return;
	clearTimeout(timer);
	timer = setTimeout(() => {
		client
			?.sync()
			.then(() => (syncState.error = null))
			.catch((error: unknown) => {
				syncState.error = error instanceof Error ? error.message : 'No se pudo sincronizar';
			});
	}, 300);
}

/** Borra lo local de la otra cuenta y sigue con la que tiene sesión. */
export async function discardOtherAccountData(account: {
	id: string;
	email: string;
}): Promise<void> {
	await clearLocalData(db);
	await setSyncAccount(account);
}

/** Escucha los disparadores del navegador; devuelve cómo dejar de escuchar. */
export function startSyncTriggers(): () => void {
	const onVisible = () => {
		if (document.visibilityState === 'visible') requestSync();
	};
	window.addEventListener('online', requestSync);
	document.addEventListener('visibilitychange', onVisible);
	return () => {
		window.removeEventListener('online', requestSync);
		document.removeEventListener('visibilitychange', onVisible);
	};
}
