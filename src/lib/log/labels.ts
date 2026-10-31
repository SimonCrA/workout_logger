import type { LoadMode } from '#lib/catalog/index.js';
import type { SetType, Workout, WorkoutMode } from './types';

export const setTypeLabel: Record<SetType, string> = {
	warmup: 'Calentamiento',
	normal: 'Normal',
	failure: 'Fallo',
	drop: 'Drop'
};

/** Los modos como se eligen (GLOSSARY: Modo). */
export const modeLabel: Record<WorkoutMode, string> = {
	companion: 'Acompañamiento',
	log: 'Solo registrar'
};

/** Cómo se llama un entrenamiento: el nombre copiado de su rutina, o "Libre". */
export function workoutTitle(workout: Pick<Workout, 'title'>): string {
	return workout.title ?? 'Libre';
}

/** Qué peso pide el registro según el modo de carga (GLOSSARY: Modo de carga). */
export const weightLabel: Record<LoadMode, string> = {
	external: 'Peso (kg)',
	bodyweight: 'Peso adicional (kg)',
	assisted: 'Asistencia (kg)'
};

const kgFormat = new Intl.NumberFormat('es', { maximumFractionDigits: 2 });

/** Kilos como se leen en español: 57,5 kg, 12.000 kg. */
export function formatKg(kg: number): string {
	return `${kgFormat.format(kg)} kg`;
}

const weightSign: Record<LoadMode, string> = { external: '', bodyweight: '+', assisted: '−' };

/** El peso de una serie tal como se lee: 60 kg, +5 kg o −20 kg. */
export function formatWeight(weight: number, loadMode: LoadMode): string {
	return `${weightSign[loadMode]}${formatKg(weight)}`;
}

export function formatDate(iso: string): string {
	return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' }).format(
		new Date(iso)
	);
}

/** La hora del día en hora local: 18:05. */
export function formatTime(iso: string): string {
	return new Intl.DateTimeFormat('es', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	}).format(new Date(iso));
}
