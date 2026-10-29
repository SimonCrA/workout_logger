import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { fileURLToPath } from 'node:url';
import * as schema from './schema';

export type DbConfig = {
	/** `libsql://...` en Turso o `file:...` en local. */
	url: string;
	authToken?: string;
};

/** Drizzle sobre libSQL: Turso en producción, un archivo en desarrollo y tests. */
export function createDb(config: DbConfig) {
	const client = createClient({ url: config.url, authToken: config.authToken || undefined });
	return drizzle(client, { schema });
}

export type Db = ReturnType<typeof createDb>;

const migrationsFolder = fileURLToPath(new URL('../../../../drizzle', import.meta.url));

/** Aplica las migraciones de `drizzle/` (tests y bases locales; en Turso se usa `pnpm db:migrate`). */
export async function migrateDb(db: Db): Promise<void> {
	await migrate(db, { migrationsFolder });
}
