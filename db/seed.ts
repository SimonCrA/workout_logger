import { db, Workout, User, Exercise, Muscle } from 'astro:db';

// https://astro.build/db/seed
export default async function seed() {
	await db.insert(User).values([
		{ name: 'simon', email: 'simon@simon.com', password: 'password', isAdmin: true, isPro: true },
		{ name: 'john', email: 'john@john.com', password: 'password', isPro: true },
		{ name: 'pedro', email: 'pedro@pedro.com', password: 'password' },
	])


	await db.insert(Muscle).values([
		{ code: 'chest', name: 'Pecho', view: 'front' },
		{ code: 'biceps', name: 'Biceps', view: 'front' },
		{ code: 'abductors', name: 'Abductores', view: 'front' },
		{ code: 'quads', name: 'Cuadriceps', view: 'front' },
		{ code: 'abs', name: 'Abdominales', view: 'front' },
		{ code: 'hamstrings', name: 'Isquiotibiales', view: 'back' },
		{ code: 'dorsals', name: 'Dorsales', view: 'back' },
		{ code: 'glutes', name: 'Gluteos', view: 'back' },

		{ code: 'adductors_f', name: 'Adductores', view: 'front' },
		{ code: 'forearms_f', name: 'Antebrazos', view: 'front' },
		{ code: 'triceps_f', name: 'Triceps', view: 'front' },
		{ code: 'shoulders_f', name: 'Hombros', view: 'front' },
		{ code: 'traps_f', name: 'Trapecios', view: 'front' },
		{ code: 'calves_f', name: 'Pantorrillas', view: 'front' },
		{ code: 'obliques_f', name: 'Oblicuos', view: 'front' },
		{ code: 'neck_f', name: 'Cuello', view: 'front' },

		{ code: 'adductors_b', name: 'Adductores', view: 'back' },
		{ code: 'forearms_b', name: 'Antebrazos', view: 'back' },
		{ code: 'triceps_b', name: 'Triceps', view: 'back' },
		{ code: 'shoulders_b', name: 'Hombros', view: 'back' },
		{ code: 'traps_b', name: 'Trapecios', view: 'back' },
		{ code: 'calves_b', name: 'Pantorrillas', view: 'back' },
		{ code: 'obliques_b', name: 'Oblicuos', view: 'back' },
		{ code: 'neck_b', name: 'Cuello', view: 'back' },
	])

	await db.insert(Exercise).values([
		{ name: 'Extension de abductores', muscleId: 3, description: 'Extension de abductores en maquina' },
		{ name: 'Prensa en banca', muscleId: 1, description: 'Prensa horizontal en banca con barra' },
		{ name: 'Curls de biceps', muscleId: 2, description: 'Curls de biceps con barra a 45 grados' },
		{ name: 'Prensa militar', muscleId: 4, description: 'Prensa militar con barra' },
		{ name: 'leg press', muscleId: 5, description: 'leg press' },
		{ name: 'abs', muscleId: 6, description: 'abs' },
		{ name: 'calves', muscleId: 7, description: 'calves' },
		{ name: 'forearms', muscleId: 8, description: 'forearms' },
		{ name: 'flutes', muscleId: 9, description: 'flutes' },
		{ name: 'quads', muscleId: 10, description: 'quads' },
		{ name: 'hamstrings', muscleId: 11, description: 'hamstrings' },
		{ name: 'lats', muscleId: 12, description: 'lats' },
		{ name: 'traps', muscleId: 13, description: 'traps' },
		{ name: 'obliques', muscleId: 14, description: 'obliques' },
		{ name: 'neck', muscleId: 15, description: 'neck' },
	])


	await db.insert(Workout).values([
		{ exerciseId: 1, userId: 1, reps: 10, weight: 80 },
		{ exerciseId: 2, userId: 1, reps: 10, weight: 25 },
		{ exerciseId: 3, userId: 1, reps: 10, weight: 50 },
		{ exerciseId: 4, userId: 1, reps: 10, weight: 45 },
	])
}
