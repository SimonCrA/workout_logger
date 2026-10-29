import { error } from '@sveltejs/kit';
import { getExercise } from '#lib/catalog/index.js';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const exercise = getExercise(params.id);
	if (!exercise) error(404, 'No existe ese ejercicio');
	return { exercise };
};
