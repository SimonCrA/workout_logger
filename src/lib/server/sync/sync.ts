import { and, eq, gt, lte, sql } from 'drizzle-orm';
import type {
	PullResponse,
	PushRequest,
	PushResponse,
	SetRow,
	WorkoutRow
} from '#lib/sync/protocol.js';
import { serverAccepts } from '#lib/sync/rules.js';
import type { Db } from '../db/client';
import { syncCounter, workout, workoutSet } from '../db/schema';

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/** El siguiente valor de la secuencia del servidor, en una sola sentencia atómica. */
async function nextSeq(tx: Tx): Promise<number> {
	await tx.insert(syncCounter).values({ id: 'global', value: 0 }).onConflictDoNothing();
	const [row] = await tx
		.update(syncCounter)
		.set({ value: sql`${syncCounter.value} + 1` })
		.where(eq(syncCounter.id, 'global'))
		.returning();
	return row.value;
}

/**
 * Subida: cada fila se acepta si no existe o si se actualizó después de la guardada; el resto se
 * ignora. Solo se tocan filas del usuario de la sesión. Responde qué aceptó.
 */
export async function push(db: Db, userId: string, body: PushRequest): Promise<PushResponse> {
	return db.transaction(async (tx) => {
		const accepted: PushResponse['accepted'] = { workouts: [], sets: [] };
		for (const row of body.workouts) {
			const stored = await tx.select().from(workout).where(eq(workout.id, row.id)).get();
			if (stored && stored.userId !== userId) continue;
			if (!serverAccepts(stored, row)) continue;
			const values = { ...row, userId, seq: await nextSeq(tx) };
			if (stored) await tx.update(workout).set(values).where(eq(workout.id, row.id));
			else await tx.insert(workout).values(values);
			accepted.workouts.push(row.id);
		}
		for (const row of body.sets) {
			const stored = await tx.select().from(workoutSet).where(eq(workoutSet.id, row.id)).get();
			if (stored && stored.userId !== userId) continue;
			if (!serverAccepts(stored, row)) continue;
			const values = { ...row, userId, seq: await nextSeq(tx) };
			if (stored) await tx.update(workoutSet).set(values).where(eq(workoutSet.id, row.id));
			else await tx.insert(workoutSet).values(values);
			accepted.sets.push(row.id);
		}
		return { accepted };
	});
}

/**
 * Bajada: las filas del usuario cambiadas después del cursor, borradas incluidas, y el cursor
 * nuevo. Todo en una transacción, así ninguna escritura queda entre lo leído y el cursor.
 */
export async function pull(db: Db, userId: string, since: number): Promise<PullResponse> {
	return db.transaction(async (tx) => {
		const counter = await tx.select().from(syncCounter).where(eq(syncCounter.id, 'global')).get();
		const cursor = counter?.value ?? 0;
		const workouts = await tx
			.select()
			.from(workout)
			.where(and(eq(workout.userId, userId), gt(workout.seq, since), lte(workout.seq, cursor)))
			.orderBy(workout.seq);
		const sets = await tx
			.select()
			.from(workoutSet)
			.where(
				and(eq(workoutSet.userId, userId), gt(workoutSet.seq, since), lte(workoutSet.seq, cursor))
			)
			.orderBy(workoutSet.seq);
		return {
			workouts: workouts.map(({ userId: _u, seq: _s, ...row }): WorkoutRow => row),
			sets: sets.map(({ userId: _u, seq: _s, ...row }): SetRow => ({
				...row,
				type: row.type as SetRow['type']
			})),
			cursor
		};
	});
}
