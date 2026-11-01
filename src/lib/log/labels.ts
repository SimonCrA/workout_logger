import type { LoadMode } from '#lib/catalog/index.js';
import type { SetType, Workout, WorkoutMode, WorkoutSet } from './types';

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

/** Los modos como los pregunta "¿Cómo quieres entrenar?" al Empezar. */
export const startModeLabel: Record<WorkoutMode, string> = {
	companion: 'Con acompañamiento',
	log: modeLabel.log
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

/** Cuántas series, como se lee: "1 serie", "3 series". */
export function setCountLabel(count: number): string {
	return count === 1 ? '1 serie' : `${count} series`;
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

const startOfLocalDay = (date: Date) =>
	new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** Días naturales en hora local desde una fecha hasta ahora; el redondeo absorbe el cambio de hora. */
function localDaysAgo(iso: string, now: Date): number {
	const ms = startOfLocalDay(now).getTime() - startOfLocalDay(new Date(iso)).getTime();
	return Math.round(ms / 86_400_000);
}

/** Hace cuánto se hizo una rutina, como se lee en Mis rutinas: "Nunca", "Última vez hoy", "… ayer", "… hace N días". */
export function lastDoneLabel(lastDoneAt: string | null, now: Date): string {
	if (lastDoneAt === null) return 'Nunca';
	const days = localDaysAgo(lastDoneAt, now);
	if (days <= 0) return 'Última vez hoy';
	if (days === 1) return 'Última vez ayer';
	return `Última vez hace ${days} días`;
}

/** La línea de última vez (GLOSSARY): su fecha y sus series, "Última vez (28 oct 2026): 60 kg × 8, 62,5 kg × 8". */
export function lastTimeLine(sets: readonly WorkoutSet[], loadMode: LoadMode): string {
	const series = sets.map((set) => `${formatWeight(set.weight, loadMode)} × ${set.reps}`);
	return `Última vez (${formatDate(sets[0].performedAt)}): ${series.join(', ')}`;
}

const twoDigits = (n: number) => String(n).padStart(2, '0');

/** El descanso como lo marca el contador: "1:32", y con horas solo si llega a una, "1:01:05". */
export function formatRest(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const leading = hours > 0 ? [hours, twoDigits(minutes)] : [minutes];
	return [...leading, twoDigits(seconds % 60)].join(':');
}

/** El tiempo transcurrido como se lee en el encabezado: "47 min", "1 h", "1 h 12 min". */
export function formatElapsed(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	if (hours === 0) return `${minutes} min`;
	return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}
