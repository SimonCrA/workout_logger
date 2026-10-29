import { pushRequest } from '#lib/sync/protocol.js';
import type { Auth } from '../auth/create';
import type { Db } from '../db/client';
import { pull, push } from './sync';

export type SyncContext = { db: Db; auth: Auth };

const json = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

/** El usuario de la sesión que trae la petición, o nada. */
async function sessionUser(request: Request, auth: Auth): Promise<string | null> {
	const session = await auth.api.getSession({ headers: request.headers });
	return session?.user.id ?? null;
}

/** POST /api/sync/push: las filas pendientes del dispositivo. Exige sesión. */
export async function handlePush(request: Request, context: SyncContext): Promise<Response> {
	const userId = await sessionUser(request, context.auth);
	if (!userId) return json({ error: 'Hace falta sesión' }, 401);
	const parsed = pushRequest.safeParse(await request.json().catch(() => null));
	if (!parsed.success) return json({ error: 'Cuerpo inválido' }, 400);
	return json(await push(context.db, userId, parsed.data));
}

/** GET /api/sync/pull?cursor=N: lo cambiado después del cursor. Exige sesión. */
export async function handlePull(request: Request, context: SyncContext): Promise<Response> {
	const userId = await sessionUser(request, context.auth);
	if (!userId) return json({ error: 'Hace falta sesión' }, 401);
	const cursor = Number(new URL(request.url).searchParams.get('cursor') ?? '0');
	if (!Number.isInteger(cursor) || cursor < 0) return json({ error: 'Cursor inválido' }, 400);
	return json(await pull(context.db, userId, cursor));
}
