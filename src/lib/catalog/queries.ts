import { exercises } from './exercises';
import { muscles } from './muscles';
import { baseRoutines, routineGroups } from './routines';
import type { BaseRoutine, Exercise, Muscle, RoutineGroup, View } from './types';

export function getMuscle(code: string): Muscle | undefined {
	return muscles.find((muscle) => muscle.code === code);
}

export function getExercise(id: string): Exercise | undefined {
	return exercises.find((exercise) => exercise.id === id);
}

/** El nombre de un ejercicio por su id. La integridad del catálogo garantiza que existe; el id es el último recurso. */
export function exerciseName(id: string): string {
	return getExercise(id)?.name ?? id;
}

/** Los ejercicios de un músculo: primero donde es primario, después donde es secundario. */
export function exercisesOf(muscleCode: string): { primary: Exercise[]; secondary: Exercise[] } {
	return {
		primary: exercises.filter((exercise) => exercise.primaryMuscle === muscleCode),
		secondary: exercises.filter((exercise) => exercise.secondaryMuscles.includes(muscleCode))
	};
}

/** Si algún ejercicio del catálogo trabaja el músculo, como primario o secundario. */
export function hasExercises(muscleCode: string): boolean {
	return exercises.some(
		(exercise) =>
			exercise.primaryMuscle === muscleCode || exercise.secondaryMuscles.includes(muscleCode)
	);
}

/** Los códigos de los músculos sin ejercicios: el mapa los dibuja apagados. */
export function inactiveMuscles(): string[] {
	return muscles.filter((muscle) => !hasExercises(muscle.code)).map((muscle) => muscle.code);
}

/** El músculo al que pertenece una región del SVG (ADR-0004). */
export function muscleOfRegion(regionId: string): Muscle | undefined {
	return muscles.find((muscle) => muscle.regions.some((region) => region.id === regionId));
}

export function oppositeView(view: View): View {
	return view === 'front' ? 'back' : 'front';
}

/** La vista en que mostrar un músculo: la actual si tiene una región ahí, si no la de su primera región. */
export function viewFor(muscle: Muscle, current: View): View {
	return muscle.regions.some((region) => region.view === current)
		? current
		: muscle.regions[0].view;
}

export function getRoutineGroup(id: string): RoutineGroup | undefined {
	return routineGroups.find((group) => group.id === id);
}

export function getBaseRoutine(id: string): BaseRoutine | undefined {
	return baseRoutines.find((routine) => routine.id === id);
}

/** Las rutinas base de un grupo, en el orden del catálogo. */
export function baseRoutinesOf(groupId: string): BaseRoutine[] {
	return baseRoutines.filter((routine) => routine.group === groupId);
}
