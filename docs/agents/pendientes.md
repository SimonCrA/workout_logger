# Pendientes

Lo que está abierto y no vive en el código ni en un ticket. El dueño borra un punto cuando lo decide o lo convierte en un issue.

## Decisiones del dueño por confirmar

- **#32**: "6 meses" y "1 año" son 26 y 52 semanas naturales, no meses de calendario.
- **#32**: con "Todo", el gráfico de peso corporal también muestra registros anteriores al primer entrenamiento (el resto de gráficos empieza en la semana del primero).
- **#28**: el cuadro "1RM estimado" muestra "—" sin peso corporal en lugar de ocultarse.
- **#30**: "marca en Hoy" se leyó como la lista "Series de hoy" de la página del ejercicio. Una marca "Récord" en la fila del ejercicio de la pestaña Hoy sigue siendo posible; hoy no existe.
- **#16**: el descanso que compara el contador es el del ejercicio de la página en la página del ejercicio, y el de la última serie en Hoy. La asimetría es deliberada (documentada en `companion.ts`); el dueño puede cambiarla.
- **#19**: la escala del mapa de calor termina en el naranja del tema tal cual (más claro que el gris base), no en un naranja oscurecido.
- **Rediseño de Hoy**: la tarjeta del último entrenamiento lleva a su detalle, no a Historial; Historial queda como botón al final del título "Último entrenamiento". La franja "Últimos 7 días" dice la diferencia ("+4 vs antes", en verde si sube y ámbar si baja) en lugar de la flecha y "antes: N".

## Seguimientos

- **#18**: editar series desde el historial de la página del ejercicio (`ExerciseHistory`); hoy solo "Series de hoy" y el detalle de Historial lo permiten.
- **#12, #15**: renombrar `prescription*` y `unfinished*` en el código a los términos del glosario.
- **#27**: una serie asistida con más asistencia que el peso corporal da un peso efectivo negativo; solo el 1RM está protegido (nulo con peso ≤ 0).
- **#29, #30**: el glosario dice `PersonalRecord`; el código, `PersonalRecords` y `BrokenRecord`. Alinear uno con otro.
- **#32**: el comportamiento de cada vista del gráfico del ejercicio está repartido entre `ExerciseChart.svelte`, `labels.ts`, `charts.ts` y `types.ts`. Antes de añadir una quinta vista, reúnelo en un registro por vista.
- **#18**: límites de "gana el cambio más reciente" por fila que se dejaron así: una serie editada o añadida en B antes de recibir el cambio de fecha de A conserva su hora anterior (y una serie añadida a un entrenamiento que A borró sigue viva); borrar todas las series de un entrenamiento deja un entrenamiento vivo y vacío, oculto en Historial (se abre por URL y se borra ahí); mover hacia atrás 3 h o más un entrenamiento libre en curso deja que la regla de inactividad lo cierre; uno de rutina movido a ayer muestra el aviso "empezó otro día".
- **#19**: los entrenamientos de una ventana cuentan por `startedAt` y sus series por `performedAt`: una incoherencia momentánea en el borde de la ventana.

## Hoja de ruta

- **Fase 4**: planes (ciclo rotativo con descanso; la app propone el siguiente y se puede cambiar), banda objetivo editable por músculo (hoy fija en 10–20 y 6 de mantenimiento) y mapa corporal femenino (segundo SVG con los mismos ids de región, elegido por el sexo del perfil o por un interruptor en el mapa; el SVG actual está trazado a mano y falta dibujarlo). Aún sin spec ni tickets.
- **Fase 5**: PWA, pulido, buzón de sugerencias (issue de GitHub) y exportación JSON del perfil.
- **Adelantar la PWA**: se sugirió hacerla antes de la fase 4, como un solo ticket (manifiesto, `src/service-worker.ts`, aviso de actualización y e2e de recarga sin red). El dueño no ha decidido. Hoy no hay manifiesto ni service worker.
- Fuera de alcance hasta ahora: ejercicios personalizados, superseries, notificaciones o sonido, importar desde Excel.
