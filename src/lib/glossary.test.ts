import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Los textos de la interfaz no usan las palabras que GLOSSARY.md marca con `_Avoid_`. La lista sale
 * del glosario en cada corrida, así que una palabra nueva a evitar se comprueba sin tocar este test.
 */
const root = join(import.meta.dirname, '../..');
const glossary = readFileSync(join(root, 'GLOSSARY.md'), 'utf8');

/** Los términos del glosario: una palabra a evitar en una entrada puede ser el término de otra ("perfil"). */
const termNames = new Set(
	[...glossary.matchAll(/^\*\*([^*]+)\*\*/gm)].map((m) => m[1].trim().toLowerCase())
);

/** Palabras a evitar como nombre de un término que siguen siendo español corriente en otro sentido. */
const COMMON_WORDS = new Set(['parte', 'peso', 'movimiento', 'máximo', 'mínimo', 'anterior']);

/** Frases legítimas que contienen una palabra a evitar: la sesión de la cuenta y el nombre de la app. */
const ALLOWED_PHRASES = [
	/(iniciar|cerrar|cierres|falta) sesión|sesión iniciada/g,
	/workout logger/g
];

const avoided = [...glossary.matchAll(/^_Avoid_: (.+)$/gm)]
	.flatMap((m) => m[1].replace(/\([^)]*\)/g, '').split(','))
	.map((word) => word.trim().toLowerCase())
	.filter((word) => word && !termNames.has(word) && !COMMON_WORDS.has(word));

function sourceFiles(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) return entry.name === 'ui' ? [] : sourceFiles(path);
		return /\.(ts|svelte)$/.test(entry.name) && !entry.name.endsWith('.test.ts') ? [path] : [];
	});
}

/** Lo que puede llegar a la pantalla: literales con espacios o acentos (no ids) y, en Svelte, el texto del marcado. */
function visibleTexts(source: string, svelte: boolean): string[] {
	const code = source
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/\/\*[\s\S]*?\*\//g, '')
		.replace(/(^|[^:])\/\/.*$/gm, '$1')
		.replace(/<style[\s\S]*?<\/style>/g, '');
	const literals = [...code.matchAll(/'([^'\n]*)'|"([^"\n]*)"|`([^`]*)`/g)]
		.map((m) => (m[1] ?? m[2] ?? m[3]).replace(/\$\{[^}]*\}/g, ' '))
		.filter((text) => /[\sÀ-ɏ]/.test(text));
	if (!svelte) return literals;
	// Las expresiones `{...}` se quitan de dentro hacia fuera antes que las etiquetas: un `=>` cortaría la etiqueta.
	let markup = code.replace(/<script[\s\S]*?<\/script>/g, '');
	while (/\{[^{}]*\}/.test(markup)) markup = markup.replace(/\{[^{}]*\}/g, ' ');
	return [...literals, ...markup.replace(/<[^>]*>/g, '\n').split('\n')];
}

function hasWord(text: string, word: string): boolean {
	const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	return new RegExp(`(^|[^\\p{L}])${escaped}($|[^\\p{L}])`, 'u').test(text);
}

describe('vocabulario de la interfaz (GLOSSARY.md)', () => {
	it('lee las palabras a evitar del glosario', () => {
		expect(avoided).toContain('sesión');
		expect(avoided).toContain('plantilla');
		expect(avoided).not.toContain('perfil');
	});

	it('ningún texto de la interfaz usa una palabra a evitar', () => {
		const found: string[] = [];
		for (const file of sourceFiles(join(root, 'src'))) {
			const texts = visibleTexts(readFileSync(file, 'utf8'), file.endsWith('.svelte'));
			for (const text of texts) {
				const lower = ALLOWED_PHRASES.reduce(
					(t, phrase) => t.replace(phrase, ' '),
					text.toLowerCase()
				);
				for (const word of avoided) {
					if (hasWord(lower, word))
						found.push(`${relative(root, file)}: "${word}" en "${text.trim()}"`);
				}
			}
		}
		expect(found).toEqual([]);
	});
});
