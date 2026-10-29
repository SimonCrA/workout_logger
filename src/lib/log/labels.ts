import type { LoadMode } from '#lib/catalog/index.js';
import type { SetType } from './types';

export const setTypeLabel: Record<SetType, string> = {
	warmup: 'Calentamiento',
	normal: 'Normal',
	failure: 'Fallo',
	drop: 'Drop'
};

/** Qué peso pide el registro según el modo de carga (GLOSSARY: Modo de carga). */
export const weightLabel: Record<LoadMode, string> = {
	external: 'Peso (kg)',
	bodyweight: 'Peso adicional (kg)',
	assisted: 'Asistencia (kg)'
};

/** El peso de una serie tal como se lee: 60 kg, +5 kg o −20 kg. */
export function formatWeight(weight: number, loadMode: LoadMode): string {
	const sign = loadMode === 'bodyweight' ? '+' : loadMode === 'assisted' ? '−' : '';
	return `${sign}${weight} kg`;
}

export function formatDate(iso: string): string {
	return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' }).format(
		new Date(iso)
	);
}
