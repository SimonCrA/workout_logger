import { error } from '@sveltejs/kit';
import { getBaseRoutine, getRoutineGroup } from '#lib/catalog/index.js';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const routine = getBaseRoutine(params.id);
	if (!routine) error(404, 'No existe esa rutina');
	return { routine, group: getRoutineGroup(routine.group) };
};
