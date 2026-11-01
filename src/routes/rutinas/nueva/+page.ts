import { error } from '@sveltejs/kit';
import { getBaseRoutine } from '#lib/catalog/index.js';
import { draftFromBase, emptyDraft } from '#lib/log/routine-rules.js';
import type { PageLoad } from './$types';

/** El editor vacío ("Desde cero") o, con `?base=<id>`, con la copia de esa rutina base. */
export const load: PageLoad = ({ url }) => {
	const baseId = url.searchParams.get('base');
	if (baseId === null) return { draft: emptyDraft(), base: undefined };
	const base = getBaseRoutine(baseId);
	if (!base) error(404, 'No existe esa rutina');
	return { draft: draftFromBase(base), base };
};
