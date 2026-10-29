import { dev } from '$app/env';
import { BETTER_AUTH_SECRET, TURSO_AUTH_TOKEN, TURSO_DATABASE_URL } from '$app/env/private';
import { createDb } from '../db/client';
import { createAuth, type Auth } from './create';

let auth: Promise<Auth> | undefined;
let warned = false;

/**
 * La instancia de Better Auth del servidor, creada en la primera petición de cuenta.
 * Sin `BETTER_AUTH_SECRET` fuera de desarrollo no hay cuenta, pero el resto de la app sigue sirviéndose.
 */
export function getAuth(): Promise<Auth> | undefined {
	if (auth) return auth;
	const secret = BETTER_AUTH_SECRET ?? (dev ? 'solo-para-desarrollo' : undefined);
	if (!secret) {
		if (!warned) {
			// Solo presencia, nunca valores: distingue un alcance mal puesto en Vercel de un nombre mal escrito.
			console.error('Falta BETTER_AUTH_SECRET: la cuenta no está disponible en este despliegue', {
				TURSO_DATABASE_URL: TURSO_DATABASE_URL !== 'file:local.db',
				TURSO_AUTH_TOKEN: TURSO_AUTH_TOKEN !== undefined,
				BETTER_AUTH_SECRET: false
			});
		}
		warned = true;
		return undefined;
	}
	auth = createDb({ url: TURSO_DATABASE_URL, authToken: TURSO_AUTH_TOKEN }).then((db) =>
		createAuth(db, { secret })
	);
	return auth;
}
