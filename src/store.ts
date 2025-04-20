import { atom, deepMap } from 'nanostores';
import type { MuscleView } from './env.d.ts'

export const muscleView = atom<MuscleView>('front');
export const muscleSelected = atom<string>('');
