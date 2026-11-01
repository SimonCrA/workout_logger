---
status: accepted
date: 2026-10-29
---

# Lo que empiezas tú lo terminas tú

En la fase 1 todo entrenamiento era libre y se cerraba solo tras tres horas sin series, porque nadie lo empezaba ni lo terminaba. La fase 2 añade entrenamientos empezados a mano desde una rutina y un modo "solo registrar" en el que la persona anota las series horas después o a la mañana siguiente; con el cierre automático, esas series caerían en un entrenamiento libre nuevo y la rutina se perdería. Decidimos que un entrenamiento empezado a mano solo termina a mano (botón "Terminar") o cuando se empieza otro, que cierra el anterior en su última serie; el entrenamiento libre, que nadie empieza, conserva el cierre a las tres horas. Nunca hay dos en curso ni se reabre uno terminado.

## Considered Options

- **Tres horas para todos**: lo que ya hace el código. Rompe el caso de anotar después, que es la razón de ser del modo "solo registrar".
- **Un plazo más largo (12 o 24 horas) para todos**: cualquier número parte en dos a alguien que anota tarde, y deja un libre abierto medio día cuando la persona solo pasó a registrar una serie suelta.
- **Sin cierre automático para nadie**: el libre no tiene botón de empezar, así que tampoco tendría un momento natural de terminar; quedaría abierto para siempre.

## Consequences

- El modo (acompañamiento o solo registrar) es un dato del entrenamiento, no del dispositivo: así otro dispositivo muestra lo mismo y el historial sabe si la duración significa algo.
- Las series anotadas de una vez en "solo registrar" comparten hora, así que descanso y duración no se calculan ni se muestran para esos entrenamientos.
- Hoy avisa cuando el entrenamiento en curso empezó antes de hoy, para que el olvido se note antes de que las series del día siguiente se mezclen.
- La fecha y hora de inicio se pueden corregir después, y las series se mueven con ella, para quien empezó a registrar sin haber pulsado "Empezar".
