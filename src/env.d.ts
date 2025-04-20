export type MuscleView = 'front' | 'back';

export interface IMuscle {
    name: string;
    code: string;
    view: string
}

export interface IExercise {
    name: string;
    description: string;
    muscle: string
}

