import { syncContext, unavailable } from '#lib/server/sync/context.js';
import { handlePush } from '#lib/server/sync/http.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const context = await syncContext();
	return context ? handlePush(request, context) : unavailable();
};
