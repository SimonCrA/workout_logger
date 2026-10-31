/** Vocabulario del catálogo base; ver GLOSSARY.md (Catálogo) y ADR-0004. */

export type View = 'front' | 'back';

/** Equipo con que se hace un ejercicio (GLOSSARY: Equipo). */
export type Equipment = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight' | 'other';

/** Cómo se interpreta el peso de una serie (GLOSSARY: Modo de carga). */
export type LoadMode = 'external' | 'bodyweight' | 'assisted';

/** Un área del mapa corporal; `id` es el id del elemento en `muscle-map.svg`. */
export type Region = {
	id: string;
	view: View;
};

export type Muscle = {
	code: string;
	name: string;
	/** Una línea para la hoja del músculo. */
	description: string;
	/** Una o más regiones; los aductores tienen una delante y otra detrás. */
	regions: readonly Region[];
};

export type Exercise = {
	/** Slug estable; es lo que referencian las series. */
	id: string;
	name: string;
	description: string;
	equipment: Equipment;
	loadMode: LoadMode;
	primaryMuscle: string;
	secondaryMuscles: readonly string[];
};

/** Lo que una rutina prescribe para un ejercicio (GLOSSARY: Objetivo), más RIR y descanso opcionales. */
export type RoutineExercise = {
	exerciseId: string;
	sets: number;
	repsMin: number;
	repsMax: number;
	/** RIR objetivo; nulo si la rutina no lo prescribe. */
	rir: number | null;
	/** Descanso sugerido en segundos; nulo si la rutina no lo prescribe. */
	rest: number | null;
};

/** Rutinas base pensadas para hacerse juntas en rotación (GLOSSARY: Grupo). Solo ordena el catálogo. */
export type RoutineGroup = {
	id: string;
	name: string;
	/** Una línea para la cabecera del grupo. */
	description: string;
};

/** Una rutina que viene con la app (GLOSSARY: Rutina base): se copia, no se edita ni se empieza. */
export type BaseRoutine = {
	/** Slug estable; es lo que recuerda una rutina personalizada copiada de esta. */
	id: string;
	name: string;
	/** El id de su grupo. */
	group: string;
	/** Una línea para la lista y el detalle. */
	description: string;
	/** En el orden en que se hacen. */
	exercises: readonly RoutineExercise[];
};
