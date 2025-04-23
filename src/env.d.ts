export type MuscleView = 'front' | 'back';

export interface IMuscle {
    name: string;
    code: string;
    view: string
}

export interface IExercise {
    id: number;
    name: string;
    description: string;
    muscle: string
    muscleCode: string;
}


export interface IWorkout {
    id?: number;
    exerciseId: number;
    reps: numer
    weight: number;
    userId?: string | null;
    rir?: number | null;
    createdAt: string;
}

