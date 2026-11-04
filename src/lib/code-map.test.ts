import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * El mapa del código y los e2e siguen al repo: lo que una revisión tendría que ir mirando a mano y
 * se olvida (CODING_STANDARDS.md, Documentación y Tests de navegador).
 */
const root = join(import.meta.dirname, '../..');

/** Los módulos de una carpeta: los `.ts` que no son tests. */
const modules = (dir: string) =>
	readdirSync(join(root, dir)).filter((name) => name.endsWith('.ts') && !name.endsWith('.test.ts'));

describe('docs/agents/code-map.md', () => {
	const map = readFileSync(join(root, 'docs/agents/code-map.md'), 'utf8');

	it.each(['src/lib/log', 'src/lib/sync', 'src/lib/catalog'])(
		'names every module of %s, so an agent finds it from the map',
		(dir) => {
			const missing = modules(dir).filter((name) => !map.includes(`\`${name}\``));
			expect(missing, `añade estos módulos de ${dir} a code-map.md`).toEqual([]);
		}
	);
});

describe('e2e', () => {
	it('every browser test imports `test` from e2e/fixtures.ts, which checks the phone width', () => {
		const files = readdirSync(join(root, 'e2e')).filter((name) => name.endsWith('.e2e.ts'));
		const direct = files.filter((name) =>
			/import\s*\{[^}]*\btest\b[^}]*\}\s*from\s*'@playwright\/test'/.test(
				readFileSync(join(root, 'e2e', name), 'utf8')
			)
		);
		expect(direct, "importa `test` y `expect` de './fixtures'").toEqual([]);
	});
});
