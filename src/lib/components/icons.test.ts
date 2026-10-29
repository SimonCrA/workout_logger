import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../../..', import.meta.url));

/** Los símbolos de `static/icons.svg`, que `Icon` dibuja por id. */
function spriteSymbols(): string[] {
	const sprite = readFileSync(join(root, 'static/icons.svg'), 'utf8');
	return [...sprite.matchAll(/<symbol\b[^>]*\bid="([^"]+)"/g)].map((match) => match[1]).sort();
}

/** Los SVG fuente de los que `pnpm build:icons` genera el sprite. */
function sourceIcons(): string[] {
	return readdirSync(join(root, 'src/lib/assets/icons'))
		.filter((file) => file.endsWith('.svg'))
		.map((file) => file.slice(0, -'.svg'.length))
		.sort();
}

/**
 * Los íconos que nombra la app: `<Icon name="x">` en un componente o `icon: 'x'` en datos.
 * Un nombre calculado de otra manera no se ve aquí y hace fallar el test: declárelo en datos.
 */
function referencedIcons(): string[] {
	const names = new Set<string>();
	for (const file of readdirSync(join(root, 'src'), { recursive: true, encoding: 'utf8' })) {
		// Los componentes de shadcn-svelte (`ui/`) usan lucide, no el sprite; los tests no dibujan.
		if (
			!/\.(svelte|ts)$/.test(file) ||
			file.endsWith('.test.ts') ||
			file.startsWith('lib/components/ui/')
		)
			continue;
		const source = readFileSync(join(root, 'src', file), 'utf8');
		for (const match of source.matchAll(/<Icon\b[^>]*\bname="([^"]+)"/g)) names.add(match[1]);
		for (const match of source.matchAll(/\bicon: '([^']+)'/g)) names.add(match[1]);
	}
	return [...names].sort();
}

describe('icon sprite', () => {
	it('has one symbol per source SVG, so a changed icon folder means a regenerated sprite', () => {
		expect(spriteSymbols()).toEqual(sourceIcons());
	});

	it('ships exactly the icons the app references: none missing, none unused', () => {
		expect(sourceIcons()).toEqual(referencedIcons());
	});
});
