import { atom, deepMap } from 'nanostores';
import type { Muscles, MuscleView } from './env.d.ts'

export const muscleView = atom<MuscleView>('front');

export const diagramFig = deepMap<{ muscles: Muscles[] }>({
    muscles: [
        { value: 'chest', name: 'Pecho', isSelected: false, view: 'front' },
        { value: 'biceps', name: 'Biceps', isSelected: false, view: 'front' },
        { value: 'abductors', name: 'Abductores', isSelected: false, view: 'front' },
        { value: 'quads', name: 'Cuadriceps', isSelected: false, view: 'front' },
        { value: 'abs', name: 'Abdominales', isSelected: false, view: 'front' },
        { value: 'hamstrings', name: 'Isquiotibiales', isSelected: false, view: 'back' },
        { value: 'dorsals', name: 'Dorsales', isSelected: false, view: 'back' },
        { value: 'glutes', name: 'Gluteos', isSelected: false, view: 'back' },

        { value: '    adductors_f', name: 'Adductores', isSelected: false, view: 'front' },
        { value: 'forearms_f', name: 'Antebrazos', isSelected: false, view: 'front' },
        { value: 'triceps_f', name: 'Triceps', isSelected: false, view: 'front' },
        { value: 'shoulders_f', name: 'Hombros', isSelected: false, view: 'front' },
        { value: 'traps_f', name: 'Trapecios', isSelected: false, view: 'front' },
        { value: 'calves_f', name: 'Pantorrillas', isSelected: false, view: 'front' },
        { value: 'obliques_f', name: 'Oblicuos', isSelected: false, view: 'front' },
        { value: 'neck_f', name: 'Cuello', isSelected: false, view: 'front' },

        { value: 'adductors_b', name: 'Adductores', isSelected: false, view: 'back' },
        { value: 'forearms_b', name: 'Antebrazos', isSelected: false, view: 'back' },
        { value: 'triceps_b', name: 'Triceps', isSelected: false, view: 'back' },
        { value: 'shoulders_b', name: 'Hombros', isSelected: false, view: 'back' },
        { value: 'traps_b', name: 'Trapecios', isSelected: false, view: 'back' },
        { value: 'calves_b', name: 'Pantorrillas', isSelected: false, view: 'back' },
        { value: 'obliques_b', name: 'Oblicuos', isSelected: false, view: 'back' },
        { value: 'neck_b', name: 'Cuello', isSelected: false, view: 'back' },
    ]
})

