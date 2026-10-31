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

/** Modo: cómo acompaña la app un entrenamiento (GLOSSARY: Acompañamiento, Solo registrar). */
export type WorkoutMode = 'companion' | 'log';

/**
 * Entrenamiento: lo que se hizo en un día. Nace de una rutina o es libre (ADR-0006). Mientras
 * `endedAt` es nulo está en curso; nunca hay dos y ninguno se reabre.
 */
export type Workout = Synced & {
	/** La rutina de la que nació, o nada si es libre. */
	routineId: string | null;
	/** El nombre de la rutina al empezar, copiado porque la rutina puede cambiar o borrarse después. */
	title: string | null;
	mode: WorkoutMode;
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
