export type MuscleView = 'front' | 'back';

export interface Muscles {
    name: string;
    value: string;
    isSelected: boolean;
    view: string
}

export interface Exercise {
    name: string;
    description: string;
    muscle: string
}

