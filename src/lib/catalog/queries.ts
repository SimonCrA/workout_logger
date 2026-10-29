import { exercises } from './exercises';
import { muscles } from './muscles';
import type { Exercise, Muscle, View } from './types';

export function getMuscle(code: string): Muscle | undefined {
	return muscles.find((muscle) => muscle.code === code);
}

export function getExercise(id: string): Exercise | undefined {
	return exercises.find((exercise) => exercise.id === id);
}

/** Los ejercicios de un músculo: primero donde es primario, después donde es secundario. */
export function exercisesOf(muscleCode: string): { primary: Exercise[]; secondary: Exercise[] } {
	return {
		primary: exercises.filter((exercise) => exercise.primaryMuscle === muscleCode),
		secondary: exercises.filter((exercise) => exercise.secondaryMuscles.includes(muscleCode))
	};
}

/** El músculo al que pertenece una región del SVG (ADR-0004). */
export function muscleOfRegion(regionId: string): Muscle | undefined {
	return muscles.find((muscle) => muscle.regions.some((region) => region.id === regionId));
}

/** La vista en que mostrar un músculo: la actual si tiene una región ahí, si no la de su primera región. */
export function viewFor(muscle: Muscle, current: View): View {
	return muscle.regions.some((region) => region.view === current)
		? current
		: muscle.regions[0].view;
}
