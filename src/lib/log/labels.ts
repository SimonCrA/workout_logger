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
