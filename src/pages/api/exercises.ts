export const prerender = false;

import type { APIRoute } from 'astro'
import { db, Exercise, Muscle, eq } from 'astro:db'

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url)
    const muscleName = url.searchParams.get('muscle')
    let exercisesDb: any = []

    try {
        if (!muscleName) {
            exercisesDb = await db
                .select({
                    id: Exercise.id,
                    name: Exercise.name,
                    description: Exercise.description,
                    muscle: Muscle.name,
                    muscleCode: Muscle.code
                })
                .from(Exercise)
                .innerJoin(Muscle, eq(Exercise.muscleId, Muscle.id))
        } else {
            exercisesDb = await db
                .select({
                    id: Exercise.id,
                    name: Exercise.name,
                    description: Exercise.description,
                    muscle: Muscle.name,
                    muscleCode: Muscle.code
                })
                .from(Exercise)
                .innerJoin(Muscle, eq(Exercise.muscleId, Muscle.id))
                .where(eq(Muscle.code, muscleName));
        }
        return new Response(JSON.stringify(exercisesDb), {
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
