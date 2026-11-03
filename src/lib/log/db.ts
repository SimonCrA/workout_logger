import Dexie, { type EntityTable } from 'dexie';
import {
	DEFAULT_MODE,
	type BodyWeight,
	type Profile,
	type Routine,
	type Workout,
	type WorkoutSet
} from './types';

/** Valores sueltos del dispositivo: cursor de sincronización, última sincronización, dueño de los datos. */
export type Meta = { key: string; value: string | number | null };

/** La base de datos del dispositivo, la fuente de verdad (ADR-0001). */
export class WorkoutLoggerDb extends Dexie {
	routines!: EntityTable<Routine, 'id'>;
	workouts!: EntityTable<Workout, 'id'>;
	sets!: EntityTable<WorkoutSet, 'id'>;
	profiles!: EntityTable<Profile, 'id'>;
	bodyWeights!: EntityTable<BodyWeight, 'id'>;
	meta!: EntityTable<Meta, 'key'>;

	constructor(name = 'workout_logger') {
		super(name);
		this.version(1).stores({
			workouts: 'id, startedAt, endedAt, updatedAt, pending',
			sets: 'id, workoutId, exerciseId, performedAt, updatedAt, pending'
		});
		this.version(2).stores({ meta: 'key' });
		// Fase 2: el entrenamiento gana rutina, nombre y modo; los de antes pasan a libres en acompañamiento.
		this.version(3).upgrade((tx) =>
			tx
				.table('workouts')
				.toCollection()
				.modify((workout: Partial<Workout>) => {
					workout.routineId ??= null;
					workout.title ??= null;
					workout.mode ??= DEFAULT_MODE;
				})
		);
		// Rutinas personalizadas (#14): la lista de ejercicios va dentro de la fila, sin índice.
		this.version(4).stores({ routines: 'id, updatedAt, pending' });
		// Perfil y peso corporal (#26). La app anterior bajaba sus filas sin guardarlas y movía el
		// cursor igual: se baja otra vez desde el principio para recibirlas (la fusión no duplica).
		this.version(5)
			.stores({
				profiles: 'id, updatedAt, pending',
				bodyWeights: 'id, date, updatedAt, pending'
			})
			.upgrade((tx) => tx.table('meta').delete('cursor'));
	}
}

export const db = new WorkoutLoggerDb();
