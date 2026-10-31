import type { Equipment, LoadMode, RoutineExercise } from './types';

/** Textos de la interfaz para los valores del catálogo (GLOSSARY: Equipo, Modo de carga). */
export const equipmentLabel: Record<Equipment, string> = {
	barbell: 'Barra',
	dumbbell: 'Mancuerna',
	machine: 'Máquina',
	cable: 'Polea',
	bodyweight: 'Peso corporal',
	other: 'Otro'
};

export const loadModeLabel: Record<LoadMode, string> = {
	external: 'Carga externa',
	bodyweight: 'Peso corporal más adicional',
	assisted: 'Peso corporal menos asistencia'
};

/** El objetivo como se lee: "3 × 8–12", o "4 × 10" si el rango es un solo valor (GLOSSARY: Objetivo). */
export function objectiveLabel(
	entry: Pick<RoutineExercise, 'sets' | 'repsMin' | 'repsMax'>
): string {
	const reps =
		entry.repsMin === entry.repsMax ? `${entry.repsMin}` : `${entry.repsMin}–${entry.repsMax}`;
	return `${entry.sets} × ${reps}`;
}

/** El descanso sugerido como se lee: "90 s". */
export function restLabel(seconds: number): string {
	return `${seconds} s`;
}
