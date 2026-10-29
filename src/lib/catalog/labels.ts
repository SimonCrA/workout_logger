import type { Equipment, LoadMode } from './types';

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
