# Workout Logger

Registro personal de entrenamientos de fuerza en el gimnasio, pensado para usarse desde el teléfono entre series. Reemplaza una hoja de cálculo: registra lo que haces, recuerda lo que hiciste la última vez y muestra cómo progresas por ejercicio y por músculo.

Los términos se usan en español en la interfaz y en inglés en el código. El nombre en código va entre paréntesis cuando existe.

## Language

### Catálogo

**Ejercicio** (`Exercise`):
Un movimiento identificable que se registra y se compara en el tiempo, como "Press de banca plano". Tiene un equipo, un modo de carga, un músculo primario y cero o más secundarios.
_Avoid_: movimiento, actividad

**Catálogo base**:
Los ejercicios y las rutinas que vienen con la app, versionados con ella. Los ejercicios pueden ocultarse pero no editarse; las rutinas solo se copian.
_Avoid_: seed, ejercicios del sistema, contenido predefinido

**Ejercicio personalizado**:
Un ejercicio creado por la persona que usa la app, con los mismos atributos que uno del catálogo base.
_Avoid_: ejercicio custom, ejercicio propio

**Equipo** (`Equipment`):
Con qué se hace un ejercicio: barra, mancuerna, máquina, polea, peso corporal u otro. Distingue variantes cuyos kilos no son comparables entre sí.
_Avoid_: material, implemento

**Modo de carga** (`LoadMode`):
Cómo se interpreta el peso de una serie: externa (el peso es la carga), corporal (peso corporal más un adicional) o asistido (peso corporal menos la asistencia).
_Avoid_: tipo de peso

**Músculo** (`Muscle`):
Un grupo muscular con nombre, como "Dorsales", al que los ejercicios apuntan como primario o secundario. Un músculo puede tener varias regiones en el mapa corporal.
_Avoid_: grupo muscular, zona

**Región** (`Region`):
Un área del mapa corporal, en la vista frontal o posterior, que pertenece a un músculo. Los aductores tienen una región delante y otra detrás, pero son un solo músculo.
_Avoid_: parte, path

**Mapa corporal**:
La figura humana interactiva, en versión masculina y femenina, que muestra los músculos por región. Sirve para encontrar un músculo y sus ejercicios, y para ver dónde se concentran las series de la semana.
_Avoid_: selector de músculos, diagrama, figura

**Mapa de calor**:
El mapa corporal pintado con las series por músculo de los últimos 7 días: cada músculo lleva un tono continuo, más oscuro cuanto más se trabajó, hasta el tope de la banda objetivo. Los músculos por debajo de mantenimiento se nombran aparte, no con otro color.
_Avoid_: heatmap, huella de calor, mapa de actividad

### Registro

**Serie** (`WorkoutSet`):
Lo que se registra entre dos descansos: reps y peso de un ejercicio, con RIR opcional, un tipo y una nota. Es la unidad mínima del registro.
_Avoid_: set, workout, repetición

**Tipo de serie** (`SetType`):
Calentamiento, normal, fallo o drop. Las de calentamiento no cuentan para indicadores ni récords.
_Avoid_: categoría de serie

**Serie de trabajo**:
Cualquier serie que no es de calentamiento. Es la única que entra en volumen, 1RM estimado, récords y series por músculo.
_Avoid_: serie efectiva, serie real

**RIR**:
Repeticiones en reserva: cuántas reps más se podrían haber hecho al terminar la serie. Opcional, de 0 en adelante.
_Avoid_: RPE, esfuerzo

**Entrenamiento** (`Workout`):
Lo que se hizo en un día: las series agrupadas por ejercicio, con hora de inicio y de fin y un modo. Nace de una rutina o es libre, y pertenece al día en que empezó aunque se anote después.
_Avoid_: sesión, workout session, día de entrenamiento

**Entrenamiento libre**:
Un entrenamiento que no parte de una rutina; los ejercicios se eligen sobre la marcha. Nadie lo empieza: aparece con la primera serie.
_Avoid_: entrenamiento sin plan, improvisado

**En curso** (`open`):
El estado del único entrenamiento que todavía no tiene hora de fin. Uno empezado desde una rutina sigue en curso hasta que se termina a mano o se empieza otro; uno libre, hasta tres horas sin series.
_Avoid_: activo, abierto, pendiente

**Modo** (`WorkoutMode`):
Cómo acompaña la app un entrenamiento: con acompañamiento o solo registrar. Se elige al empezar, se recuerda para la próxima vez y se puede cambiar a mitad de entrenamiento.
_Avoid_: tipo de entrenamiento, configuración

**Acompañamiento** (`companion`):
El modo en que la app va con la persona durante el entrenamiento: tiempo transcurrido, descanso desde la última serie y progreso frente al objetivo.
_Avoid_: modo guiado, modo en vivo, modo cronómetro

**Solo registrar** (`log`):
El modo en que la app es un cuaderno: la persona apunta series, reps y peso cuando quiere, sin tiempos, y varias series iguales se anotan de una vez. Un entrenamiento así no tiene duración.
_Avoid_: modo logger, modo Excel, modo manual, registro posterior

