/** Vocabulario del registro y de la planificación; ver GLOSSARY.md (Registro, Planificación) y ADR-0001. */
import type { RoutineExercise } from '#lib/catalog/types.js';

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
export const WORKOUT_MODES = ['companion', 'log'] as const;
export type WorkoutMode = (typeof WORKOUT_MODES)[number];
/** El modo mientras no se elige otro, y el de los entrenamientos anteriores a que existiera el modo. */
export const DEFAULT_MODE: WorkoutMode = 'companion';
export const isWorkoutMode = (value: unknown): value is WorkoutMode =>
	(WORKOUT_MODES as readonly unknown[]).includes(value);

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

/**
 * Rutina personalizada: la única que se edita y se empieza. La lista ordenada de ejercicios con su
 * objetivo va embebida en la fila como un solo valor, así editar o reordenar es un cambio y un
 * conflicto entre dispositivos se resuelve por rutina entera, "la más reciente gana".
 */
export type Routine = Synced & {
	name: string;
	/** La rutina base de la que se copió, o nada si nació desde cero. */
	baseRoutineId: string | null;
	exercises: RoutineExercise[];
};

/** Hacia dónde fue un número de la semana frente a los 7 días anteriores (dashboard de Hoy). */
export type Trend = 'up' | 'down' | 'same';

/** "Músculos en banda: n de m": cuántos alcanzan la banda objetivo, de cuántos con ejercicios. */
export type BandCount = { inBand: number; of: number };

/** Las vistas del gráfico de un ejercicio: "Peso máximo" (línea), "Volumen" y "Reps" (barras). */
export type ExerciseChartView = 'maxWeight' | 'volume' | 'reps';
