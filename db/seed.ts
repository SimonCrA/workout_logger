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
		{ code: 'abdominals', name: 'Abdominales', view: 'front' },
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
		/* 1. Pecho (muscleId: 1) */
		{ name: 'Press de banca plano con barra', muscleId: 1, description: 'Empuje horizontal de pecho con barra' },
		{ name: 'Aperturas con mancuernas en banco plano', muscleId: 1, description: 'Apertura lateral de pecho con mancuernas' },
		{ name: 'Press inclinado con mancuernas', muscleId: 1, description: 'Empuje en banco inclinado con mancuernas' },

		/* 2. Bíceps (muscleId: 2) */
		{ name: 'Curl con barra recta', muscleId: 2, description: 'Flexión de brazos con barra recta' },
		{ name: 'Curl martillo con mancuernas', muscleId: 2, description: 'Flexión neutral con mancuernas alternas' },
		{ name: 'Curl concentrado sentado', muscleId: 2, description: 'Contracción de bíceps un brazo sentado' },

		/* 3. Abductores (muscleId: 3) */
		{ name: 'Abducción de cadera en máquina', muscleId: 3, description: 'Apertura lateral de cadera sentado' },
		{ name: 'Abducción lateral tumbado', muscleId: 3, description: 'Apertura de cadera tumbado lateralmente' },
		{ name: 'Abducción con banda elástica', muscleId: 3, description: 'Separación lateral de piernas con banda' },

		/* 4. Cuádriceps (muscleId: 4) */
		{ name: 'Sentadilla frontal con barra', muscleId: 4, description: 'Sentadilla frontal enfocada en cuádriceps' },
		{ name: 'Extensión de piernas en máquina', muscleId: 4, description: 'Extensión de rodilla sentado en máquina' },
		{ name: 'Sentadilla búlgara con mancuernas', muscleId: 4, description: 'Zancada posterior con apoyo elevado' },

		/* 5. Abdominales (muscleId: 5) */
		{ name: 'Crunch abdominal', muscleId: 5, description: 'Flexión de tronco en colchoneta' },
		{ name: 'Elevación de piernas en barra', muscleId: 5, description: 'Levantamiento de piernas colgado del barra' },
		{ name: 'Plancha frontal', muscleId: 5, description: 'Mantenimiento de posición de tabla' },

		/* 6. Isquiotibiales (muscleId: 6) */
		{ name: 'Peso muerto rumano con barra', muscleId: 6, description: 'Flexión de cadera con barra rumana' },
		{ name: 'Curl femoral tumbado en máquina', muscleId: 6, description: 'Flexión de rodilla acostado en máquina' },
		{ name: 'Curl femoral sentado en máquina', muscleId: 6, description: 'Flexión de rodilla sentado en máquina' },

		/* 7. Dorsales (muscleId: 7) */
		{ name: 'Jalón al pecho en polea', muscleId: 7, description: 'Tirón vertical de espalda amplia' },
		{ name: 'Remo en multipower con barra', muscleId: 7, description: 'Remo barra en máquina multipower' },
		{ name: 'Remo unilateral con mancuerna', muscleId: 7, description: 'Remo a una mano en banco inclinado' },

		/* 8. Glúteos (muscleId: 8) */
		{ name: 'Hip thrust con barra', muscleId: 8, description: 'Empuje de cadera apoyado en banco' },
		{ name: 'Sentadilla sumo con kettlebell', muscleId: 8, description: 'Sentadilla amplia con pesa kettlebell' },
		{ name: 'Peso muerto sumo con barra', muscleId: 8, description: 'Peso muerto piernas abiertas sumo' },

		/* 9. Aductores front (muscleId: 9) */
		{ name: 'Aducción en máquina sentado', muscleId: 9, description: 'Aducción de piernas sentado en máquina' },
		{ name: 'Aducción con banda elástica', muscleId: 9, description: 'Compresión de piernas con banda' },
		{ name: 'Paseo lateral con banda', muscleId: 9, description: 'Desplazamiento lateral con banda elástica' },

		/* 10. Antebrazos front (muscleId: 10) */
		{ name: 'Curl de muñeca con barra', muscleId: 10, description: 'Flexión de muñeca supinado con barra' },
		{ name: 'Curl inverso con barra', muscleId: 10, description: 'Flexión de muñeca prono con barra' },
		{ name: 'Curl de muñeca con mancuerna', muscleId: 10, description: 'Flexión de muñeca sentado apoyado' },

		/* 11. Tríceps front (muscleId: 11) */
		{ name: 'Fondos en paralelas', muscleId: 11, description: 'Extensión de codos en barras paralelas' },
		{ name: 'Extensión en polea alta', muscleId: 11, description: 'Jalón de cuerda en polea alta' },
		{ name: 'Press francés con barra Z', muscleId: 11, description: 'Extensión tumbado con barra Z' },

		/* 12. Hombros front (muscleId: 12) */
		{ name: 'Press militar con barra', muscleId: 12, description: 'Empuje vertical de hombros con barra' },
		{ name: 'Press con mancuernas sentado', muscleId: 12, description: 'Empuje vertical alterno sentado' },
		{ name: 'Elevaciones frontales con mancuerna', muscleId: 12, description: 'Elevación frontal de hombros' },

		/* 13. Trapecios front (muscleId: 13) */
		{ name: 'Encogimientos con barra', muscleId: 13, description: 'Elevación de hombros con barra' },
		{ name: 'Encogimientos con mancuernas', muscleId: 13, description: 'Elevación de hombros con mancuernas' },
		{ name: 'Remo al mentón con barra', muscleId: 13, description: 'Tirón alto de barra hasta mentón' },

		/* 14. Pantorrillas front (muscleId: 14) */
		{ name: 'Elevación de talones de pie', muscleId: 14, description: 'Flexión plantar de pie en máquina' },
		{ name: 'Elevación sentado en máquina', muscleId: 14, description: 'Flexión plantar sentado con peso' },
		{ name: 'Elevación con mancuernas', muscleId: 14, description: 'Flexión plantar con mancuernas libres' },

		/* 15. Oblicuos front (muscleId: 15) */
		{ name: 'Giro ruso con mancuerna', muscleId: 15, description: 'Giros de torso sentado con mancuerna' },
		{ name: 'Plancha lateral', muscleId: 15, description: 'Mantener posición lateral de tabla' },
		{ name: 'Elevación de piernas oblicuo', muscleId: 15, description: 'Levantamiento de piernas colgado oblicuo' },

		/* 16. Cuello front (muscleId: 16) */
		{ name: 'Flexión de cuello resistido', muscleId: 16, description: 'Flexión frontal con resistencia manual' },
		{ name: 'Extensión de cuello prono', muscleId: 16, description: 'Extensión cervical tumbado prono' },
		{ name: 'Inclinación lateral de cuello', muscleId: 16, description: 'Flexión lateral con resistencia manual' },

		/* 17. Aductores back (muscleId: 17) */
		{ name: 'Aducción en polea baja', muscleId: 17, description: 'Jalón de pierna cruzada en polea' },
		{ name: 'Aducción tumbado prono', muscleId: 17, description: 'Aducción de cadera tumbado boca abajo' },
		{ name: 'Aducción con balón entre piernas', muscleId: 17, description: 'Compresión de piernas con balón' },

		/* 18. Antebrazos back (muscleId: 18) */
		{ name: 'Curl invertido con barra', muscleId: 18, description: 'Flexión de muñeca prono con barra' },
		{ name: 'Extensión de muñeca en banco', muscleId: 18, description: 'Extensión de muñeca con antebrazo apoyado' },
		{ name: 'Curl de antebrazo con mancuerna', muscleId: 18, description: 'Flexión de codo prono de pie' },

		/* 19. Tríceps back (muscleId: 19) */
		{ name: 'Press cerrado con barra', muscleId: 19, description: 'Press banca agarre estrecho' },
		{ name: 'Rompecráneos con barra Z', muscleId: 19, description: 'Extensión tumbado con barra Z' },
		{ name: 'Patada de tríceps con mancuerna', muscleId: 19, description: 'Extensión de codo con mancuerna' },

		/* 20. Hombros back (muscleId: 20) */
		{ name: 'Elevaciones laterales con mancuerna', muscleId: 20, description: 'Elevación lateral de hombros' },
		{ name: 'Face pull en polea alta', muscleId: 20, description: 'Jalón de cuerda hacia la cara' },
		{ name: 'Pájaros con mancuernas', muscleId: 20, description: 'Aperturas traseras con mancuernas' },

		/* 21. Trapecios back (muscleId: 21) */
		{ name: 'Encogimientos en multipower', muscleId: 21, description: 'Elevación de hombros en máquina Smith' },
		{ name: 'Encogimientos en polea', muscleId: 21, description: 'Elevación con tensión de polea' },
		{ name: 'Remo al mentón agarre cerrado', muscleId: 21, description: 'Tirón alto con agarre estrecho' },

		/* 22. Pantorrillas back (muscleId: 22) */
		{ name: 'Elevación de talón unipodal', muscleId: 22, description: 'Flexión plantar con una pierna' },
		{ name: 'Elevación en prensa de piernas', muscleId: 22, description: 'Flexión plantar en máquina prensa' },
		{ name: 'Elevación en escalón', muscleId: 22, description: 'Flexión plantar con apoyo en escalón' },

		/* 23. Oblicuos back (muscleId: 23) */
		{ name: 'Plancha lateral con torsión', muscleId: 23, description: 'Tabla lateral con giro de cadera' },
		{ name: 'Giros en banco inclinado', muscleId: 23, description: 'Giros de torso en banco inclinado' },
		{ name: 'Levantamiento lateral de piernas', muscleId: 23, description: 'Elevación de piernas colgado lateral' },

		/* 24. Cuello back (muscleId: 24) */
		{ name: 'Extensión cervical tumbado', muscleId: 24, description: 'Extensión de cuello prono en banco' },
		{ name: 'Flexión lateral resistida', muscleId: 24, description: 'Inclinación lateral con resistencia' },
		{ name: 'Encogimiento cervical con banda', muscleId: 24, description: 'Elevación de cabeza contra banda' }
	]
	)

}
