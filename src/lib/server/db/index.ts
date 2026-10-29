import { TURSO_AUTH_TOKEN, TURSO_DATABASE_URL } from '$app/env/private';
import { createDb, type Db } from './client';

let db: Promise<Db> | undefined;

/** La base del servidor, creada en la primera petición que la necesita. */
export function getDb(): Promise<Db> {
	db ??= createDb({ url: TURSO_DATABASE_URL, authToken: TURSO_AUTH_TOKEN });
	return db;
}
