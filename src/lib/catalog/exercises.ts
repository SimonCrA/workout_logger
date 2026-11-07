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
		steps: [
			'Tumbado en el banco, con los pies firmes en el suelo y los omóplatos juntos y hacia abajo.',
			'Agarra la barra algo más ancho que los hombros y descuélgala con los brazos estirados.',
			'Baja la barra de forma controlada hasta rozar el pecho, con los codos a unos 45° del torso.',
			'Empuja hacia arriba hasta estirar los brazos, sin despegar los glúteos del banco.'
		],
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'chest',
		secondaryMuscles: ['triceps', 'shoulders']
	},
	{
		id: 'press-inclinado-con-mancuernas',
		name: 'Press inclinado con mancuernas',
		description: 'Empuje en banco inclinado con mancuernas',
		steps: [
			'Siéntate en un banco inclinado con la espalda apoyada y una mancuerna en cada mano a la altura del pecho.',
			'Empuja las mancuernas hacia arriba hasta estirar los brazos, acercándolas un poco entre sí.',
			'Baja despacio hasta sentir el estiramiento del pecho, con los codos a unos 45° del torso.',
			'Mantén las muñecas rectas y los omóplatos pegados al respaldo.'
		],
		equipment: 'dumbbell',
		loadMode: 'external',
		primaryMuscle: 'chest',
		secondaryMuscles: ['triceps', 'shoulders']
	},
	{
		id: 'aperturas-con-mancuernas',
		name: 'Aperturas con mancuernas',
		description: 'Apertura lateral de brazos en banco plano',
		steps: [
			'Tumbado en un banco plano, sostén las mancuernas sobre el pecho con los codos ligeramente flexionados.',
			'Abre los brazos hacia los lados en un arco amplio, manteniendo ese ligero ángulo de codos.',
			'Baja hasta sentir el estiramiento del pecho, sin pasar la línea de los hombros.',
			'Vuelve al punto de partida juntando las mancuernas como si abrazaras un tronco.'
		],
		equipment: 'dumbbell',
		loadMode: 'external',
		primaryMuscle: 'chest',
		secondaryMuscles: ['shoulders']
	},
	{
		id: 'press-declinado-con-barra',
		name: 'Press declinado con barra',
		description: 'Empuje en banco declinado con barra',
		steps: [
			'Túmbate en el banco declinado, sujeta bien las piernas y agarra la barra algo más ancha que los hombros.',
			'Saca la barra del soporte y sostenla con los brazos estirados sobre la parte baja del pecho.',
			'Baja la barra de forma controlada hasta rozar el pecho, con los codos a unos 45° del torso.',
			'Empuja hacia arriba hasta estirar los brazos, sin rebotar la barra.'
		],
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'chest',
		secondaryMuscles: ['triceps', 'shoulders']
	},
	{
		id: 'press-con-maquina',
		name: 'Press con máquina',
		description: 'Empuje horizontal en máquina de pecho',
		steps: [
			'Ajusta el asiento para que las empuñaduras queden a la altura del pecho y apoya bien la espalda.',
			'Agarra las empuñaduras con los codos a unos 45° del torso y los hombros hacia atrás.',
			'Empuja hacia delante hasta estirar los brazos casi del todo, sin bloquear los codos.',
			'Vuelve despacio hasta sentir el estiramiento del pecho, sin dejar caer la pesa.'
		],
		equipment: 'machine',
		loadMode: 'external',
		primaryMuscle: 'chest',
		secondaryMuscles: ['triceps', 'shoulders']
	},
	{
		id: 'flexiones',
		name: 'Flexiones',
		description: 'Empuje del cuerpo desde el suelo con las manos a la anchura de los hombros',
		steps: [
			'Apoya las manos en el suelo a la anchura de los hombros y estira las piernas hacia atrás.',
			'Mantén el cuerpo en línea recta de la cabeza a los talones, con el abdomen y los glúteos apretados.',
			'Baja el pecho hacia el suelo con los codos a unos 45° del torso.',
			'Empuja hasta estirar los brazos, sin hundir la cadera ni encoger los hombros.'
		],
		equipment: 'bodyweight',
		loadMode: 'bodyweight',
		primaryMuscle: 'chest',
		secondaryMuscles: ['triceps', 'shoulders']
	},
	{
		id: 'fondos-en-paralelas',
		name: 'Fondos en paralelas',
		description: 'Descenso y elevación del cuerpo en paralelas',
		steps: [
			'Sujétate en las paralelas con los brazos estirados y el torso ligeramente inclinado hacia delante.',
			'Baja doblando los codos hasta que los brazos formen unos 90°, controlando el descenso.',
			'Empuja hacia arriba hasta estirar los brazos, sin encoger los hombros.',
			'Evita balancear el cuerpo y mantén los codos cerca del torso.'
		],
		equipment: 'bodyweight',
		loadMode: 'bodyweight',
		primaryMuscle: 'chest',
		secondaryMuscles: ['triceps', 'shoulders']
	},
	{
		id: 'fondos-asistidos',
		name: 'Fondos asistidos',
		description: 'Fondos en máquina asistida que descuenta parte del peso corporal',
		steps: [
			'Ajusta el peso de asistencia, sube a la plataforma y sujeta las empuñaduras con los brazos estirados.',
			'Inclina ligeramente el torso hacia delante y baja doblando los codos hasta unos 90°.',
			'Empuja hacia arriba hasta estirar los brazos, sin encoger los hombros.',
			'Reduce la asistencia a medida que ganes fuerza.'
		],
		equipment: 'machine',
		loadMode: 'assisted',
		primaryMuscle: 'chest',
		secondaryMuscles: ['triceps', 'shoulders']
	},
	{
		id: 'curl-con-barra-recta',
		name: 'Curl con barra recta',
		description: 'Flexión de codos con barra recta',
		steps: [
			'De pie, agarra la barra con las palmas hacia arriba a la anchura de los hombros y los brazos estirados.',
			'Mantén los codos pegados a los costados y sube la barra doblando los codos.',
			'Aprieta los bíceps arriba sin balancear el torso ni impulsarte con la espalda.',
			'Baja despacio hasta estirar los brazos del todo.'
		],
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'biceps',
		secondaryMuscles: ['forearms']
	},
	{
		id: 'curl-alterno-con-mancuernas',
		name: 'Curl alterno con mancuernas',
		description: 'Flexión alterna de brazos con mancuernas',
		steps: [
			'De pie, sostén una mancuerna en cada mano con los brazos estirados y las palmas hacia delante.',
			'Sube una mancuerna doblando el codo, con el codo pegado al costado.',
			'Aprieta el bíceps arriba sin balancear el torso.',
			'Baja despacio y repite con el otro brazo, alternando.'
		],
		equipment: 'dumbbell',
		loadMode: 'external',
		primaryMuscle: 'biceps',
		secondaryMuscles: ['forearms']
	},
	{
		id: 'curl-martillo',
		name: 'Curl martillo',
		description: 'Flexión de codos con agarre neutro',
		steps: [
			'De pie, sostén una mancuerna en cada mano con las palmas mirando hacia los muslos.',
			'Mantén los codos pegados al torso y sube las mancuernas sin girar las muñecas.',
			'Aprieta arriba un instante, sin impulsarte con la espalda.',
			'Baja de forma controlada hasta estirar los brazos.'
		],
		equipment: 'dumbbell',
		loadMode: 'external',
		primaryMuscle: 'biceps',
		secondaryMuscles: ['forearms']
	},
	{
		id: 'curl-concentrado',
		name: 'Curl concentrado',
		description: 'Flexión de brazo apoyado en muslo',
		steps: [
			'Siéntate con las piernas abiertas e inclínate hacia delante, con el codo apoyado en la cara interna del muslo.',
			'Sostén la mancuerna con el brazo estirado y la palma hacia arriba.',
			'Sube la mancuerna hacia el hombro doblando solo el codo.',
			'Baja despacio hasta estirar el brazo, sin balancear el cuerpo.'
		],
		equipment: 'dumbbell',
		loadMode: 'external',
		primaryMuscle: 'biceps',
		secondaryMuscles: ['forearms']
	},
	{
		id: 'curl-en-banco-inclinado',
		name: 'Curl en banco inclinado',
		description: 'Flexión de brazos en banco inclinado',
		steps: [
			'Siéntate en un banco inclinado con la espalda apoyada y los brazos colgando con una mancuerna en cada mano.',
			'Mantén los codos a la altura del torso y sube las mancuernas doblando los codos.',
			'Aprieta los bíceps arriba sin adelantar los codos.',
			'Baja despacio hasta estirar los brazos del todo.'
		],
		equipment: 'dumbbell',
		loadMode: 'external',
		primaryMuscle: 'biceps',
		secondaryMuscles: ['forearms']
	},
	{
		id: 'curl-en-predicador',
		name: 'Curl en predicador',
		description: 'Flexión de brazos en banco Scott',
		steps: [
			'Siéntate en el banco Scott con los brazos apoyados en el cojín y la barra agarrada con las palmas hacia arriba.',
			'Baja la barra hasta estirar casi del todo los brazos, sin soltar el cojín.',
			'Sube doblando los codos y aprieta los bíceps arriba, sin levantar los codos del apoyo.',
			'Controla el descenso, sin dejar caer la barra.'
		],
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'biceps',
		secondaryMuscles: ['forearms']
	},
	{
		id: 'abduccion-de-cadera-en-maquina',
		name: 'Abducción de cadera en máquina',
		description: 'Separación de piernas en máquina específica',
		steps: [
			'Siéntate con la espalda apoyada y las piernas contra las almohadillas exteriores.',
			'Ajusta el rango para que arranque con las piernas juntas o algo abiertas.',
			'Abre las piernas empujando las almohadillas hacia fuera con los glúteos.',
			'Vuelve despacio al punto de partida, sin dejar que las pesas choquen.'
		],
		equipment: 'machine',
		loadMode: 'external',
		primaryMuscle: 'abductors',
		secondaryMuscles: ['glutes']
	},
	{
		id: 'elevacion-lateral-de-pierna',
		name: 'Elevación lateral de pierna',
		description: 'Levantamiento lateral de pierna acostado',
		steps: [
			'Túmbate de lado con el cuerpo en línea recta y apoya la cabeza en el brazo de abajo.',
			'Mantén la pierna de arriba estirada y la punta del pie mirando al frente.',
			'Elévala hacia arriba y hacia el lado sin girar la cadera hacia atrás.',
			'Baja despacio sin apoyarla sobre la otra pierna y repite.'
		],
		equipment: 'bodyweight',
		loadMode: 'bodyweight',
		primaryMuscle: 'abductors',
		secondaryMuscles: ['glutes']
	},
	{
		id: 'patada-lateral-de-pie',
		name: 'Patada lateral de pie',
		description: 'Elevación lateral de pierna estando de pie',
		steps: [
			'De pie, apoya una mano en una pared o soporte y mantén el torso erguido.',
			'Lleva una pierna estirada hacia el lado, con la punta del pie mirando al frente.',
			'Sube hasta sentir el glúteo medio sin inclinar el torso ni balancearte.',
			'Vuelve despacio al punto de partida y repite antes de cambiar de pierna.'
		],
		equipment: 'bodyweight',
		loadMode: 'bodyweight',
		primaryMuscle: 'abductors',
		secondaryMuscles: ['glutes']
	},
	{
		id: 'abduccion-de-cadera-con-banda',
		name: 'Abducción de cadera con banda',
		description: 'Separación de piernas con resistencia elástica',
		steps: [
			'Coloca la banda elástica alrededor de los muslos, justo por encima de las rodillas.',
			'De pie o tumbado, mantén el torso firme y los pies a la anchura de la cadera.',
			'Abre las piernas hacia fuera contra la resistencia de la banda.',
			'Vuelve despacio al punto de partida sin dejar que la banda tire de ti.'
		],
		equipment: 'other',
		loadMode: 'external',
		primaryMuscle: 'abductors',
		secondaryMuscles: ['glutes']
	},
	{
		id: 'sentadilla-con-barra',
		name: 'Sentadilla con barra',
		description: 'Flexión de rodillas con barra en espalda',
		steps: [
			'Coloca la barra sobre la parte alta de la espalda y separa los pies a la anchura de los hombros.',
			'Mantén el pecho alto, el abdomen firme y la espalda recta.',
			'Baja flexionando cadera y rodillas, con las rodillas siguiendo la línea de los pies, hasta el rango que controles.',
			'Empuja con todo el pie para subir sin que las rodillas se cierren.'
		],
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'quads',
		secondaryMuscles: ['glutes', 'adductors']
	},
	{
		id: 'sentadilla-frontal',
		name: 'Sentadilla frontal',
		description: 'Flexión de rodillas con barra al frente',
		steps: [
			'Apoya la barra sobre los hombros y la clavícula, con los codos altos y las manos sujetándola.',
			'Separa los pies a la anchura de los hombros y mantén el torso erguido.',
			'Baja flexionando cadera y rodillas, con los codos altos y el pecho arriba.',
			'Empuja con todo el pie para subir sin dejar caer los codos.'
		],
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'quads',
		secondaryMuscles: ['glutes', 'adductors']
	},
	{
		id: 'prensa-de-piernas',
		name: 'Prensa de piernas',
		description: 'Empuje de plataforma con piernas en máquina',
		steps: [
			'Siéntate con la espalda y la cadera bien apoyadas y los pies en la plataforma a la anchura de los hombros.',
			'Suelta los seguros y baja la plataforma flexionando las rodillas, sin despegar la cadera del asiento.',
			'Empuja la plataforma hasta estirar las piernas sin bloquear las rodillas.',
			'Mantén las rodillas alineadas con los pies durante todo el recorrido.'
		],
		equipment: 'machine',
		loadMode: 'external',
		primaryMuscle: 'quads',
		secondaryMuscles: ['glutes', 'adductors']
	},
	{
		id: 'sentadilla-hack',
		name: 'Sentadilla hack',
		description: 'Sentadilla en máquina con respaldo inclinado',
		steps: [
			'Apoya la espalda y los hombros en el respaldo, con los pies a la anchura de los hombros en la plataforma.',
			'Suelta los seguros y baja flexionando las rodillas de forma controlada.',
			'Baja hasta el rango que controles, sin despegar la espalda del respaldo.',
			'Empuja con todo el pie para subir sin bloquear las rodillas.'
		],
		equipment: 'machine',
		loadMode: 'external',
		primaryMuscle: 'quads',
		secondaryMuscles: ['glutes', 'adductors']
	},
	{
		id: 'extension-de-piernas',
		name: 'Extensión de piernas',
		description: 'Extensión de rodillas en máquina específica',
		steps: [
			'Siéntate con la espalda apoyada y el rodillo sobre la parte baja de las espinillas.',
			'Ajusta el asiento para que las rodillas queden alineadas con el eje de la máquina.',
			'Extiende las piernas hasta estirarlas casi del todo, apretando los cuádriceps arriba.',
			'Baja despacio sin dejar caer la pesa.'
		],
		equipment: 'machine',
		loadMode: 'external',
		primaryMuscle: 'quads',
		secondaryMuscles: []
	},
	{
		id: 'sentadilla-bulgara',
		name: 'Sentadilla búlgara',
		description: 'Zancada trasera con pie elevado',
		steps: [
			'Apoya el empeine del pie trasero en un banco y da un paso largo hacia delante con la otra pierna.',
			'Sostén una mancuerna en cada mano y mantén el torso erguido.',
			'Baja flexionando la rodilla delantera hasta que el muslo quede casi paralelo al suelo.',
			'Empuja con el pie delantero para subir, manteniendo la rodilla alineada con el pie.'
		],
		equipment: 'dumbbell',
		loadMode: 'external',
		primaryMuscle: 'quads',
		secondaryMuscles: ['glutes', 'adductors']
	},
	{
		id: 'zancada-lateral',
		name: 'Zancada lateral',
		description: 'Paso lateral amplio con flexión de rodilla',
		steps: [
			'De pie con los pies juntos y el torso erguido.',
			'Da un paso amplio hacia un lado y flexiona esa rodilla, llevando la cadera hacia atrás.',
			'Mantén la otra pierna estirada y los pies apuntando al frente.',
			'Empuja con la pierna flexionada para volver al centro y repite hacia el otro lado.'
		],
		equipment: 'bodyweight',
		loadMode: 'bodyweight',
		primaryMuscle: 'quads',
		secondaryMuscles: ['glutes', 'adductors']
	},
	{
		id: 'crunch-abdominal',
		name: 'Crunch abdominal',
		description: 'Flexión de tronco en el suelo',
		steps: [
			'Túmbate boca arriba con las rodillas dobladas y los pies apoyados en el suelo.',
			'Cruza los brazos sobre el pecho o coloca las manos junto a las sienes, sin tirar del cuello.',
			'Sube los hombros del suelo contrayendo el abdomen, sin incorporarte del todo.',
			'Baja despacio sin soltar la tensión del abdomen.'
		],
		equipment: 'bodyweight',
		loadMode: 'bodyweight',
		primaryMuscle: 'abdominals',
		secondaryMuscles: ['obliques']
	},
	{
		id: 'crunch-en-maquina',
		name: 'Crunch en máquina',
		description: 'Flexión de tronco en máquina específica',
		steps: [
			'Siéntate en la máquina, ajusta el asiento y agarra las empuñaduras o sujeta el apoyo.',
			'Mantén los pies firmes y la espalda apoyada en el respaldo.',
			'Flexiona el tronco hacia delante contrayendo el abdomen.',
			'Vuelve despacio al punto de partida sin dejar caer la pesa.'
		],
		equipment: 'machine',
		loadMode: 'external',
		primaryMuscle: 'abdominals',
		secondaryMuscles: ['obliques']
	},
	{
		id: 'elevacion-de-piernas',
		name: 'Elevación de piernas',
		description: 'Levantamiento de piernas acostado',
		steps: [
			'Túmbate boca arriba con las piernas estiradas y las manos bajo los glúteos o a los lados.',
			'Pega la parte baja de la espalda al suelo y contrae el abdomen.',
			'Sube las piernas juntas hasta formar unos 90° con el torso.',
			'Baja despacio sin que los talones toquen el suelo y sin arquear la espalda.'
		],
		equipment: 'bodyweight',
		loadMode: 'bodyweight',
		primaryMuscle: 'abdominals',
		secondaryMuscles: ['obliques']
	},
	{
		id: 'plancha-frontal',
		name: 'Plancha frontal',
		description: 'Mantener posición horizontal apoyado en antebrazos',
		steps: [
			'Apoya los antebrazos en el suelo con los codos bajo los hombros y las piernas estiradas.',
			'Sube la cadera hasta alinear el cuerpo de la cabeza a los talones.',
			'Aprieta el abdomen y los glúteos, sin hundir la cadera ni elevarla.',
			'Mantén la posición respirando con normalidad durante el tiempo marcado.'
		],
		equipment: 'bodyweight',
		loadMode: 'bodyweight',
		primaryMuscle: 'abdominals',
		secondaryMuscles: ['obliques']
	},
	{
		id: 'rueda-abdominal',
		name: 'Rueda abdominal',
		description: 'Deslizamiento hacia adelante con rueda abdominal',
		steps: [
			'Arrodíllate sobre una superficie blanda y agarra la rueda con las dos manos bajo los hombros.',
			'Contrae el abdomen y redondea ligeramente la espalda baja.',
			'Rueda hacia delante estirando el cuerpo hasta donde puedas mantener la espalda sin arquearse.',
			'Vuelve a la posición inicial tirando con el abdomen.'
		],
		equipment: 'other',
		loadMode: 'bodyweight',
		primaryMuscle: 'abdominals',
		secondaryMuscles: ['obliques', 'dorsals']
	},
	{
		id: 'escaladores',
		name: 'Escaladores',
		description: 'Movimiento alterno de piernas en posición de plancha',
		steps: [
			'Colócate en posición de plancha alta, con las manos bajo los hombros y el cuerpo en línea recta.',
			'Lleva una rodilla hacia el pecho sin levantar la cadera.',
			'Cambia de pierna con un salto corto, alternando a un ritmo constante.',
			'Mantén el abdomen firme y la espalda recta durante toda la serie.'
		],
		equipment: 'bodyweight',
		loadMode: 'bodyweight',
		primaryMuscle: 'abdominals',
		secondaryMuscles: ['obliques']
	},
	{
		id: 'peso-muerto-rumano',
		name: 'Peso muerto rumano',
		description: 'Flexión de cadera con piernas semiextendidas',
		steps: [
			'De pie, sostén la barra con agarre prono a la altura de los muslos y las rodillas ligeramente flexionadas.',
			'Lleva la cadera hacia atrás y baja la barra pegada a las piernas, con la espalda neutra.',
			'Baja hasta sentir el estiramiento de los isquiotibiales, sin redondear la espalda.',
			'Empuja la cadera hacia delante para subir, apretando los glúteos arriba.'
		],
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'hamstrings',
		secondaryMuscles: ['glutes', 'adductors']
	},
	{
		id: 'peso-muerto-con-piernas-rigidas',
		name: 'Peso muerto con piernas rígidas',
		description: 'Flexión de cadera con piernas rectas',
		steps: [
			'De pie, sostén la barra a la altura de los muslos con las piernas casi rectas.',
			'Inclina el torso hacia delante desde la cadera con la espalda neutra y baja la barra pegada a las piernas.',
			'Baja hasta sentir el estiramiento de los isquiotibiales, sin redondear la espalda.',
			'Sube llevando la cadera hacia delante y aprieta los glúteos arriba.'
		],
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'hamstrings',
		secondaryMuscles: ['glutes', 'adductors']
	},
	{
		id: 'curl-femoral-tumbado',
		name: 'Curl femoral tumbado',
		description: 'Flexión de rodillas en máquina acostado',
		steps: [
			'Túmbate boca abajo en la máquina con el rodillo sobre la parte baja de las pantorrillas.',
			'Agarra las empuñaduras y mantén la cadera pegada al banco.',
			'Flexiona las rodillas llevando los talones hacia los glúteos.',
			'Baja despacio hasta estirar las piernas, sin dejar caer la pesa.'
		],
		equipment: 'machine',
		loadMode: 'external',
		primaryMuscle: 'hamstrings',
		secondaryMuscles: ['calves']
	},
	{
		id: 'curl-femoral-sentado',
		name: 'Curl femoral sentado',
		description: 'Flexión de rodillas en máquina sentado',
		steps: [
			'Siéntate con la espalda apoyada y el rodillo sobre la parte baja de las pantorrillas.',
			'Ajusta el cojín de los muslos para que sujeten bien las piernas.',
			'Flexiona las rodillas llevando los talones hacia abajo y atrás.',
			'Vuelve despacio al punto de partida, sin que la pesa caiga.'
		],
		equipment: 'machine',
		loadMode: 'external',
		primaryMuscle: 'hamstrings',
		secondaryMuscles: ['calves']
	},
	{
		id: 'buenos-dias-con-barra',
		name: 'Buenos días con barra',
		description: 'Inclinación de torso con barra en espalda',
		steps: [
			'Coloca la barra sobre la parte alta de la espalda con los pies a la anchura de los hombros y las rodillas ligeramente flexionadas.',
			'Lleva la cadera hacia atrás e inclina el torso hacia delante con la espalda neutra.',
			'Baja hasta sentir el estiramiento de los isquiotibiales, sin redondear la espalda.',
			'Sube empujando la cadera hacia delante hasta quedar erguido.'
		],
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'hamstrings',
		secondaryMuscles: ['glutes', 'adductors']
	},
	{
		id: 'dominadas',
		name: 'Dominadas',
		description: 'Subida del cuerpo colgado de una barra con agarre prono',
		steps: [
			'Cuélgate de la barra con agarre prono algo más ancho que los hombros y los brazos estirados.',
			'Baja los hombros y contrae el abdomen para evitar balancearte.',
			'Sube llevando el pecho hacia la barra hasta pasar la barbilla.',
			'Baja de forma controlada hasta estirar los brazos del todo.'
		],
		equipment: 'bodyweight',
		loadMode: 'bodyweight',
		primaryMuscle: 'dorsals',
		secondaryMuscles: ['biceps', 'forearms', 'traps']
	},
	{
		id: 'dominadas-asistidas',
		name: 'Dominadas asistidas',
		description: 'Dominadas en máquina asistida que descuenta parte del peso corporal',
		steps: [
			'Ajusta el peso de asistencia, sitúate en la máquina y agarra las empuñaduras con los brazos estirados.',
			'Baja los hombros y mantén el pecho alto.',
			'Tira hacia arriba llevando los codos hacia abajo hasta pasar la barbilla de las empuñaduras.',
			'Baja despacio hasta estirar los brazos y reduce la asistencia a medida que ganes fuerza.'
		],
		equipment: 'machine',
		loadMode: 'assisted',
		primaryMuscle: 'dorsals',
		secondaryMuscles: ['biceps', 'forearms', 'traps']
	},
	{
		id: 'jalon-al-pecho',
		name: 'Jalón al pecho',
		description: 'Tirón de barra hacia el pecho en polea',
		steps: [
			'Siéntate con los muslos bajo las almohadillas y agarra la barra algo más ancha que los hombros.',
			'Inclina ligeramente el torso hacia atrás y saca el pecho.',
			'Tira de la barra hasta la parte alta del pecho, llevando los codos hacia abajo y atrás.',
			'Vuelve despacio hasta estirar los brazos, sin encoger los hombros.'
		],
		equipment: 'cable',
		loadMode: 'external',
		primaryMuscle: 'dorsals',
		secondaryMuscles: ['biceps', 'forearms', 'traps']
	},
	{
		id: 'jalon-tras-nuca',
		name: 'Jalón tras nuca',
		description: 'Tirón de barra detrás de la cabeza en polea',
		steps: [
			'Siéntate con los muslos bajo las almohadillas y agarra la barra con un agarre ancho.',
			'Mantén el torso erguido y baja la barra por detrás de la cabeza hasta la altura de la nuca.',
			'Llévala solo hasta donde tus hombros lo permitan sin molestias, sin forzar el cuello.',
			'Vuelve despacio hasta estirar los brazos.'
		],
		equipment: 'cable',
		loadMode: 'external',
		primaryMuscle: 'dorsals',
		secondaryMuscles: ['biceps', 'forearms', 'traps']
	},
	{
		id: 'remo-con-barra',
		name: 'Remo con barra',
		description: 'Tirón de barra hacia el abdomen inclinado',
		steps: [
			'De pie, con las rodillas flexionadas, inclina el torso hacia delante con la espalda neutra y la barra colgando.',
			'Mantén el abdomen firme y la mirada hacia el suelo.',
			'Tira de la barra hacia el abdomen llevando los codos hacia atrás.',
			'Aprieta la espalda arriba y baja despacio, sin impulsarte con el torso.'
		],
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'dorsals',
		secondaryMuscles: ['biceps', 'traps', 'shoulders']
	},
	{
		id: 'remo-con-mancuernas',
		name: 'Remo con mancuernas',
		description: 'Tirón de mancuernas hacia el abdomen inclinado',
		steps: [
			'Apoya una mano y una rodilla en un banco, con la espalda recta y una mancuerna en la otra mano.',
			'Deja el brazo colgando con el hombro relajado.',
			'Tira de la mancuerna hacia la cadera llevando el codo hacia atrás.',
			'Aprieta la espalda arriba y baja despacio, sin girar el torso.'
		],
		equipment: 'dumbbell',
		loadMode: 'external',
		primaryMuscle: 'dorsals',
		secondaryMuscles: ['biceps', 'traps', 'shoulders']
	},
	{
		id: 'remo-en-maquina',
		name: 'Remo en máquina',
		description: 'Tirón de palancas hacia el abdomen sentado',
		steps: [
			'Siéntate con el pecho apoyado en el cojín y agarra las empuñaduras con los brazos estirados.',
			'Mantén la espalda recta y los hombros abajo.',
			'Tira de las empuñaduras hacia el abdomen llevando los codos hacia atrás.',
			'Aprieta la espalda un instante y vuelve despacio al punto de partida.'
		],
		equipment: 'machine',
		loadMode: 'external',
		primaryMuscle: 'dorsals',
		secondaryMuscles: ['biceps', 'traps', 'shoulders']
	},
	{
		id: 'pullover-con-mancuerna',
		name: 'Pullover con mancuerna',
		description: 'Extensión de brazos sobre la cabeza acostado',
		steps: [
			'Túmbate en un banco con los hombros apoyados y sostén una mancuerna con las dos manos sobre el pecho.',
			'Mantén los codos ligeramente flexionados y la cadera baja.',
			'Baja la mancuerna por detrás de la cabeza hasta sentir el estiramiento de la espalda.',
			'Vuelve sobre el pecho con los brazos casi estirados, sin arquear la espalda.'
		],
		equipment: 'dumbbell',
		loadMode: 'external',
		primaryMuscle: 'dorsals',
		secondaryMuscles: ['chest', 'triceps']
	},
	{
		id: 'empuje-de-cadera-con-barra',
		name: 'Empuje de cadera con barra',
		description: 'Elevación de caderas con barra apoyada',
		steps: [
			'Siéntate en el suelo con la espalda alta apoyada en un banco y la barra sobre la cadera, con una protección.',
			'Apoya los pies a la anchura de los hombros con las rodillas dobladas.',
			'Empuja con los talones y sube la cadera hasta alinear torso y muslos, apretando los glúteos arriba.',
			'Baja de forma controlada, con el mentón hacia el pecho y sin arquear la parte baja de la espalda.'
		],
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'glutes',
		secondaryMuscles: ['hamstrings', 'adductors']
	},
	{
		id: 'puente-de-gluteos',
		name: 'Puente de glúteos',
		description: 'Elevación de caderas acostado',
		steps: [
			'Túmbate boca arriba con las rodillas dobladas y los pies apoyados cerca de los glúteos.',
			'Apoya los brazos a los lados y contrae el abdomen.',
			'Empuja con los talones y sube la cadera hasta alinear torso y muslos, apretando los glúteos arriba.',
			'Baja despacio sin arquear la parte baja de la espalda y repite.'
		],
		equipment: 'bodyweight',
		loadMode: 'bodyweight',
		primaryMuscle: 'glutes',
		secondaryMuscles: ['hamstrings']
	},
	{
		id: 'peso-muerto-sumo',
		name: 'Peso muerto sumo',
		description: 'Levantamiento de barra con piernas separadas',
		steps: [
			'Coloca los pies bien abiertos con las puntas hacia fuera y la barra sobre la mitad del pie.',
			'Agarra la barra con las manos dentro de las piernas, con la espalda neutra y el pecho alto.',
			'Empuja el suelo con las piernas abriendo las rodillas hasta estirar cadera y rodillas.',
			'Baja la barra pegada al cuerpo con la espalda recta y controlando el descenso.'
		],
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'glutes',
		secondaryMuscles: ['quads', 'adductors', 'hamstrings']
	},
	{
		id: 'sentadilla-sumo',
		name: 'Sentadilla sumo',
		description: 'Sentadilla con piernas abiertas y pies hacia afuera',
		steps: [
			'De pie, abre bien los pies con las puntas hacia fuera y sostén una mancuerna con las dos manos delante.',
			'Mantén el torso erguido y el abdomen firme.',
			'Baja flexionando cadera y rodillas, con las rodillas siguiendo la línea de los pies.',
			'Empuja con todo el pie para subir y aprieta los glúteos arriba.'
		],
		equipment: 'dumbbell',
		loadMode: 'external',
		primaryMuscle: 'glutes',
		secondaryMuscles: ['quads', 'adductors']
	},
	{
		id: 'patada-de-gluteo-en-maquina',
		name: 'Patada de glúteo en máquina',
		description: 'Extensión de pierna hacia atrás en máquina',
		steps: [
			'Colócate en la máquina con el pecho apoyado y el pie sobre la plataforma o el rodillo.',
			'Agarra las empuñaduras y mantén el torso firme.',
			'Empuja hacia atrás con el glúteo hasta estirar la pierna, sin arquear la espalda.',
			'Vuelve despacio al punto de partida sin dejar caer la pesa.'
		],
		equipment: 'machine',
		loadMode: 'external',
		primaryMuscle: 'glutes',
		secondaryMuscles: ['hamstrings']
	},
	{
		id: 'zancadas-caminando',
		name: 'Zancadas caminando',
		description: 'Paso largo hacia adelante alternando piernas',
		steps: [
			'De pie con el torso erguido y el abdomen firme, da un paso largo hacia delante.',
			'Baja flexionando ambas rodillas hasta unos 90°, sin que la rodilla delantera pase mucho de la punta del pie.',
			'Empuja con la pierna delantera y da el siguiente paso con la otra pierna.',
			'Repite alternando piernas, manteniendo el equilibrio y la espalda recta.'
		],
		equipment: 'bodyweight',
		loadMode: 'bodyweight',
		primaryMuscle: 'glutes',
		secondaryMuscles: ['quads', 'adductors']
	},
	{
		id: 'zancada-cruzada',
		name: 'Zancada cruzada',
		description: 'Paso cruzado hacia atrás con flexión de rodilla',
		steps: [
			'De pie con el torso erguido y los pies a la anchura de la cadera.',
			'Cruza una pierna por detrás de la otra, dando un paso hacia atrás y en diagonal.',
			'Baja flexionando ambas rodillas hasta unos 90°, con el torso estable.',
			'Empuja con la pierna delantera para volver al punto de partida y repite.'
		],
		equipment: 'bodyweight',
		loadMode: 'bodyweight',
		primaryMuscle: 'glutes',
		secondaryMuscles: ['quads', 'adductors']
	},
	{
		id: 'aduccion-de-cadera-en-maquina',
		name: 'Aducción de cadera en máquina',
		description: 'Cierre de piernas en máquina sentado',
		steps: [
			'Siéntate con la espalda apoyada y las piernas contra las almohadillas interiores.',
			'Ajusta el rango para que arranque con las piernas abiertas de forma cómoda.',
			'Junta las piernas empujando las almohadillas con los muslos internos.',
			'Vuelve despacio al punto de partida sin dejar que las pesas choquen.'
		],
		equipment: 'machine',
		loadMode: 'external',
		primaryMuscle: 'adductors',
		secondaryMuscles: []
	},
	{
		id: 'elevacion-de-pierna-interna',
		name: 'Elevación de pierna interna',
		description: 'Tumbado de lado, elevación de la pierna de abajo con la otra cruzada por delante',
		steps: [
			'Túmbate de lado con la pierna de arriba cruzada por delante, con el pie apoyado en el suelo.',
			'Apoya la cabeza en el brazo y mantén la pierna de abajo estirada.',
			'Eleva la pierna de abajo hacia el techo sin girar la cadera.',
			'Baja despacio sin apoyarla en el suelo y repite.'
		],
		equipment: 'bodyweight',
		loadMode: 'bodyweight',
		primaryMuscle: 'adductors',
		secondaryMuscles: []
	},
	{
		id: 'aduccion-con-banda-elastica',
		name: 'Aducción con banda elástica',
		description: 'Cierre de piernas con resistencia elástica',
		steps: [
			'Ata la banda elástica a un punto bajo y colócala alrededor del tobillo de la pierna de trabajo.',
			'Apóyate en un soporte, con el torso erguido y la pierna estirada hacia un lado.',
			'Lleva la pierna hacia el centro contra la resistencia de la banda, cruzándola ligeramente por delante.',
			'Vuelve despacio al punto de partida sin dejar que la banda tire de ti.'
		],
		equipment: 'other',
		loadMode: 'external',
		primaryMuscle: 'adductors',
		secondaryMuscles: []
	},
	{
		id: 'curl-de-muneca-con-barra',
		name: 'Curl de muñeca con barra',
		description: 'Flexión de muñeca con barra sentado',
		steps: [
			'Siéntate con los antebrazos apoyados en los muslos y la barra agarrada con las palmas hacia arriba.',
			'Deja que las muñecas queden fuera de las rodillas y baja la barra hasta los dedos.',
			'Flexiona las muñecas subiendo la barra lo máximo posible.',
			'Baja despacio, usando poco peso y sin mover los antebrazos.'
		],
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'forearms',
		secondaryMuscles: []
	},
	{
		id: 'extension-de-muneca-con-barra',
		name: 'Extensión de muñeca con barra',
		description: 'Extensión de muñeca con barra sentado',
		steps: [
			'Siéntate con los antebrazos apoyados en los muslos y la barra agarrada con las palmas hacia abajo.',
			'Deja que las muñecas queden fuera de las rodillas y baja la barra suavemente.',
			'Extiende las muñecas subiendo el dorso de la mano lo máximo posible.',
			'Baja despacio, usando poco peso y sin mover los antebrazos.'
		],
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'forearms',
		secondaryMuscles: []
	},
	{
		id: 'extension-de-muneca-con-mancuerna',
		name: 'Extensión de muñeca con mancuerna',
		description: 'Extensión de muñeca con mancuerna sentado',
		steps: [
			'Siéntate con el antebrazo apoyado en el muslo y la mancuerna en la mano con la palma hacia abajo.',
			'Deja que la muñeca quede fuera de la rodilla y baja la mancuerna suavemente.',
			'Extiende la muñeca subiendo el dorso de la mano lo máximo posible.',
			'Baja despacio, usando poco peso y sin mover el antebrazo.'
		],
		equipment: 'dumbbell',
		loadMode: 'external',
		primaryMuscle: 'forearms',
		secondaryMuscles: []
	},
	{
		id: 'rotacion-de-muneca-con-barra',
		name: 'Rotación de muñeca con barra',
		description: 'Giro de muñeca con barra sentado',
		steps: [
			'Siéntate con los antebrazos apoyados en los muslos y la barra agarrada con las dos manos.',
			'Mantén las muñecas fuera de las rodillas con la barra en posición horizontal.',
			'Gira las muñecas llevando las palmas hacia arriba y hacia abajo, sin mover los antebrazos.',
			'Usa poco peso y controla el movimiento en todo el recorrido.'
		],
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'forearms',
		secondaryMuscles: []
	},
	{
		id: 'rotacion-de-muneca-con-mancuerna',
		name: 'Rotación de muñeca con mancuerna',
		description: 'Giro de muñeca con mancuerna sentado',
		steps: [
			'Siéntate con el antebrazo apoyado en el muslo y la mancuerna agarrada por su centro.',
			'Mantén la muñeca fuera de la rodilla con la mancuerna en posición horizontal.',
			'Gira la muñeca llevando la palma hacia arriba y hacia abajo, sin mover el antebrazo.',
			'Usa poco peso y controla el movimiento en todo el recorrido.'
		],
		equipment: 'dumbbell',
		loadMode: 'external',
		primaryMuscle: 'forearms',
		secondaryMuscles: []
	},
	{
		id: 'curl-inverso-con-barra',
		name: 'Curl inverso con barra',
		description: 'Flexión de codos con agarre prono',
		steps: [
			'De pie, agarra la barra con las palmas hacia abajo a la anchura de los hombros y los brazos estirados.',
			'Mantén los codos pegados a los costados y la espalda recta.',
			'Sube la barra doblando los codos, con las muñecas rectas.',
			'Baja despacio hasta estirar los brazos, sin balancear el torso.'
		],
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'forearms',
		secondaryMuscles: ['biceps']
	},
	{
		id: 'extension-de-triceps-en-polea',
		name: 'Extensión de tríceps en polea',
		description: 'Empuje de cuerda hacia abajo en polea',
		steps: [
			'De pie frente a la polea alta, agarra la cuerda con los codos pegados a los costados.',
			'Mantén el torso ligeramente inclinado hacia delante y la espalda recta.',
			'Empuja la cuerda hacia abajo estirando los codos y separa las manos al final.',
			'Vuelve despacio hasta que los antebrazos queden casi paralelos al suelo.'
		],
		equipment: 'cable',
		loadMode: 'external',
		primaryMuscle: 'triceps',
		secondaryMuscles: []
	},
	{
		id: 'press-frances',
		name: 'Press francés',
		description: 'Extensión de codos con barra acostado',
		steps: [
			'Túmbate en un banco plano con la barra sobre el pecho y los brazos estirados hacia arriba.',
			'Mantén los codos apuntando al techo y los brazos casi verticales.',
			'Baja la barra hacia la frente doblando solo los codos.',
			'Extiende los codos para volver arriba, sin abrir los codos hacia los lados.'
		],
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'triceps',
		secondaryMuscles: []
	},
	{
		id: 'extension-de-triceps-con-mancuerna',
		name: 'Extensión de tríceps con mancuerna',
		description: 'Extensión de codo con mancuerna sobre la cabeza',
		steps: [
			'De pie o sentado, sostén una mancuerna con las dos manos sobre la cabeza y los brazos estirados.',
			'Mantén los codos cerca de la cabeza y apuntando hacia delante.',
			'Baja la mancuerna por detrás de la cabeza doblando solo los codos.',
			'Extiende los codos para volver arriba, con el torso firme.'
		],
		equipment: 'dumbbell',
		loadMode: 'external',
		primaryMuscle: 'triceps',
		secondaryMuscles: []
	},
	{
		id: 'fondos-en-banco',
		name: 'Fondos en banco',
		description: 'Descenso y elevación del cuerpo entre bancos',
		steps: [
			'Apoya las manos en el borde de un banco detrás de ti, con las piernas estiradas hacia delante.',
			'Baja la cadera doblando los codos hasta unos 90°, manteniendo la espalda cerca del banco.',
			'Empuja con los brazos hasta estirarlos, sin encoger los hombros.',
			'Mantén los codos apuntando hacia atrás, sin abrirlos.'
		],
		equipment: 'bodyweight',
		loadMode: 'bodyweight',
		primaryMuscle: 'triceps',
		secondaryMuscles: ['chest', 'shoulders']
	},
	{
		id: 'press-militar-con-barra',
		name: 'Press militar con barra',
		description: 'Empuje de barra sobre la cabeza de pie',
		steps: [
			'De pie, agarra la barra a la altura de los hombros con las manos algo más anchas que ellos.',
			'Aprieta el abdomen y los glúteos para mantener la espalda neutra.',
			'Empuja la barra hacia arriba hasta estirar los brazos sobre la cabeza.',
			'Baja de forma controlada hasta los hombros, sin arquear la parte baja de la espalda.'
		],
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'shoulders',
		secondaryMuscles: ['triceps', 'traps', 'chest']
	},
	{
		id: 'elevacion-lateral-con-mancuernas',
		name: 'Elevación lateral con mancuernas',
		description: 'Levantamiento de mancuernas a los lados',
		steps: [
			'De pie, sostén una mancuerna en cada mano a los lados con los codos ligeramente flexionados.',
			'Sube los brazos hacia los lados hasta la altura de los hombros.',
			'Evita encoger los hombros y no te impulses con el torso.',
			'Baja despacio hasta el punto de partida.'
		],
		equipment: 'dumbbell',
		loadMode: 'external',
		primaryMuscle: 'shoulders',
		secondaryMuscles: ['traps']
	},
	{
		id: 'elevacion-frontal-con-mancuernas',
		name: 'Elevación frontal con mancuernas',
		description: 'Levantamiento de mancuernas al frente',
		steps: [
			'De pie, sostén una mancuerna en cada mano delante de los muslos con los codos ligeramente flexionados.',
			'Sube los brazos hacia delante hasta la altura de los hombros.',
			'Mantén el torso firme, sin balancearte ni encoger los hombros.',
			'Baja despacio hasta el punto de partida.'
		],
		equipment: 'dumbbell',
		loadMode: 'external',
		primaryMuscle: 'shoulders',
		secondaryMuscles: ['chest', 'traps']
	},
	{
		id: 'pajaros-con-mancuernas',
		name: 'Pájaros con mancuernas',
		description: 'Elevación lateral inclinada con mancuernas',
		steps: [
			'Inclina el torso hacia delante con la espalda recta y una mancuerna en cada mano colgando.',
			'Mantén los codos ligeramente flexionados y el cuello relajado.',
			'Sube los brazos hacia los lados hasta la altura de los hombros, juntando los omóplatos.',
			'Baja despacio, sin impulsarte con el torso.'
		],
		equipment: 'dumbbell',
		loadMode: 'external',
		primaryMuscle: 'shoulders',
		secondaryMuscles: ['traps']
	},
	{
		id: 'elevacion-posterior-en-maquina',
		name: 'Elevación posterior en máquina',
		description: 'Apertura de brazos hacia atrás en máquina',
		steps: [
			'Siéntate de cara al respaldo de la máquina con el pecho apoyado y agarra las empuñaduras.',
			'Mantén los brazos casi estirados a la altura de los hombros.',
			'Abre los brazos hacia atrás, juntando los omóplatos.',
			'Vuelve despacio al punto de partida, sin que la pesa caiga.'
		],
		equipment: 'machine',
		loadMode: 'external',
		primaryMuscle: 'shoulders',
		secondaryMuscles: ['traps']
	},
	{
		id: 'remo-al-menton-con-barra',
		name: 'Remo al mentón con barra',
		description: 'Tirón de barra hacia el mentón de pie',
		steps: [
			'De pie, agarra la barra con las manos algo más estrechas que los hombros y los brazos estirados.',
			'Mantén la barra pegada al cuerpo y el torso erguido.',
			'Sube la barra hacia el mentón llevando los codos hacia arriba y hacia los lados.',
			'Baja despacio, sin subir los codos por encima de los hombros y sin impulsarte con la espalda.'
		],
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'shoulders',
		secondaryMuscles: ['traps', 'biceps']
	},
	{
		id: 'remo-al-menton-con-banda-elastica',
		name: 'Remo al mentón con banda elástica',
		description: 'Tirón de banda hacia el mentón de pie',
		steps: [
			'De pie sobre la banda elástica, agarra los extremos con las manos juntas delante de los muslos.',
			'Mantén el torso erguido y los brazos estirados.',
			'Sube las manos hacia el mentón llevando los codos hacia arriba y hacia los lados.',
			'Baja despacio, sin subir los codos por encima de los hombros.'
		],
		equipment: 'other',
		loadMode: 'external',
		primaryMuscle: 'shoulders',
		secondaryMuscles: ['traps', 'biceps']
	},
	{
		id: 'encogimientos-con-barra',
		name: 'Encogimientos con barra',
		description: 'Elevación de hombros con barra de pie',
		steps: [
			'De pie, sostén la barra delante de los muslos con las manos a la anchura de los hombros y los brazos estirados.',
			'Mantén el torso erguido y los brazos rectos.',
			'Sube los hombros hacia las orejas, sin girar ni doblar los codos.',
			'Baja despacio hasta el punto de partida.'
		],
		equipment: 'barbell',
		loadMode: 'external',
		primaryMuscle: 'traps',
		secondaryMuscles: []
	},
	{
		id: 'encogimientos-con-mancuernas',
		name: 'Encogimientos con mancuernas',
		description: 'Elevación de hombros con mancuernas de pie',
		steps: [
			'De pie, sostén una mancuerna en cada mano a los lados con los brazos estirados.',
			'Mantén el torso erguido y los brazos rectos.',
			'Sube los hombros hacia las orejas, sin girar ni doblar los codos.',
			'Baja despacio hasta el punto de partida.'
		],
		equipment: 'dumbbell',
		loadMode: 'external',
		primaryMuscle: 'traps',
		secondaryMuscles: []
	},
	{
		id: 'elevacion-de-talones-de-pie',
		name: 'Elevación de talones de pie',
		description: 'Levantamiento de talones de pie con peso',
		steps: [
			'Colócate bajo las almohadillas de la máquina con la punta de los pies en el borde de la plataforma.',
			'Mantén las piernas estiradas y el torso erguido.',
			'Sube los talones lo más alto posible, apretando las pantorrillas arriba.',
			'Baja despacio hasta sentir el estiramiento, sin rebotar.'
		],
		equipment: 'machine',
		loadMode: 'external',
		primaryMuscle: 'calves',
		secondaryMuscles: []
	},
	{
		id: 'elevacion-de-talones-sentado',
		name: 'Elevación de talones sentado',
		description: 'Levantamiento de talones sentado con peso',
		steps: [
			'Siéntate en la máquina con las almohadillas sobre los muslos y la punta de los pies en la plataforma.',
			'Suelta el seguro y deja bajar los talones hasta sentir el estiramiento.',
			'Sube los talones lo más alto posible, apretando las pantorrillas arriba.',
			'Baja despacio, sin rebotar.'
		],
		equipment: 'machine',
		loadMode: 'external',
		primaryMuscle: 'calves',
		secondaryMuscles: []
	},
	{
		id: 'elevacion-de-talones-en-prensa',
		name: 'Elevación de talones en prensa',
		description: 'Levantamiento de talones en máquina específica',
		steps: [
			'Siéntate en la prensa con la espalda apoyada y la punta de los pies en el borde inferior de la plataforma.',
			'Estira las piernas sin bloquear las rodillas y suelta los seguros.',
			'Empuja con la punta de los pies para subir los talones lo más alto posible.',
			'Baja despacio hasta sentir el estiramiento, sin rebotar.'
		],
		equipment: 'machine',
		loadMode: 'external',
		primaryMuscle: 'calves',
		secondaryMuscles: []
	},
	{
		id: 'giros-rusos',
		name: 'Giros rusos',
		description: 'Rotación del torso sentado con peso',
		steps: [
			'Siéntate con las rodillas dobladas, inclina el torso hacia atrás y sostén un peso con las dos manos.',
			'Mantén la espalda recta y el abdomen firme.',
			'Gira el torso hacia un lado llevando el peso junto a la cadera.',
			'Vuelve al centro y gira hacia el otro lado, de forma controlada.'
		],
		equipment: 'bodyweight',
		loadMode: 'bodyweight',
		primaryMuscle: 'obliques',
		secondaryMuscles: ['abdominals']
	},
	{
		id: 'plancha-lateral',
		name: 'Plancha lateral',
		description: 'Mantener posición lateral apoyado en antebrazo',
		steps: [
			'Túmbate de lado con el antebrazo apoyado en el suelo y el codo bajo el hombro.',
			'Apila los pies o coloca uno delante del otro para mayor estabilidad.',
			'Sube la cadera hasta alinear el cuerpo de la cabeza a los pies.',
			'Mantén la posición respirando con normalidad, sin dejar caer la cadera.'
		],
		equipment: 'bodyweight',
		loadMode: 'bodyweight',
		primaryMuscle: 'obliques',
		secondaryMuscles: ['abdominals']
	},
	{
		id: 'crunch-lateral',
		name: 'Crunch lateral',
		description: 'Flexión lateral del torso acostado',
		steps: [
			'Túmbate de lado con las rodillas dobladas y la mano detrás de la cabeza.',
			'Mantén la cadera apoyada y el abdomen contraído.',
			'Eleva el torso hacia los lados contrayendo el oblicuo, sin tirar del cuello.',
			'Baja despacio sin soltar la tensión y repite antes de cambiar de lado.'
		],
		equipment: 'bodyweight',
		loadMode: 'bodyweight',
		primaryMuscle: 'obliques',
		secondaryMuscles: ['abdominals']
	},
	{
		id: 'flexion-de-cuello-con-resistencia',
		name: 'Flexión de cuello con resistencia',
		description: 'Inclinación de cabeza hacia adelante con resistencia manual',
		steps: [
			'Siéntate con la espalda recta y apoya la mano en la frente.',
			'Mantén la barbilla ligeramente recogida.',
			'Inclina la cabeza hacia delante, haciendo fuerza suave contra la mano.',
			'Vuelve despacio al centro, con poca resistencia y sin dolor.'
		],
		equipment: 'other',
		loadMode: 'external',
		primaryMuscle: 'neck',
		secondaryMuscles: []
	},
	{
		id: 'extension-de-cuello-con-resistencia',
		name: 'Extensión de cuello con resistencia',
		description: 'Inclinación de cabeza hacia atrás con resistencia manual',
		steps: [
			'Siéntate con la espalda recta y entrelaza las manos detrás de la cabeza.',
			'Mantén la barbilla ligeramente recogida.',
			'Inclina la cabeza hacia atrás, haciendo fuerza suave contra las manos.',
			'Vuelve despacio al centro, con poca resistencia y sin dolor.'
		],
		equipment: 'other',
		loadMode: 'external',
		primaryMuscle: 'neck',
		secondaryMuscles: []
	},
	{
		id: 'extension-de-cuello-con-banda',
		name: 'Extensión de cuello con banda',
		description: 'Inclinación de cabeza hacia atrás contra banda elástica',
		steps: [
			'Sujeta un extremo de la banda elástica detrás de la cabeza y fija el otro a un punto delante.',
			'Siéntate con la espalda recta y la barbilla ligeramente recogida.',
			'Inclina la cabeza hacia atrás contra la tensión de la banda.',
			'Vuelve despacio al centro, con poca resistencia y sin dolor.'
		],
		equipment: 'other',
		loadMode: 'external',
		primaryMuscle: 'neck',
		secondaryMuscles: []
	},
	{
		id: 'inclinacion-lateral-de-cuello-con-banda',
		name: 'Inclinación lateral de cuello con banda',
		description: 'Inclinación lateral del cuello contra resistencia elástica',
		steps: [
			'Sujeta un extremo de la banda elástica junto a la sien y fija el otro a un punto a un lado.',
			'Siéntate con la espalda recta y los hombros relajados.',
			'Inclina la cabeza hacia el hombro contra la tensión de la banda.',
			'Vuelve despacio al centro, con poca resistencia y sin dolor.'
		],
		equipment: 'other',
		loadMode: 'external',
		primaryMuscle: 'neck',
		secondaryMuscles: []
	},
	{
		id: 'rotacion-de-cuello-con-banda',
		name: 'Rotación de cuello con banda',
		description: 'Giro de cabeza contra resistencia elástica',
		steps: [
			'Sujeta un extremo de la banda elástica junto a la sien y fija el otro a un punto a un lado.',
			'Siéntate con la espalda recta y la mirada al frente.',
			'Gira la cabeza hacia el lado contra la tensión de la banda.',
			'Vuelve despacio al centro, con poca resistencia y sin dolor.'
		],
		equipment: 'other',
		loadMode: 'external',
		primaryMuscle: 'neck',
		secondaryMuscles: []
	}
];
