import type { PageLoad } from './$types';

// El entrenamiento vive en IndexedDB: la página lo observa en directo; aquí solo viaja su id.
export const load: PageLoad = ({ params }) => ({ id: params.id });
