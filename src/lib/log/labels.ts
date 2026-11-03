import { exerciseCountLabel, type LoadMode } from '#lib/catalog/index.js';
import { parseDay } from './profile-rules';
import type { BrokenRecord } from './records';
import type {
	BandCount,
	ExerciseChartView,
	SetType,
	Sex,
	Trend,
	Workout,
	WorkoutMode,
	WorkoutSet
} from './types';

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

/** Una cuenta como se lee en español: 3, 2,5 series por músculo, 12.000 reps. */
export function formatCount(count: number): string {
	return kgFormat.format(count);
}

/** Kilos como se leen en español: 57,5 kg, 12.000 kg. */
export function formatKg(kg: number): string {
	return `${kgFormat.format(kg)} kg`;
}

const timesFormat = new Intl.NumberFormat('es', {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
});

/** Una fuerza relativa en el eje y el tooltip del gráfico: 1,45 ×. */
export function formatTimes(times: number): string {
	return `${timesFormat.format(times)} ×`;
}

/** Una fuerza relativa en su cuadro: 1,45 × peso corporal. */
export function formatRelativeStrength(times: number): string {
	return `${formatTimes(times)} peso corporal`;
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

const dayFormat = new Intl.DateTimeFormat('es', {
	day: 'numeric',
	month: 'short',
	year: 'numeric'
});

/** Un día local sin hora ("2026-11-02") como se lee: "2 nov 2026". Se arma en hora local, no en UTC. */
export function formatDay(date: string): string {
	return dayFormat.format(parseDay(date));
}

/** El sexo del perfil; sin indicar no tiene valor guardado. */
export const sexLabel: Record<Sex, string> = { male: 'Hombre', female: 'Mujer' };

const dayMonthFormat = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' });

/** Un día local sin el año, como lo leen los ejes de los gráficos: "26 oct". */
export function formatDayMonth(date: Date): string {
	return dayMonthFormat.format(date);
}

/** La hora del día en hora local: 18:05. */
export function formatTime(iso: string): string {
	return new Intl.DateTimeFormat('es', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	}).format(new Date(iso));
}

/** Un instante como lo lee un campo `datetime-local`: la fecha y la hora locales al minuto, "2026-10-30T18:05". */
export function toDatetimeLocal(iso: string): string {
	const date = new Date(iso);
	const parts = [
		date.getFullYear(),
		date.getMonth() + 1,
		date.getDate(),
		date.getHours(),
		date.getMinutes()
	];
	const [year, month, day, hours, minutes] = parts.map((n) => String(n).padStart(2, '0'));
	return `${year}-${month}-${day}T${hours}:${minutes}`;
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

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** El día de un entrenamiento como lo lee Historial: "Hoy", "Ayer" o el día de la semana con la fecha, "Miércoles, 28 oct". */
export function relativeDayLabel(iso: string, now: Date): string {
	const days = localDaysAgo(iso, now);
	if (days <= 0) return 'Hoy';
	if (days === 1) return 'Ayer';
	return capitalize(
		new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'short' }).format(
			new Date(iso)
		)
	);
}

/** Un mes como separador de Historial, "Octubre de 2026", a partir de su clave "2026-10". */
export function monthLabel(key: string): string {
	const [year, month] = key.split('-').map(Number);
	return capitalize(
		new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(
			new Date(year, month - 1, 1)
		)
	);
}

/** Lo que dice la fila de un entrenamiento en Historial: "5 ejercicios · 16 series". */
export function workoutSummaryLabel(exercises: number, sets: number): string {
	return `${exerciseCountLabel(exercises)} · ${setCountLabel(sets)}`;
}

/** El modo de un entrenamiento y, solo cuando la hay (ADR-0006), su duración: "Acompañamiento · 47 min". */
export function workoutModeLine(mode: WorkoutMode, duration: number | null): string {
	return duration === null ? modeLabel[mode] : `${modeLabel[mode]} · ${formatElapsed(duration)}`;
}

/** La línea de última vez (GLOSSARY): su fecha y sus series, "Última vez (28 oct 2026): 60 kg × 8, 62,5 kg × 8". */
export function lastTimeLine(sets: readonly WorkoutSet[], loadMode: LoadMode): string {
	const series = sets.map((set) => `${formatWeight(set.weight, loadMode)} × ${set.reps}`);
	return `Última vez (${formatDate(sets[0].performedAt)}): ${series.join(', ')}`;
}

const twoDigits = (n: number) => String(n).padStart(2, '0');

/** Una duración en segundos repartida en horas, minutos y segundos. */
function splitDuration(total: number) {
	return {
		hours: Math.floor(total / 3600),
		minutes: Math.floor((total % 3600) / 60),
		seconds: total % 60
	};
}

/** El descanso como lo marca el contador: "1:32", y con horas solo si llega a una, "1:01:05". */
export function formatRest(total: number): string {
	const { hours, minutes, seconds } = splitDuration(total);
	const leading = hours > 0 ? [hours, twoDigits(minutes)] : [minutes];
	return [...leading, twoDigits(seconds)].join(':');
}

/** El tiempo transcurrido como se lee en el encabezado: "47 min", "1 h", "1 h 12 min". */
export function formatElapsed(total: number): string {
	const { hours, minutes } = splitDuration(total);
	if (hours === 0) return `${minutes} min`;
	return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

/** Hacia dónde fue un número de la semana, como lo lee la flecha de la tarjeta "Últimos 7 días". */
export const trendLabel: Record<Trend, string> = {
	up: 'Más que los 7 días anteriores',
	down: 'Menos que los 7 días anteriores',
	same: 'Igual que los 7 días anteriores'
};

const listFormat = new Intl.ListFormat('es', { type: 'conjunction' });

/** La línea "Toca:" del mapa de calor: los músculos por debajo de mantenimiento, o que no falta ninguno. */
export function toWorkLine(muscles: readonly { name: string }[]): string {
	if (muscles.length === 0) return 'Toca: nada, todos los músculos llegan a mantenimiento';
	return `Toca: ${listFormat.format(muscles.map((muscle) => muscle.name))}`;
}

/** "Músculos en banda: n de m": los que alcanzan la banda objetivo, de los que tienen ejercicios. */
export function bandLabel({ inBand, of }: BandCount): string {
	return `Músculos en banda: ${inBand} de ${of}`;
}

/** Las vistas del gráfico de un ejercicio. */
export const chartViewLabel: Record<ExerciseChartView, string> = {
	maxWeight: 'Peso máximo',
	e1RM: '1RM estimado',
	relativeStrength: 'Fuerza relativa',
	volume: 'Volumen',
	reps: 'Reps'
};

/** Un récord batido como se nombra: "1RM estimado 92,5 kg", "5 reps con 100 kg". */
function recordLabel(record: BrokenRecord): string {
	if (record.measure === 'repsAtWeight') return `${record.reps} reps con ${formatKg(record.kg)}`;
	const name = record.measure === 'maxWeight' ? 'peso máximo' : '1RM estimado';
	return `${name} ${formatKg(record.kg)}`;
}

/** El aviso al batir récords: uno solo que los nombra todos ("Récord: peso máximo 100 kg y 1RM estimado 116,67 kg"). */
export function recordNotice(records: readonly BrokenRecord[]): string {
	return `Récord: ${listFormat.format(records.map(recordLabel))}`;
}
