import { building } from '$app/env';
import type { Handle } from '@sveltejs/kit/hooks';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { getAuth } from '#lib/server/auth/index.js';

/** Better Auth atiende `/api/auth/*`; todo lo demás sigue su camino. */
export const handle: Handle = async ({ event, resolve }) => {
	if (!event.url.pathname.startsWith('/api/auth/')) return resolve(event);
	const auth = getAuth();
	if (!auth) return new Response('La cuenta no está configurada en este servidor', { status: 503 });
	return svelteKitHandler({ auth, event, resolve, building });
};
