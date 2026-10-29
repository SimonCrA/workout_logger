/** Vocabulario del registro; ver GLOSSARY.md (Registro) y ADR-0001. */

/** Columnas que lleva toda fila sincronizable (ADR-0001). `pending` es la marca local de subida. */
export type Synced = {
	/** UUID v7 generado en el cliente. */
	id: string;
	/** Nulo en uso anónimo. */
	userId: string | null;
	createdAt: string;
	updatedAt: string;
	/** Borrado lógico: la fila sigue existiendo para sincronizarse. */
	deletedAt: string | null;
	/** 1 si hay cambios sin subir. Número y no booleano para poder indexarlo. */
	pending: 0 | 1;
};

/** Entrenamiento: lo que se hizo en un día. En esta fase siempre es libre y lo crea la app. */
export type Workout = Synced & {
	startedAt: string;
	endedAt: string | null;
};

/** Las de calentamiento no cuentan para indicadores ni récords (GLOSSARY: Tipo de serie). */
export type SetType = 'warmup' | 'normal' | 'failure' | 'drop';

/** Serie: la unidad mínima del registro. `weight` se interpreta según el modo de carga del ejercicio. */
export type WorkoutSet = Synced & {
	workoutId: string;
	exerciseId: string;
	reps: number;
	weight: number;
	/** Repeticiones en reserva; nulo si no se anotó. */
	rir: number | null;
	type: SetType;
	note: string | null;
	performedAt: string;
};
