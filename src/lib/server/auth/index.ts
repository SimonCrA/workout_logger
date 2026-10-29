import { dev } from '$app/env';
import { BETTER_AUTH_SECRET, TURSO_AUTH_TOKEN, TURSO_DATABASE_URL } from '$app/env/private';
import { createDb } from '../db/client';
import { createAuth, type Auth } from './create';

let auth: Auth | undefined;

/**
 * La instancia de Better Auth del servidor, creada en la primera petición de cuenta.
 * Sin `BETTER_AUTH_SECRET` fuera de desarrollo no hay cuenta, pero el resto de la app sigue sirviéndose.
 */
export function getAuth(): Auth | undefined {
	if (auth) return auth;
	const secret = BETTER_AUTH_SECRET ?? (dev ? 'solo-para-desarrollo' : undefined);
	if (!secret) {
		console.error('Falta BETTER_AUTH_SECRET: la cuenta no está disponible en este despliegue');
		return undefined;
	}
	auth = createAuth(createDb({ url: TURSO_DATABASE_URL, authToken: TURSO_AUTH_TOKEN }), { secret });
	return auth;
}
