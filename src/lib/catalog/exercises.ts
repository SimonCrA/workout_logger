import type { Exercise } from './types';

/**
 * Catálogo base de ejercicios, revisado en el ticket #4 a partir del seed de la app Astro.
 *
 * Músculo primario y secundarios siguen el directorio de ExRx.net (target y synergists de
 * cada ejercicio), reducidos a los 16 músculos del mapa corporal y sin estabilizadores:
 * https://exrx.net/Lists/Directory
 *
 * Dos excepciones, por el uso habitual en el gimnasio y el seed original: el peso muerto rumano y el
 * de piernas rígidas van bajo isquiotibiales (ExRx: glúteos) y el pullover bajo dorsales (ExRx: pecho).
 *
 * Equipo y modo de carga son definitivos: `bodyweight` es "peso corporal más adicional" y
 * `assisted` es "peso corporal menos asistencia" (GLOSSARY: Modo de carga).
 *
 * Nombres: el movimiento en singular ("Zancada lateral", "Elevación lateral de pierna"), salvo los
 * que solo se dicen en plural (flexiones, dominadas, fondos, encogimientos, aperturas, giros rusos,
 * escaladores, zancadas caminando); "con mancuerna" si se usa una y "con mancuernas" si se usan dos.
 */
export const exercises: readonly Exercise[] = [
	{
		id: 'press-de-banca-plano',
		name: 'Press de banca plano',
		description: 'Empuje horizontal con barra en banco plano',
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'chest',
		secondaryMuscles: ['triceps', 'shoulders']
	},
	{
		id: 'press-inclinado-con-mancuernas',
		name: 'Press inclinado con mancuernas',
		description: 'Empuje en banco inclinado con mancuernas',
		equipment: 'dumbbell',
		loadMode: 'external',
		primaryMuscle: 'chest',
		secondaryMuscles: ['triceps', 'shoulders']
	},
	{
		id: 'aperturas-con-mancuernas',
		name: 'Aperturas con mancuernas',
		description: 'Apertura lateral de brazos en banco plano',
		equipment: 'dumbbell',
		loadMode: 'external',
		primaryMuscle: 'chest',
		secondaryMuscles: ['shoulders']
	},
	{
		id: 'press-declinado-con-barra',
		name: 'Press declinado con barra',
		description: 'Empuje en banco declinado con barra',
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'chest',
		secondaryMuscles: ['triceps', 'shoulders']
	},
	{
		id: 'press-con-maquina',
		name: 'Press con máquina',
		description: 'Empuje horizontal en máquina de pecho',
		equipment: 'machine',
		loadMode: 'external',
		primaryMuscle: 'chest',
		secondaryMuscles: ['triceps', 'shoulders']
	},
	{
		id: 'flexiones',
		name: 'Flexiones',
		description: 'Empuje del cuerpo desde el suelo con las manos a la anchura de los hombros',
		equipment: 'bodyweight',
		loadMode: 'bodyweight',
		primaryMuscle: 'chest',
		secondaryMuscles: ['triceps', 'shoulders']
	},
	{
		id: 'fondos-en-paralelas',
		name: 'Fondos en paralelas',
		description: 'Descenso y elevación del cuerpo en paralelas',
		equipment: 'bodyweight',
		loadMode: 'bodyweight',
		primaryMuscle: 'chest',
		secondaryMuscles: ['triceps', 'shoulders']
	},
	{
		id: 'fondos-asistidos',
		name: 'Fondos asistidos',
		description: 'Fondos en máquina asistida que descuenta parte del peso corporal',
		equipment: 'machine',
		loadMode: 'assisted',
		primaryMuscle: 'chest',
		secondaryMuscles: ['triceps', 'shoulders']
	},
	{
		id: 'curl-con-barra-recta',
		name: 'Curl con barra recta',
		description: 'Flexión de codos con barra recta',
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'biceps',
		secondaryMuscles: ['forearms']
	},
	{
		id: 'curl-alterno-con-mancuernas',
		name: 'Curl alterno con mancuernas',
		description: 'Flexión alterna de brazos con mancuernas',
		equipment: 'dumbbell',
		loadMode: 'external',
		primaryMuscle: 'biceps',
		secondaryMuscles: ['forearms']
	},
	{
		id: 'curl-martillo',
		name: 'Curl martillo',
		description: 'Flexión de codos con agarre neutro',
		equipment: 'dumbbell',
		loadMode: 'external',
		primaryMuscle: 'biceps',
		secondaryMuscles: ['forearms']
	},
	{
		id: 'curl-concentrado',
		name: 'Curl concentrado',
		description: 'Flexión de brazo apoyado en muslo',
		equipment: 'dumbbell',
		loadMode: 'external',
		primaryMuscle: 'biceps',
		secondaryMuscles: ['forearms']
	},
	{
		id: 'curl-en-banco-inclinado',
		name: 'Curl en banco inclinado',
		description: 'Flexión de brazos en banco inclinado',
		equipment: 'dumbbell',
		loadMode: 'external',
		primaryMuscle: 'biceps',
		secondaryMuscles: ['forearms']
	},
	{
		id: 'curl-en-predicador',
		name: 'Curl en predicador',
		description: 'Flexión de brazos en banco Scott',
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'biceps',
		secondaryMuscles: ['forearms']
	},
	{
		id: 'abduccion-de-cadera-en-maquina',
		name: 'Abducción de cadera en máquina',
		description: 'Separación de piernas en máquina específica',
		equipment: 'machine',
		loadMode: 'external',
		primaryMuscle: 'abductors',
		secondaryMuscles: ['glutes']
	},
	{
		id: 'elevacion-lateral-de-pierna',
		name: 'Elevación lateral de pierna',
		description: 'Levantamiento lateral de pierna acostado',
		equipment: 'bodyweight',
		loadMode: 'bodyweight',
		primaryMuscle: 'abductors',
		secondaryMuscles: ['glutes']
	},
	{
		id: 'patada-lateral-de-pie',
		name: 'Patada lateral de pie',
		description: 'Elevación lateral de pierna estando de pie',
		equipment: 'bodyweight',
		loadMode: 'bodyweight',
		primaryMuscle: 'abductors',
		secondaryMuscles: ['glutes']
	},
	{
		id: 'abduccion-de-cadera-con-banda',
		name: 'Abducción de cadera con banda',
		description: 'Separación de piernas con resistencia elástica',
		equipment: 'other',
		loadMode: 'external',
		primaryMuscle: 'abductors',
		secondaryMuscles: ['glutes']
	},
	{
		id: 'sentadilla-con-barra',
		name: 'Sentadilla con barra',
		description: 'Flexión de rodillas con barra en espalda',
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'quads',
		secondaryMuscles: ['glutes', 'adductors']
	},
	{
		id: 'sentadilla-frontal',
		name: 'Sentadilla frontal',
		description: 'Flexión de rodillas con barra al frente',
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'quads',
		secondaryMuscles: ['glutes', 'adductors']
	},
	{
		id: 'prensa-de-piernas',
		name: 'Prensa de piernas',
		description: 'Empuje de plataforma con piernas en máquina',
		equipment: 'machine',
		loadMode: 'external',
		primaryMuscle: 'quads',
		secondaryMuscles: ['glutes', 'adductors']
	},
	{
		id: 'sentadilla-hack',
		name: 'Sentadilla hack',
		description: 'Sentadilla en máquina con respaldo inclinado',
		equipment: 'machine',
		loadMode: 'external',
		primaryMuscle: 'quads',
		secondaryMuscles: ['glutes', 'adductors']
	},
	{
		id: 'extension-de-piernas',
		name: 'Extensión de piernas',
		description: 'Extensión de rodillas en máquina específica',
		equipment: 'machine',
		loadMode: 'external',
		primaryMuscle: 'quads',
		secondaryMuscles: []
	},
	{
		id: 'sentadilla-bulgara',
		name: 'Sentadilla búlgara',
		description: 'Zancada trasera con pie elevado',
		equipment: 'dumbbell',
		loadMode: 'external',
		primaryMuscle: 'quads',
		secondaryMuscles: ['glutes', 'adductors']
	},
	{
		id: 'zancada-lateral',
		name: 'Zancada lateral',
		description: 'Paso lateral amplio con flexión de rodilla',
		equipment: 'bodyweight',
		loadMode: 'bodyweight',
		primaryMuscle: 'quads',
		secondaryMuscles: ['glutes', 'adductors']
	},
	{
		id: 'crunch-abdominal',
		name: 'Crunch abdominal',
		description: 'Flexión de tronco en el suelo',
		equipment: 'bodyweight',
		loadMode: 'bodyweight',
		primaryMuscle: 'abdominals',
		secondaryMuscles: ['obliques']
	},
	{
		id: 'crunch-en-maquina',
		name: 'Crunch en máquina',
		description: 'Flexión de tronco en máquina específica',
		equipment: 'machine',
		loadMode: 'external',
		primaryMuscle: 'abdominals',
		secondaryMuscles: ['obliques']
	},
	{
		id: 'elevacion-de-piernas',
		name: 'Elevación de piernas',
		description: 'Levantamiento de piernas acostado',
		equipment: 'bodyweight',
		loadMode: 'bodyweight',
		primaryMuscle: 'abdominals',
		secondaryMuscles: ['obliques']
	},
	{
		id: 'plancha-frontal',
		name: 'Plancha frontal',
		description: 'Mantener posición horizontal apoyado en antebrazos',
		equipment: 'bodyweight',
		loadMode: 'bodyweight',
		primaryMuscle: 'abdominals',
		secondaryMuscles: ['obliques']
	},
	{
		id: 'rueda-abdominal',
		name: 'Rueda abdominal',
		description: 'Deslizamiento hacia adelante con rueda abdominal',
		equipment: 'other',
		loadMode: 'bodyweight',
		primaryMuscle: 'abdominals',
		secondaryMuscles: ['obliques', 'dorsals']
	},
	{
		id: 'escaladores',
		name: 'Escaladores',
		description: 'Movimiento alterno de piernas en posición de plancha',
		equipment: 'bodyweight',
		loadMode: 'bodyweight',
		primaryMuscle: 'abdominals',
		secondaryMuscles: ['obliques']
	},
	{
		id: 'peso-muerto-rumano',
		name: 'Peso muerto rumano',
		description: 'Flexión de cadera con piernas semiextendidas',
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'hamstrings',
		secondaryMuscles: ['glutes', 'adductors']
	},
	{
		id: 'peso-muerto-con-piernas-rigidas',
		name: 'Peso muerto con piernas rígidas',
		description: 'Flexión de cadera con piernas rectas',
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'hamstrings',
		secondaryMuscles: ['glutes', 'adductors']
	},
	{
		id: 'curl-femoral-tumbado',
		name: 'Curl femoral tumbado',
		description: 'Flexión de rodillas en máquina acostado',
		equipment: 'machine',
		loadMode: 'external',
		primaryMuscle: 'hamstrings',
		secondaryMuscles: ['calves']
	},
	{
		id: 'curl-femoral-sentado',
		name: 'Curl femoral sentado',
		description: 'Flexión de rodillas en máquina sentado',
		equipment: 'machine',
		loadMode: 'external',
		primaryMuscle: 'hamstrings',
		secondaryMuscles: ['calves']
	},
	{
		id: 'buenos-dias-con-barra',
		name: 'Buenos días con barra',
		description: 'Inclinación de torso con barra en espalda',
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'hamstrings',
		secondaryMuscles: ['glutes', 'adductors']
	},
	{
		id: 'dominadas',
		name: 'Dominadas',
		description: 'Subida del cuerpo colgado de una barra con agarre prono',
		equipment: 'bodyweight',
		loadMode: 'bodyweight',
		primaryMuscle: 'dorsals',
		secondaryMuscles: ['biceps', 'forearms', 'traps']
	},
	{
		id: 'dominadas-asistidas',
		name: 'Dominadas asistidas',
		description: 'Dominadas en máquina asistida que descuenta parte del peso corporal',
		equipment: 'machine',
		loadMode: 'assisted',
		primaryMuscle: 'dorsals',
		secondaryMuscles: ['biceps', 'forearms', 'traps']
	},
	{
		id: 'jalon-al-pecho',
		name: 'Jalón al pecho',
		description: 'Tirón de barra hacia el pecho en polea',
		equipment: 'cable',
		loadMode: 'external',
		primaryMuscle: 'dorsals',
		secondaryMuscles: ['biceps', 'forearms', 'traps']
	},
	{
		id: 'jalon-tras-nuca',
		name: 'Jalón tras nuca',
		description: 'Tirón de barra detrás de la cabeza en polea',
		equipment: 'cable',
		loadMode: 'external',
		primaryMuscle: 'dorsals',
		secondaryMuscles: ['biceps', 'forearms', 'traps']
	},
	{
		id: 'remo-con-barra',
		name: 'Remo con barra',
		description: 'Tirón de barra hacia el abdomen inclinado',
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'dorsals',
		secondaryMuscles: ['biceps', 'traps', 'shoulders']
	},
	{
		id: 'remo-con-mancuernas',
		name: 'Remo con mancuernas',
		description: 'Tirón de mancuernas hacia el abdomen inclinado',
		equipment: 'dumbbell',
		loadMode: 'external',
		primaryMuscle: 'dorsals',
		secondaryMuscles: ['biceps', 'traps', 'shoulders']
	},
	{
		id: 'remo-en-maquina',
		name: 'Remo en máquina',
		description: 'Tirón de palancas hacia el abdomen sentado',
		equipment: 'machine',
		loadMode: 'external',
		primaryMuscle: 'dorsals',
		secondaryMuscles: ['biceps', 'traps', 'shoulders']
	},
	{
		id: 'pullover-con-mancuerna',
		name: 'Pullover con mancuerna',
		description: 'Extensión de brazos sobre la cabeza acostado',
		equipment: 'dumbbell',
		loadMode: 'external',
		primaryMuscle: 'dorsals',
		secondaryMuscles: ['chest', 'triceps']
	},
	{
		id: 'empuje-de-cadera-con-barra',
		name: 'Empuje de cadera con barra',
		description: 'Elevación de caderas con barra apoyada',
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'glutes',
		secondaryMuscles: ['hamstrings', 'adductors']
	},
	{
		id: 'puente-de-gluteos',
		name: 'Puente de glúteos',
		description: 'Elevación de caderas acostado',
		equipment: 'bodyweight',
		loadMode: 'bodyweight',
		primaryMuscle: 'glutes',
		secondaryMuscles: ['hamstrings']
	},
	{
		id: 'peso-muerto-sumo',
		name: 'Peso muerto sumo',
		description: 'Levantamiento de barra con piernas separadas',
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'glutes',
		secondaryMuscles: ['quads', 'adductors', 'hamstrings']
	},
	{
		id: 'sentadilla-sumo',
		name: 'Sentadilla sumo',
		description: 'Sentadilla con piernas abiertas y pies hacia afuera',
		equipment: 'dumbbell',
		loadMode: 'external',
		primaryMuscle: 'glutes',
		secondaryMuscles: ['quads', 'adductors']
	},
	{
		id: 'patada-de-gluteo-en-maquina',
		name: 'Patada de glúteo en máquina',
		description: 'Extensión de pierna hacia atrás en máquina',
		equipment: 'machine',
		loadMode: 'external',
		primaryMuscle: 'glutes',
		secondaryMuscles: ['hamstrings']
	},
	{
		id: 'zancadas-caminando',
		name: 'Zancadas caminando',
		description: 'Paso largo hacia adelante alternando piernas',
		equipment: 'bodyweight',
		loadMode: 'bodyweight',
		primaryMuscle: 'glutes',
		secondaryMuscles: ['quads', 'adductors']
	},
	{
		id: 'zancada-cruzada',
		name: 'Zancada cruzada',
		description: 'Paso cruzado hacia atrás con flexión de rodilla',
		equipment: 'bodyweight',
		loadMode: 'bodyweight',
		primaryMuscle: 'glutes',
		secondaryMuscles: ['quads', 'adductors']
	},
	{
		id: 'aduccion-de-cadera-en-maquina',
		name: 'Aducción de cadera en máquina',
		description: 'Cierre de piernas en máquina sentado',
		equipment: 'machine',
		loadMode: 'external',
		primaryMuscle: 'adductors',
		secondaryMuscles: []
	},
	{
		id: 'elevacion-de-pierna-interna',
		name: 'Elevación de pierna interna',
		description: 'Tumbado de lado, elevación de la pierna de abajo con la otra cruzada por delante',
		equipment: 'bodyweight',
		loadMode: 'bodyweight',
		primaryMuscle: 'adductors',
		secondaryMuscles: []
	},
	{
		id: 'aduccion-con-banda-elastica',
		name: 'Aducción con banda elástica',
		description: 'Cierre de piernas con resistencia elástica',
		equipment: 'other',
		loadMode: 'external',
		primaryMuscle: 'adductors',
		secondaryMuscles: []
	},
	{
		id: 'curl-de-muneca-con-barra',
		name: 'Curl de muñeca con barra',
		description: 'Flexión de muñeca con barra sentado',
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'forearms',
		secondaryMuscles: []
	},
	{
		id: 'extension-de-muneca-con-barra',
		name: 'Extensión de muñeca con barra',
		description: 'Extensión de muñeca con barra sentado',
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'forearms',
		secondaryMuscles: []
	},
	{
		id: 'extension-de-muneca-con-mancuerna',
		name: 'Extensión de muñeca con mancuerna',
		description: 'Extensión de muñeca con mancuerna sentado',
		equipment: 'dumbbell',
		loadMode: 'external',
		primaryMuscle: 'forearms',
		secondaryMuscles: []
	},
	{
		id: 'rotacion-de-muneca-con-barra',
		name: 'Rotación de muñeca con barra',
		description: 'Giro de muñeca con barra sentado',
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'forearms',
		secondaryMuscles: []
	},
	{
		id: 'rotacion-de-muneca-con-mancuerna',
		name: 'Rotación de muñeca con mancuerna',
		description: 'Giro de muñeca con mancuerna sentado',
		equipment: 'dumbbell',
		loadMode: 'external',
		primaryMuscle: 'forearms',
		secondaryMuscles: []
	},
	{
		id: 'curl-inverso-con-barra',
		name: 'Curl inverso con barra',
		description: 'Flexión de codos con agarre prono',
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'forearms',
		secondaryMuscles: ['biceps']
	},
	{
		id: 'extension-de-triceps-en-polea',
		name: 'Extensión de tríceps en polea',
		description: 'Empuje de cuerda hacia abajo en polea',
		equipment: 'cable',
		loadMode: 'external',
		primaryMuscle: 'triceps',
		secondaryMuscles: []
	},
	{
		id: 'press-frances',
		name: 'Press francés',
		description: 'Extensión de codos con barra acostado',
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'triceps',
		secondaryMuscles: []
	},
	{
		id: 'extension-de-triceps-con-mancuerna',
		name: 'Extensión de tríceps con mancuerna',
		description: 'Extensión de codo con mancuerna sobre la cabeza',
		equipment: 'dumbbell',
		loadMode: 'external',
		primaryMuscle: 'triceps',
		secondaryMuscles: []
	},
	{
		id: 'fondos-en-banco',
		name: 'Fondos en banco',
		description: 'Descenso y elevación del cuerpo entre bancos',
		equipment: 'bodyweight',
		loadMode: 'bodyweight',
		primaryMuscle: 'triceps',
		secondaryMuscles: ['chest', 'shoulders']
	},
	{
		id: 'press-militar-con-barra',
		name: 'Press militar con barra',
		description: 'Empuje de barra sobre la cabeza de pie',
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'shoulders',
		secondaryMuscles: ['triceps', 'traps', 'chest']
	},
	{
		id: 'elevacion-lateral-con-mancuernas',
		name: 'Elevación lateral con mancuernas',
		description: 'Levantamiento de mancuernas a los lados',
		equipment: 'dumbbell',
		loadMode: 'external',
		primaryMuscle: 'shoulders',
		secondaryMuscles: ['traps']
	},
	{
		id: 'elevacion-frontal-con-mancuernas',
		name: 'Elevación frontal con mancuernas',
		description: 'Levantamiento de mancuernas al frente',
		equipment: 'dumbbell',
		loadMode: 'external',
		primaryMuscle: 'shoulders',
		secondaryMuscles: ['chest', 'traps']
	},
	{
		id: 'pajaros-con-mancuernas',
		name: 'Pájaros con mancuernas',
		description: 'Elevación lateral inclinada con mancuernas',
		equipment: 'dumbbell',
		loadMode: 'external',
		primaryMuscle: 'shoulders',
		secondaryMuscles: ['traps']
	},
	{
		id: 'elevacion-posterior-en-maquina',
		name: 'Elevación posterior en máquina',
		description: 'Apertura de brazos hacia atrás en máquina',
		equipment: 'machine',
		loadMode: 'external',
		primaryMuscle: 'shoulders',
		secondaryMuscles: ['traps']
	},
	{
		id: 'remo-al-menton-con-barra',
		name: 'Remo al mentón con barra',
		description: 'Tirón de barra hacia el mentón de pie',
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'shoulders',
		secondaryMuscles: ['traps', 'biceps']
	},
	{
		id: 'remo-al-menton-con-banda-elastica',
		name: 'Remo al mentón con banda elástica',
		description: 'Tirón de banda hacia el mentón de pie',
		equipment: 'other',
		loadMode: 'external',
		primaryMuscle: 'shoulders',
		secondaryMuscles: ['traps', 'biceps']
	},
	{
		id: 'encogimientos-con-barra',
		name: 'Encogimientos con barra',
		description: 'Elevación de hombros con barra de pie',
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'traps',
		secondaryMuscles: []
	},
	{
		id: 'encogimientos-con-mancuernas',
		name: 'Encogimientos con mancuernas',
		description: 'Elevación de hombros con mancuernas de pie',
		equipment: 'dumbbell',
		loadMode: 'external',
		primaryMuscle: 'traps',
		secondaryMuscles: []
	},
	{
		id: 'elevacion-de-talones-de-pie',
		name: 'Elevación de talones de pie',
		description: 'Levantamiento de talones de pie con peso',
		equipment: 'machine',
		loadMode: 'external',
		primaryMuscle: 'calves',
		secondaryMuscles: []
	},
	{
		id: 'elevacion-de-talones-sentado',
		name: 'Elevación de talones sentado',
		description: 'Levantamiento de talones sentado con peso',
		equipment: 'machine',
		loadMode: 'external',
		primaryMuscle: 'calves',
		secondaryMuscles: []
	},
	{
		id: 'elevacion-de-talones-en-prensa',
		name: 'Elevación de talones en prensa',
		description: 'Levantamiento de talones en máquina específica',
		equipment: 'machine',
		loadMode: 'external',
		primaryMuscle: 'calves',
		secondaryMuscles: []
	},
	{
		id: 'giros-rusos',
		name: 'Giros rusos',
		description: 'Rotación del torso sentado con peso',
		equipment: 'bodyweight',
		loadMode: 'bodyweight',
		primaryMuscle: 'obliques',
		secondaryMuscles: ['abdominals']
	},
	{
		id: 'plancha-lateral',
		name: 'Plancha lateral',
		description: 'Mantener posición lateral apoyado en antebrazo',
		equipment: 'bodyweight',
		loadMode: 'bodyweight',
		primaryMuscle: 'obliques',
		secondaryMuscles: ['abdominals']
	},
	{
		id: 'crunch-lateral',
		name: 'Crunch lateral',
		description: 'Flexión lateral del torso acostado',
		equipment: 'bodyweight',
		loadMode: 'bodyweight',
		primaryMuscle: 'obliques',
		secondaryMuscles: ['abdominals']
	},
	{
		id: 'flexion-de-cuello-con-resistencia',
		name: 'Flexión de cuello con resistencia',
		description: 'Inclinación de cabeza hacia adelante con resistencia manual',
		equipment: 'other',
		loadMode: 'external',
		primaryMuscle: 'neck',
		secondaryMuscles: []
	},
	{
		id: 'extension-de-cuello-con-resistencia',
		name: 'Extensión de cuello con resistencia',
		description: 'Inclinación de cabeza hacia atrás con resistencia manual',
		equipment: 'other',
		loadMode: 'external',
		primaryMuscle: 'neck',
		secondaryMuscles: []
	},
	{
		id: 'extension-de-cuello-con-banda',
		name: 'Extensión de cuello con banda',
		description: 'Inclinación de cabeza hacia atrás contra banda elástica',
		equipment: 'other',
		loadMode: 'external',
		primaryMuscle: 'neck',
		secondaryMuscles: []
	},
	{
		id: 'inclinacion-lateral-de-cuello-con-banda',
		name: 'Inclinación lateral de cuello con banda',
		description: 'Inclinación lateral del cuello contra resistencia elástica',
		equipment: 'other',
		loadMode: 'external',
		primaryMuscle: 'neck',
		secondaryMuscles: []
	},
	{
		id: 'rotacion-de-cuello-con-banda',
		name: 'Rotación de cuello con banda',
		description: 'Giro de cabeza contra resistencia elástica',
		equipment: 'other',
		loadMode: 'external',
		primaryMuscle: 'neck',
		secondaryMuscles: []
	}
];
