import { atom, deepMap, map } from 'nanostores';
import type { MuscleView, IExercise, IWorkout } from './env.d.ts'

export const muscleView = atom<MuscleView>('front');
export const muscleSelected = atom<string>('');

export const exerciseSelected = atom<IExercise | null>(null);
export const workoutLog = deepMap({
    workouts: [] as IWorkout[],
    isSynced: false
})

if (typeof window !== 'undefined') {
    const exerciseStored = localStorage.getItem('exerciseSelected');
    const workoutLogStored = localStorage.getItem('workoutLog');

    if (exerciseStored) {
        try {
            exerciseSelected.set(JSON.parse(exerciseStored));
        } catch (e) {
            console.error('Failed to parse exerciseStored exercise:', e);
        }
    }
    exerciseSelected.subscribe((value) => {
        if (value) {
            localStorage.setItem('exerciseSelected', JSON.stringify(value));
        } else {
            localStorage.removeItem('exerciseSelected');
        }
    });

    if (workoutLogStored) {
        try {
            workoutLog.set(JSON.parse(workoutLogStored));
        } catch (e) {
            console.error('Failed to parse workoutLog:', e);
        }
    }
    workoutLog.subscribe((value) => {
        if (value) {
            localStorage.setItem('workoutLog', JSON.stringify(value));
        } else {
            localStorage.removeItem('workoutLog');
        }
    });

}

