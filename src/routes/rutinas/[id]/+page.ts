import type { PageLoad } from './$types';

// La rutina vive en IndexedDB: la página la observa en directo; aquí solo viaja su id.
export const load: PageLoad = ({ params }) => ({ id: params.id });
