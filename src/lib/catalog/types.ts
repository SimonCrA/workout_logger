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
