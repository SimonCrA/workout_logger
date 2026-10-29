import Dexie, { type EntityTable } from 'dexie';
import type { Workout, WorkoutSet } from './types';

/** Valores sueltos del dispositivo: cursor de sincronización, última sincronización, dueño de los datos. */
export type Meta = { key: string; value: string | number | null };

/** La base de datos del dispositivo, la fuente de verdad (ADR-0001). */
export class WorkoutLoggerDb extends Dexie {
	workouts!: EntityTable<Workout, 'id'>;
	sets!: EntityTable<WorkoutSet, 'id'>;
	meta!: EntityTable<Meta, 'key'>;

	constructor(name = 'workout_logger') {
		super(name);
		this.version(1).stores({
			workouts: 'id, startedAt, endedAt, updatedAt, pending',
			sets: 'id, workoutId, exerciseId, performedAt, updatedAt, pending'
		});
		this.version(2).stores({ meta: 'key' });
	}
}

export const db = new WorkoutLoggerDb();
