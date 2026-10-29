import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { fileURLToPath } from 'node:url';
import * as schema from './schema';

/** Base de desarrollo cuando no hay `TURSO_DATABASE_URL`. */
export const DEFAULT_DATABASE_URL = 'file:local.db';

export type DbConfig = {
	/** `libsql://...` en Turso o `file:...` en local. */
	url: string;
	authToken?: string;
};

export type Db = LibSQLDatabase<typeof schema>;

/**
 * Drizzle sobre libSQL. Un archivo local usa el cliente nativo; una base remota (Turso) usa el
 * cliente HTTP, sin binarios nativos: las funciones de Vercel no los empaquetan.
 */
export async function createDb(config: DbConfig): Promise<Db> {
	if (config.url.startsWith('file:')) {
		const [{ createClient }, { drizzle }] = await Promise.all([
			import('@libsql/client'),
			import('drizzle-orm/libsql')
		]);
		return drizzle(createClient({ url: config.url }), { schema });
	}
	const [{ createClient }, { drizzle }] = await Promise.all([
		import('@libsql/client/web'),
		import('drizzle-orm/libsql/web')
	]);
	const client = createClient({ url: config.url, authToken: config.authToken || undefined });
	return drizzle(client, { schema });
}

const migrationsFolder = fileURLToPath(new URL('../../../../drizzle', import.meta.url));

/** Aplica las migraciones de `drizzle/` (tests y bases locales; en Turso se usa `pnpm db:migrate`). */
export async function migrateDb(db: Db): Promise<void> {
	await migrate(db, { migrationsFolder });
}
