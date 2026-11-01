import { uuidv7 } from './id';
import type { Routine, Synced, Workout, WorkoutMode, WorkoutSet } from './types';

/** Un entrenamiento libre sigue en curso mientras su última serie tenga menos de 3 horas. */
export const WORKOUT_IDLE_MS = 3 * 60 * 60 * 1000;

/** Una fila viva: sin borrado lógico. */
export const alive = (row: { deletedAt: string | null }) => row.deletedAt === null;

/** Serie de trabajo: cualquiera que no sea de calentamiento (GLOSSARY). Solo estas cuentan. */
export const isWorkSet = (set: Pick<WorkoutSet, 'type'>): boolean => set.type !== 'warmup';

/**
 * Un entrenamiento sin terminar (sin hora de fin) y cuándo tuvo su última serie viva, de cualquier
 * ejercicio, o nada si aún no tiene. Sin terminar no es lo mismo que en curso: un libre deja de
 * estar en curso por el tiempo.
 */
export type UnfinishedWorkout = { workout: Workout; lastSetAt: string | null };

/** La última actividad de un entrenamiento sin terminar: su última serie, o su inicio mientras no tenga. */
export function lastActivity(unfinished: UnfinishedWorkout): string {
	return unfinished.lastSetAt ?? unfinished.workout.startedAt;
}

/**
 * En curso (ADR-0006): uno empezado desde una rutina lo está hasta que se termina a mano o se
 * empieza otro; uno libre, que nadie empieza, deja de estarlo a las 3 horas sin series.
 */
export function isWorkoutOpen(unfinished: UnfinishedWorkout, now: Date): boolean {
	if (unfinished.workout.routineId !== null) return true;
	return now.getTime() - new Date(lastActivity(unfinished)).getTime() < WORKOUT_IDLE_MS;
}

/** El entrenamiento en curso, o nada. */
export function openWorkout(
	unfinished: UnfinishedWorkout | null | undefined,
	now: Date
): Workout | undefined {
	return unfinished && isWorkoutOpen(unfinished, now) ? unfinished.workout : undefined;
}

/** El modo con que se registrará la próxima serie: el del en curso o, sin ninguno, el último elegido, con el que nacerá el libre. */
export function nextSetMode(
	unfinished: UnfinishedWorkout | null | undefined,
	lastMode: WorkoutMode,
	now: Date
): WorkoutMode {
	return openWorkout(unfinished, now)?.mode ?? lastMode;
}

/** Un entrenamiento libre nuevo en el modo dado, anónimo y pendiente de subir. */
export function newWorkout(now: Date, mode: WorkoutMode): Workout {
	const at = now.toISOString();
	return {
		id: uuidv7(now.getTime()),
		userId: null,
		routineId: null,
		title: null,
		mode,
		startedAt: at,
		endedAt: null,
		createdAt: at,
		updatedAt: at,
		deletedAt: null,
		pending: 1
	};
}

/** Con qué se empieza desde una rutina: la rutina, su nombre tal como se llama ahora y el modo elegido. */
export type RoutineStart = { routineId: string; title: string; mode: WorkoutMode };

export function routineStart(
	routine: Pick<Routine, 'id' | 'name'>,
	mode: WorkoutMode
): RoutineStart {
	return { routineId: routine.id, title: routine.name, mode };
}

/** Adjunta una rutina a un entrenamiento (un libre en curso al que se le empieza una rutina). */
export function attachRoutine(workout: Workout, start: RoutineStart, now: Date): Workout {
	return { ...workout, ...start, updatedAt: now.toISOString(), pending: 1 };
}

/** Cambia el modo a mitad de entrenamiento. */
export function changeMode(workout: Workout, mode: WorkoutMode, now: Date): Workout {
	return { ...workout, mode, updatedAt: now.toISOString(), pending: 1 };
}

/**
 * Cierra un entrenamiento en el momento dado: su última actividad cuando lo cierra el tiempo o el
 * siguiente "Empezar", ahora mismo cuando se pulsa "Terminar". Nunca se reabre.
 */
export function closeWorkout(workout: Workout, endedAt: Date, now: Date): Workout {
	return {
		...workout,
		endedAt: endedAt.toISOString(),
		updatedAt: now.toISOString(),
		pending: 1
	};
}

/** El día en hora local como número ordenable: 20261031. */
const localDay = (date: Date) =>
	date.getFullYear() * 10_000 + (date.getMonth() + 1) * 100 + date.getDate();

/** Si el entrenamiento empezó en un día anterior al de hoy, en fecha local (Hoy lo avisa). */
export function startedBeforeToday(startedAt: string, now: Date): boolean {
	return localDay(new Date(startedAt)) < localDay(now);
}

/** Borra (lógicamente) una fila: sigue existiendo, marcada y pendiente, para sincronizarse (ADR-0001). */
export function softDelete<T extends Synced>(row: T, now: Date): T {
	const at = now.toISOString();
	return { ...row, deletedAt: at, updatedAt: at, pending: 1 };
}

/** Lo que se corrige de una serie: lo mismo que se registra, menos el ejercicio y la hora. */
export type SetChanges = Pick<WorkoutSet, 'reps' | 'weight' | 'rir' | 'type' | 'note'>;

/** Los mismos valores como los sostienen los controles: el RIR es un botón (vacío si no hay) y la nota, texto. */
export type SetFieldValues = Omit<SetChanges, 'rir' | 'note'> & { rir: string; note: string };

