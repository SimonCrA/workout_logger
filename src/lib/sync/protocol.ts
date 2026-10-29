import { z } from 'zod';
import type { Workout, WorkoutSet } from '#lib/log/types.js';

/** Lo que viaja entre el dispositivo y el servidor (ADR-0001). Las filas van sin la marca local `pending`. */

const iso = z.string().datetime({ offset: true });

const synced = {
	id: z.string().min(1),
	createdAt: iso,
	updatedAt: iso,
	deletedAt: iso.nullable()
};

export const workoutRow = z.object({
	...synced,
	startedAt: iso,
	endedAt: iso.nullable()
});

export const setRow = z.object({
	...synced,
	workoutId: z.string().min(1),
	exerciseId: z.string().min(1),
	reps: z.number().int().min(0),
	weight: z.number().min(0),
	rir: z.number().int().min(0).nullable(),
	type: z.enum(['warmup', 'normal', 'failure', 'drop']),
	note: z.string().nullable(),
	performedAt: iso
});

export const pushRequest = z.object({
	workouts: z.array(workoutRow).max(500),
	sets: z.array(setRow).max(2000)
});

export type WorkoutRow = z.infer<typeof workoutRow>;
export type SetRow = z.infer<typeof setRow>;
export type PushRequest = z.infer<typeof pushRequest>;

export type PushResponse = {
	/** Ids aceptados; el dispositivo limpia la marca de pendiente solo de estos. */
	accepted: { workouts: string[]; sets: string[] };
};

export type PullResponse = {
	workouts: WorkoutRow[];
	sets: SetRow[];
	/** Secuencia del servidor; el dispositivo la guarda y la manda en la próxima bajada. */
	cursor: number;
};

export function toWorkoutRow({ pending: _pending, userId: _userId, ...row }: Workout): WorkoutRow {
	return row;
}

export function toSetRow({ pending: _pending, userId: _userId, ...row }: WorkoutSet): SetRow {
	return row;
}
