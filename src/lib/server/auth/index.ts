import { dev } from '$app/env';
import {
	BETTER_AUTH_RATE_LIMIT,
	BETTER_AUTH_SECRET,
	TURSO_AUTH_TOKEN,
	TURSO_DATABASE_URL
} from '$app/env/private';
import { getDb } from '../db/index';
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
				BETTER_AUTH_SECRET: false,
				// Lo que Vercel inyecta siempre: dice en qué entorno y rama corre esta función.
				VERCEL_ENV: process.env.VERCEL_ENV,
				VERCEL_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF
			});
		}
		warned = true;
		return undefined;
	}
	auth = getDb().then((db) => createAuth(db, { secret, rateLimit: BETTER_AUTH_RATE_LIMIT }));
	return auth;
}
