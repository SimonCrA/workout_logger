import { exercises } from './exercises';
import { muscles } from './muscles';
import type { Exercise, Muscle } from './types';

/** Minúsculas y sin acentos, para comparar lo que se escribe con lo que hay en el catálogo. */
export function fold(text: string): string {
	return text
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim();
}

function matching<T extends { name: string }>(items: readonly T[], query: string): T[] {
	const hits = items
		.map((item) => ({ item, name: fold(item.name) }))
		.filter(({ name }) => name.includes(query));
	const startsWith = hits.filter(({ name }) => name.startsWith(query));
	const contains = hits.filter(({ name }) => !name.startsWith(query));
	return [...startsWith, ...contains].map(({ item }) => item);
}

/** Músculos y ejercicios cuyo nombre contiene lo escrito; primero los que empiezan por ello. */
export function searchCatalog(query: string): { muscles: Muscle[]; exercises: Exercise[] } {
	const q = fold(query);
	if (q === '') return { muscles: [], exercises: [] };
	return { muscles: matching(muscles, q), exercises: matching(exercises, q) };
}
