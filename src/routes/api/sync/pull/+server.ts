import { syncContext, unavailable } from '#lib/server/sync/context.js';
import { handlePull } from '#lib/server/sync/http.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request }) => {
	const context = await syncContext();
	return context ? handlePull(request, context) : unavailable();
};
