import { readFileSync } from 'node:fs';
import { sql } from 'drizzle-orm';
import { createDb, DEFAULT_DATABASE_URL } from '../src/lib/server/db/client.js';

// Uso: pnpm db:status   (solo lee; la base es la de TURSO_* en .env o, sin ellas, la local; ver README)
// Compara las migraciones de `drizzle/` con las aplicadas en la base: drizzle guarda cada una con el
// `when` de su entrada en `drizzle/meta/_journal.json`.
const journal: { entries: { tag: string; when: number }[] } = JSON.parse(
	readFileSync(new URL('../drizzle/meta/_journal.json', import.meta.url), 'utf8')
);
const url = process.env.TURSO_DATABASE_URL || DEFAULT_DATABASE_URL;

try {
	const db = await createDb({ url, authToken: process.env.TURSO_AUTH_TOKEN });
	const rows = await db
		.all<{ created_at: number }>(sql`select created_at from __drizzle_migrations`)
		.catch(() => []);
	const applied = new Set(rows.map((row) => Number(row.created_at)));
	const pending = journal.entries.filter((entry) => !applied.has(entry.when));

	console.log(`Base: ${url.replace(/\?.*$/, '')}`);
	for (const entry of journal.entries) {
		console.log(`${applied.has(entry.when) ? 'aplicada ' : 'PENDIENTE'}  ${entry.tag}`);
	}
	if (pending.length > 0) {
		console.log(
			`\n${pending.length} sin aplicar: el dueño corre \`pnpm db:migrate\` antes de fusionar.`
		);
		process.exit(1);
	}
	console.log('\nAl día.');
} catch (error) {
	console.error(error instanceof Error ? error.message : error);
	process.exit(2);
}
