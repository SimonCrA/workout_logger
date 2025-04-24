import { db, Exercise, Muscle } from 'astro:db';

// https://astro.build/db/seed
export default async function seed() {
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
		{ "name": "Press de banca plano", "muscleId": 1, "description": "Empuje horizontal con barra en banco plano" },
		{ "name": "Press inclinado con mancuernas", "muscleId": 1, "description": "Empuje en banco inclinado con mancuernas" },
		{ "name": "Aperturas con mancuernas", "muscleId": 1, "description": "Apertura lateral de brazos en banco plano" },
		{ "name": "Press declinado con barra", "muscleId": 1, "description": "Empuje en banco declinado con barra" },
		{ "name": "Fondos en paralelas", "muscleId": 1, "description": "Descenso y elevación del cuerpo en paralelas" },
		{ "name": "Press con máquina", "muscleId": 1, "description": "Empuje horizontal en máquina de pecho" },

		/* 2. Bíceps (muscleId: 2) */
		{ "name": "Curl con barra recta", "muscleId": 2, "description": "Flexión de codos con barra recta" },
		{ "name": "Curl alterno con mancuernas", "muscleId": 2, "description": "Flexión alterna de brazos con mancuernas" },
		{ "name": "Curl martillo", "muscleId": 2, "description": "Flexión de codos con agarre neutro" },
		{ "name": "Curl concentrado", "muscleId": 2, "description": "Flexión de brazo apoyado en muslo" },
		{ "name": "Curl en banco inclinado", "muscleId": 2, "description": "Flexión de brazos en banco inclinado" },
		{ "name": "Curl en predicador", "muscleId": 2, "description": "Flexión de brazos en banco Scott" },

		/* 3. Abductores (muscleId: 3) */
		{ "name": "Abducción en máquina", "muscleId": 3, "description": "Separación de piernas en máquina específica" },
		{ "name": "Elevaciones laterales de pierna", "muscleId": 3, "description": "Levantamiento lateral de pierna acostado" },
		{ "name": "Patadas laterales de pie", "muscleId": 3, "description": "Elevación lateral de pierna estando de pie" },
		{ "name": "Abducción con banda elástica", "muscleId": 3, "description": "Separación de piernas con resistencia elástica" },
		{ "name": "Zancadas laterales", "muscleId": 3, "description": "Paso lateral amplio con flexión de rodilla" },
		{ "name": "Sentadilla sumo", "muscleId": 3, "description": "Sentadilla con piernas abiertas y pies hacia afuera" },

		/* 4. Cuádriceps (muscleId: 4) */
		{ "name": "Sentadilla frontal", "muscleId": 4, "description": "Flexión de rodillas con barra al frente" },
		{ "name": "Prensa de piernas", "muscleId": 4, "description": "Empuje de plataforma con piernas en máquina" },
		{ "name": "Extensiones de piernas", "muscleId": 4, "description": "Extensión de rodillas en máquina específica" },
		{ "name": "Sentadilla búlgara", "muscleId": 4, "description": "Zancada trasera con pie elevado" },
		{ "name": "Sentadilla con barra", "muscleId": 4, "description": "Flexión de rodillas con barra en espalda" },
		{ "name": "Sentadilla hack", "muscleId": 4, "description": "Sentadilla en máquina con respaldo inclinado" },

		/* 5. Abdominales (muscleId: 5) */
		{ "name": "Crunch abdominal", "muscleId": 5, "description": "Flexión de tronco en el suelo" },
		{ "name": "Elevación de piernas", "muscleId": 5, "description": "Levantamiento de piernas acostado" },
		{ "name": "Plancha frontal", "muscleId": 5, "description": "Mantener posición horizontal apoyado en antebrazos" },
		{ "name": "Crunch en máquina", "muscleId": 5, "description": "Flexión de tronco en máquina específica" },
		{ "name": "Ab wheel rollout", "muscleId": 5, "description": "Deslizamiento hacia adelante con rueda abdominal" },
		{ "name": "Mountain climbers", "muscleId": 5, "description": "Movimiento alterno de piernas en posición de plancha" },

		/* 6. Isquiotibiales (muscleId: 6) */
		{ "name": "Peso muerto rumano", "muscleId": 6, "description": "Flexión de cadera con piernas semi extendidas" },
		{ "name": "Curl femoral tumbado", "muscleId": 6, "description": "Flexión de rodillas en máquina acostado" },
		{ "name": "Curl femoral sentado", "muscleId": 6, "description": "Flexión de rodillas en máquina sentado" },
		{ "name": "Peso muerto con piernas rígidas", "muscleId": 6, "description": "Flexión de cadera con piernas rectas" },
		{ "name": "Puente de glúteos", "muscleId": 6, "description": "Elevación de caderas acostado" },
		{ "name": "Good mornings", "muscleId": 6, "description": "Inclinación de torso con barra en espalda" },

		/* 7. Dorsales (muscleId: 7) */
		{ "name": "Jalón al pecho", "muscleId": 7, "description": "Tirón de barra hacia el pecho en polea" },
		{ "name": "Remo con barra", "muscleId": 7, "description": "Tirón de barra hacia el abdomen inclinado" },
		{ "name": "Remo con mancuernas", "muscleId": 7, "description": "Tirón de mancuernas hacia el abdomen inclinado" },
		{ "name": "Pull-over con mancuerna", "muscleId": 7, "description": "Extensión de brazos sobre la cabeza acostado" },
		{ "name": "Remo en máquina", "muscleId": 7, "description": "Tirón de palancas hacia el abdomen sentado" },
		{ "name": "Jalón tras nuca", "muscleId": 7, "description": "Tirón de barra detrás de la cabeza en polea" },

		/* 8. Glúteos (muscleId: 8) */
		{ "name": "Hip thrust", "muscleId": 8, "description": "Elevación de caderas con barra apoyada" },
		{ "name": "Sentadilla sumo", "muscleId": 8, "description": "Sentadilla con piernas abiertas y pies hacia afuera" },
		{ "name": "Patada de glúteo en máquina", "muscleId": 8, "description": "Extensión de pierna hacia atrás en máquina" },
		{ "name": "Zancadas caminando", "muscleId": 8, "description": "Paso largo hacia adelante alternando piernas" },
		{ "name": "Peso muerto sumo", "muscleId": 8, "description": "Levantamiento de barra con piernas separadas" },
		{ "name": "Abducción de cadera en máquina", "muscleId": 8, "description": "Separación de piernas sentado en máquina" },

		/* 9. Aductores (frontal) (muscleId: 9) */
		{ "name": "Aducción en máquina", "muscleId": 9, "description": "Cierre de piernas en máquina sentado" },
		{ "name": "Elevación lateral de pierna", "muscleId": 9, "description": "Levantamiento lateral de pierna acostado" },
		{ "name": "Zancada lateral", "muscleId": 9, "description": "Paso lateral amplio con flexión de rodilla" },

		/* 10. Antebrazos (frontal) (muscleId: 10) */
		{ "name": "Curl de muñeca con barra", "muscleId": 10, "description": "Flexión de muñeca con barra sentado" },
		{ "name": "Extensión de muñeca con barra", "muscleId": 10, "description": "Extensión de muñeca con barra sentado" },
		{ "name": "Rotación de muñeca con mancuerna", "muscleId": 10, "description": "Giro de muñeca con mancuerna sentado" },

		/* 11. Tríceps (frontal) (muscleId: 11) */
		{ "name": "Extensión de tríceps en polea", "muscleId": 11, "description": "Empuje de cuerda hacia abajo en polea" },
		{ "name": "Press francés", "muscleId": 11, "description": "Extensión de codos con barra acostado" },
		{ "name": "Fondos en banco", "muscleId": 11, "description": "Descenso y elevación del cuerpo entre bancos" },

		/* 12. Hombros (frontal) (muscleId: 12) */
		{ "name": "Press militar con barra", "muscleId": 12, "description": "Empuje de barra sobre la cabeza de pie" },
		{ "name": "Elevaciones frontales con mancuernas", "muscleId": 12, "description": "Levantamiento de mancuernas al frente" },
		{ "name": "Elevaciones laterales con mancuernas", "muscleId": 12, "description": "Levantamiento de mancuernas a los lados" },

		/* 13. Trapecios (frontal) (muscleId: 13) */
		{ "name": "Encogimientos con barra", "muscleId": 13, "description": "Elevación de hombros con barra de pie" },
		{ "name": "Remo al cuello con barra", "muscleId": 13, "description": "Tirón de barra hacia el cuello de pie" },
		{ "name": "Encogimientos con mancuernas", "muscleId": 13, "description": "Elevación de hombros con mancuernas de pie" },

		/* 14. Pantorrillas (frontal) (muscleId: 14) */
		{ "name": "Elevación de talones de pie", "muscleId": 14, "description": "Levantamiento de talones de pie con peso" },
		{ "name": "Elevación de talones sentado", "muscleId": 14, "description": "Levantamiento de talones sentado con peso" },
		{ "name": "Elevación de talones en máquina", "muscleId": 14, "description": "Levantamiento de talones en máquina específica" },

		/* 15. Oblicuos (frontal) (muscleId: 15) */
		{ "name": "Giros rusos", "muscleId": 15, "description": "Rotación del torso sentado con peso" },
		{ "name": "Plancha lateral", "muscleId": 15, "description": "Mantener posición lateral apoyado en antebrazo" },
		{ "name": "Encogimientos laterales", "muscleId": 15, "description": "Flexión lateral del torso acostado" },
		/* 16. Cuello (frontal) (muscleId: 16) */
		{ "name": "Flexión de cuello con resistencia", "muscleId": 16, "description": "Inclinación de cabeza hacia adelante con resistencia manual" },
		{ "name": "Extensión de cuello con banda", "muscleId": 16, "description": "Inclinación de cabeza hacia atrás contra banda elástica" },
		{ "name": "Inclinación lateral con banda", "muscleId": 16, "description": "Inclinación lateral del cuello contra resistencia elástica" },

		/* 17. Aductores (posterior) (muscleId: 17) */
		{ "name": "Aducción en máquina sentado", "muscleId": 17, "description": "Cierre de piernas en máquina específica sentado" },
		{ "name": "Aducción con banda elástica", "muscleId": 17, "description": "Cierre de piernas con resistencia elástica" },
		{ "name": "Zancadas cruzadas", "muscleId": 17, "description": "Paso cruzado hacia atrás con flexión de rodilla" },

		/* 18. Antebrazos (posterior) (muscleId: 18) */
		{ "name": "Curl inverso con barra", "muscleId": 18, "description": "Flexión de codos con agarre prono" },
		{ "name": "Extensión de muñeca con mancuerna", "muscleId": 18, "description": "Extensión de muñeca con mancuerna sentado" },
		{ "name": "Rotación de muñeca con barra", "muscleId": 18, "description": "Giro de muñeca con barra sentado" },

		/* 19. Tríceps (posterior) (muscleId: 19) */
		{ "name": "Extensión de tríceps con mancuerna", "muscleId": 19, "description": "Extensión de codo con mancuerna sobre la cabeza" },
		{ "name": "Fondos en paralelas", "muscleId": 19, "description": "Descenso y elevación del cuerpo en paralelas" },
		{ "name": "Extensión de tríceps en polea alta", "muscleId": 19, "description": "Empuje de barra hacia abajo en polea alta" },

		/* 20. Hombros (posterior) (muscleId: 20) */
		{ "name": "Pájaros con mancuernas", "muscleId": 20, "description": "Elevación lateral inclinada con mancuernas" },
		{ "name": "Remo al mentón con barra", "muscleId": 20, "description": "Tirón de barra hacia el mentón de pie" },
		{ "name": "Elevaciones posteriores en máquina", "muscleId": 20, "description": "Apertura de brazos hacia atrás en máquina" },

		/* 21. Trapecios (posterior) (muscleId: 21) */
		{ "name": "Encogimientos con barra", "muscleId": 21, "description": "Elevación de hombros con barra de pie" },
		{ "name": "Remo al cuello con banda elástica", "muscleId": 21, "description": "Tirón de banda hacia el cuello de pie" },
		{ "name": "Encogimientos con mancuernas", "muscleId": 21, "description": "Elevación de hombros con mancuernas de pie" },

		/* 22. Pantorrillas (posterior) (muscleId: 22) */
		{ "name": "Elevación de talones de pie", "muscleId": 22, "description": "Levantamiento de talones de pie con peso" },
		{ "name": "Elevación de talones sentado", "muscleId": 22, "description": "Levantamiento de talones sentado con peso" },
		{ "name": "Elevación de talones en máquina", "muscleId": 22, "description": "Levantamiento de talones en máquina específica" },

		/* 23. Oblicuos (posterior) (muscleId: 23) */
		{ "name": "Giros rusos", "muscleId": 23, "description": "Rotación del torso sentado con peso" },
		{ "name": "Plancha lateral", "muscleId": 23, "description": "Mantener posición lateral apoyado en antebrazo" },
		{ "name": "Encogimientos laterales", "muscleId": 23, "description": "Flexión lateral del torso acostado" },

		/* 24. Cuello (posterior) (muscleId: 24) */
		{ "name": "Extensión de cuello con resistencia", "muscleId": 24, "description": "Inclinación de cabeza hacia atrás con resistencia manual" },
		{ "name": "Flexión lateral con banda", "muscleId": 24, "description": "Inclinación lateral del cuello contra banda elástica" },
		{ "name": "Rotación de cuello con banda", "muscleId": 24, "description": "Giro de cabeza contra resistencia elástica" }
	])

}
