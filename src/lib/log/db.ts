import Dexie, { type EntityTable } from 'dexie';
import type { Workout, WorkoutSet } from './types';

/** La base de datos del dispositivo, la fuente de verdad (ADR-0001). */
export class WorkoutLoggerDb extends Dexie {
	workouts!: EntityTable<Workout, 'id'>;
	sets!: EntityTable<WorkoutSet, 'id'>;

	constructor() {
		super('workout_logger');
		this.version(1).stores({
			workouts: 'id, startedAt, endedAt, updatedAt, pending',
			sets: 'id, workoutId, exerciseId, performedAt, updatedAt, pending'
		});
	}
}

export const db = new WorkoutLoggerDb();