/** Lo que los controles muestran de una serie, al registrar (el prellenado) o al corregir. */
export function setFieldValues(set: SetChanges): SetFieldValues {
	return { ...set, rir: set.rir === null ? '' : String(set.rir), note: set.note ?? '' };
}

/** Lo que los controles dejan: sin RIR y con la nota en blanco no hay nada, y la nota va sin espacios de más. */
export function setChanges(values: SetFieldValues): SetChanges {
	const note = values.note.trim();
	return { ...values, rir: values.rir === '' ? null : Number(values.rir), note: note || null };
}

/** Corrige una serie, de hoy o de un día anterior, sin moverla de su entrenamiento ni de su hora. */
export function editSet(set: WorkoutSet, changes: SetChanges, now: Date): WorkoutSet {
	return { ...set, ...changes, updatedAt: now.toISOString(), pending: 1 };
}

/** Un entrenamiento con sus series, tal como se mueve. */
export type MovedWorkout = { workout: Workout; sets: WorkoutSet[] };

/**
 * Mueve un entrenamiento a otro inicio (ADR-0006: la fecha se corrige después, para registrar lo
 * de ayer): inicio, fin si lo tiene y la hora de todas sus series se desplazan por la misma
 * diferencia, así descansos y duración no cambian, y todo queda pendiente de subir.
 */
export function shiftWorkout(
	workout: Workout,
	sets: readonly WorkoutSet[],
	startedAt: Date,
	now: Date
): MovedWorkout {
	const delta = startedAt.getTime() - new Date(workout.startedAt).getTime();
	const shift = (iso: string) => new Date(new Date(iso).getTime() + delta).toISOString();
	const updatedAt = now.toISOString();
	return {
		workout: {
			...workout,
			startedAt: shift(workout.startedAt),
			endedAt: workout.endedAt === null ? null : shift(workout.endedAt),
			updatedAt,
			pending: 1
		},
		sets: sets.map((set) => ({
			...set,
			performedAt: shift(set.performedAt),
			updatedAt,
			pending: 1
		}))
	};
}

/**
 * Qué impide mover un entrenamiento a ese inicio, o nada: ha de ser una fecha y hora legibles, y
 * ni el inicio ni lo que dura (`span`, en milisegundos hasta su fin o su última serie) pueden
 * caer en el futuro.
 */
export function newStartProblem(startedAt: Date, span: number, now: Date): string | null {
	if (Number.isNaN(startedAt.getTime())) return 'Elige una fecha y una hora.';
	if (startedAt.getTime() > now.getTime()) return 'Un entrenamiento no puede empezar en el futuro.';
	if (startedAt.getTime() + span > now.getTime())
		return 'Así acabaría en el futuro: elige una hora anterior.';
	return null;
}

/** Suma un paso (1 rep, 2,5 kg) sin bajar de cero y sin arrastre de decimales. */
export function stepValue(value: number, delta: number): number {
	return nonNegative(value + delta);
}

/** Lo que se escribe a mano: nunca negativo, finito, con dos decimales como mucho. */
export function nonNegative(value: number): number {
	return Number.isFinite(value) ? Math.max(0, Math.round(value * 100) / 100) : 0;
}

/** Series en orden de tiempo. */
export const byTime = (a: WorkoutSet, b: WorkoutSet) => a.performedAt.localeCompare(b.performedAt);

/** Reps y peso con que arranca el registro: la serie más reciente del ejercicio. */
export function prefillFor(sets: readonly WorkoutSet[]): { reps: number; weight: number } {
	const latest = [...sets].sort(byTime).at(-1);
	return latest ? { reps: latest.reps, weight: latest.weight } : { reps: 10, weight: 0 };
}

/** Las series agrupadas por una clave, cada grupo en orden de tiempo y los grupos en orden de primera serie. */
export function groupSets(
	sets: readonly WorkoutSet[],
	key: (set: WorkoutSet) => string
): Map<string, WorkoutSet[]> {
	const groups = new Map<string, WorkoutSet[]>();
	for (const set of [...sets].sort(byTime)) {
		const group = groups.get(key(set));
		if (group) group.push(set);
		else groups.set(key(set), [set]);
	}
	return groups;
}

/** Las series de un entrenamiento; `date` es la hora de su primera serie. */
export type WorkoutGroup = { workoutId: string; date: string; sets: WorkoutSet[] };

/** Historial por entrenamiento, el más reciente primero, con sus series en orden. */
export function groupByWorkout(sets: readonly WorkoutSet[]): WorkoutGroup[] {
	return [...groupSets(sets, (set) => set.workoutId).entries()]
		.map(([workoutId, group]) => ({ workoutId, date: group[0].performedAt, sets: group }))
		.sort((a, b) => b.date.localeCompare(a.date));
}

/** Un ejercicio con sus series en orden. */
export type ExerciseGroup = { exerciseId: string; sets: WorkoutSet[] };

/** Los ejercicios de un entrenamiento en el orden en que se hicieron (por primera serie), cada uno con sus series en orden. */
export function groupByExercise(sets: readonly WorkoutSet[]): ExerciseGroup[] {
	return [...groupSets(sets, (set) => set.exerciseId).entries()].map(([exerciseId, group]) => ({
		exerciseId,
		sets: group
	}));
}

/** Última vez: las series del entrenamiento más reciente con el ejercicio, sin contar el que está en curso. */
export function lastTime(sets: readonly WorkoutSet[], currentWorkoutId?: string): WorkoutSet[] {
	return groupByWorkout(sets).find((group) => group.workoutId !== currentWorkoutId)?.sets ?? [];
}
