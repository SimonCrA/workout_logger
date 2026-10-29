import { defineConfig } from 'drizzle-kit';
import { DEFAULT_DATABASE_URL } from './src/lib/server/db/client';

// Las migraciones se generan desde el esquema y se aplican con `pnpm db:migrate` (ver README).
export default defineConfig({
	dialect: 'turso',
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle',
	dbCredentials: {
		url: process.env.TURSO_DATABASE_URL || DEFAULT_DATABASE_URL,
		authToken: process.env.TURSO_AUTH_TOKEN || undefined
	}
});
