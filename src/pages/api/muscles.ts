export const prerender = false;

import type { APIRoute } from 'astro'
import { db, Muscle, eq } from 'astro:db'

export const GET: APIRoute = async () => {
    try {
        const musclesDb = await db
            .select()
            .from(Muscle)
            .where(eq(Muscle.isActive, true));

        return new Response(JSON.stringify(musclesDb), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Database query failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
