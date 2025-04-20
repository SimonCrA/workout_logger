import { atom, deepMap } from 'nanostores';
import type { Muscles, MuscleView } from './env.d.ts'

export const muscleView = atom<MuscleView>('front');
export const muscleSelected = atom<string>('');