**Última vez**:
Las series del entrenamiento más reciente en que se hizo un ejercicio. Se muestran al registrar ese ejercicio para saber qué superar.
_Avoid_: historial reciente, anterior

**Descanso**:
El tiempo entre el fin de una serie y el inicio de la siguiente. Se mide a partir de las horas de las series, no se registra a mano, así que solo existe con acompañamiento.
_Avoid_: pausa, intervalo

### Planificación

**Rutina** (`Routine`):
Una lista ordenada y reutilizable de ejercicios, cada uno con un objetivo, y opcionalmente RIR objetivo y descanso sugerido. No tiene peso objetivo. Es base o personalizada. Ejemplo: "Empuje A".
_Avoid_: plantilla, programa, workout template

**Rutina base**:
Una rutina que viene con la app, dentro de un grupo. Solo sirve de punto de partida: no se edita, no se empieza y no aparece entre las propias.
_Avoid_: plantilla, rutina predefinida, rutina del sistema

**Rutina personalizada**:
Una rutina creada por la persona que usa la app, desde cero o copiando una rutina base. Es la única que se empieza y se edita.
_Avoid_: rutina custom, rutina propia

**Grupo**:
Las rutinas base pensadas para hacerse juntas en rotación, como Empuje, Tirón y Pierna. Es solo una forma de ordenar el catálogo; el ciclo que las encadena es un plan.
_Avoid_: programa, split, división

**Objetivo**:
Lo que una rutina prescribe para un ejercicio: cuántas series y en qué rango de reps.
_Avoid_: meta, prescripción

**Plan** (`Plan`):
Un ciclo ordenado de rutinas y días de descanso que se repite, como Push, Pull, Legs, descanso. Propone qué rutina toca; no está atado a los días de la semana.
_Avoid_: programa, split, ciclo, calendario

### Indicadores

**Indicador**:
Un valor calculado a partir de series de trabajo que describe el estado o el progreso: volumen, 1RM estimado, récords, fuerza relativa, series por músculo. Los seis de la página de un ejercicio, heredados de la versión anterior, son series, reps, volumen total, peso máximo (fechado la primera vez que se levantó), peso total (la suma del peso efectivo de cada serie) y promedio por rep (volumen entre reps).
_Avoid_: estadística, stat, métrica

**Progreso**:
La evolución de los indicadores de un ejercicio a lo largo de sus entrenamientos.
_Avoid_: evolución, tendencia

**Peso corporal** (`BodyWeight`):
El peso de la persona en una fecha. Es un historial, no un dato fijo del perfil.
_Avoid_: peso (a secas, que es el de la serie)

**Peso efectivo**:
El peso que realmente se movió en una serie, según el modo de carga del ejercicio y el peso corporal vigente en esa fecha.
_Avoid_: peso real, carga total

**Volumen**:
La suma de peso efectivo por reps de las series de trabajo de un ejercicio, un entrenamiento o un periodo.
_Avoid_: tonelaje, carga total, volumen de carga

**1RM estimado** (`e1RM`):
El peso máximo que se estima poder levantar una vez, calculado a partir de la mejor serie de trabajo. Solo se calcula hasta 10 reps efectivas.
_Avoid_: 1RM (a secas, que sería uno real), máximo, one rep max

**Reps efectivas**:
Las reps de una serie más su RIR: las que se habrían hecho al llegar al fallo. Es la entrada del 1RM estimado.
_Avoid_: reps totales, reps al fallo

**Récord** (`PersonalRecord`):
El mejor valor histórico de un ejercicio en una de tres medidas: peso máximo, reps máximas a un peso dado, o 1RM estimado máximo. Se abrevia PR.
_Avoid_: marca personal, máximo histórico, best

**Fuerza relativa**:
El 1RM estimado dividido por el peso corporal. Se compara con uno mismo en el tiempo, no con tablas ni niveles.
_Avoid_: nivel, estándar de fuerza, ratio

**Series por músculo**:
Las series de trabajo de los últimos 7 días que trabajaron un músculo, contando 1 si es primario y 0,5 si es secundario.
_Avoid_: series efectivas, volumen semanal, series fraccionadas

**Banda objetivo**:
El rango de series por músculo que se considera adecuado en 7 días, 10 a 20 por defecto, editable por músculo.
_Avoid_: rango óptimo, MEV, MAV, MRV

**Mantenimiento**:
Las series por músculo en 7 días con las que se conserva lo ganado sin progresar: 6 por defecto.
_Avoid_: mínimo

### Cuenta

**Perfil** (`Profile`):
Los datos de la persona que entran en indicadores o en la interfaz: sexo, fecha de nacimiento, estatura y el historial de peso corporal. Existe con o sin cuenta.
_Avoid_: usuario, datos personales

**Cuenta** (`Account`):
Las credenciales con las que los datos del dispositivo se respaldan en el servidor y se recuperan en otro. La app funciona completa sin cuenta.
_Avoid_: usuario, login, perfil

**Uso anónimo**:
Usar la app sin cuenta: todos los datos viven solo en el dispositivo.
_Avoid_: modo invitado, offline, sin registro
