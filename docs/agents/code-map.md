# Mapa del código

Dónde vive cada cosa, para abrir solo los archivos que el ticket toca. El detalle de cada área está en README.md; las reglas de revisión, en CODING_STANDARDS.md. Rutas con `[id]`: entre comillas en zsh.

## Registro (`src/lib/log/`)

| Módulo                                  | Qué tiene                                                                                                            |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `types.ts`                              | `Workout`, `WorkoutSet`, `Routine`, `WorkoutMode` y las columnas de sincronización                                   |
| `db.ts`                                 | Dexie: tablas, versiones y `upgrade`, tabla `meta`                                                                   |
| `rules.ts`                              | Reglas puras del entrenamiento: en curso (ADR-0006), prellenado, última vez, `editSet`, `shiftWorkout`, `softDelete` |
| `routine-rules.ts`                      | Reglas puras del editor de rutinas y lo prescrito (`prescriptionFor`)                                                |
| `companion.ts`                          | Acompañamiento: descanso, tiempo transcurrido, duración                                                              |
| `today.ts`                              | Hoy durante el entrenamiento: progreso por ejercicio, "Añadidos"                                                     |
| `history.ts`                            | Historial: entradas, filas, meses                                                                                    |
| `dashboard.ts`                          | Hoy sin entrenamiento: series por músculo, mapa de calor, "Últimos 7 días"                                           |
| `charts.ts`                             | Puntos por entrenamiento y semanas de Progreso                                                                       |
| `indicators.ts`                         | Indicadores por ejercicio                                                                                            |
| `labels.ts`                             | Textos y formatos de la interfaz (números, fechas, modos)                                                            |
| `sets.ts`, `workouts.ts`, `routines.ts` | Operaciones sobre Dexie y sus consultas vivas (`live*`)                                                              |
| `live.svelte.ts`, `clock.svelte.ts`     | Consulta viva de Dexie y la hora como estado de Svelte                                                               |
| `fixtures.ts`                           | `makeSet`, `makeWorkout`, `makeRoutine`: las filas de los tests                                                      |

## Catálogo (`src/lib/catalog/`)

`exercises.ts`, `muscles.ts` y `routines.ts` (rutinas base) son datos estáticos; `queries.ts` los consulta, `search.ts` busca sin acentos y `labels.ts` da los textos de equipo, modo de carga y objetivo.

## Sincronización

- Dispositivo, en `src/lib/sync/`: `tables.ts` es la lista de tablas sincronizadas (se añade una tabla nueva aquí); también están `protocol.ts`, `rules.ts` (fusión, pura), `client.ts` y `runtime.svelte.ts` (cuándo sincroniza).
- Servidor, en `src/lib/server/`: `sync/sync.ts` (push y pull), `sync/http.ts`, `sync/tables.ts`, `db/schema.ts` (Drizzle) y `auth/` (Better Auth).

## Interfaz

- Rutas en `src/routes/`: Hoy (`+page.svelte`), `ejercicios/`, `rutinas/` (`nueva`, `[id]`, `base/`), `historial/`, `progreso/` y `perfil/`.
- Componentes propios en `src/lib/components/`. Los de shadcn-svelte están en `components/ui/`, generados, y se tocan lo menos posible.
- Diálogos de bits-ui 2: `AlertDialog.Action` no cierra el diálogo por sí solo; lo cierra el manejador al terminar (así un error se muestra sin cerrarlo).
- Gráficos: LayerChart 2, a través de `PointsChart`. `yNice={5}` para que el redondeo coincida con `ticks(5)`, y el tooltip de shadcn necesita un `formatter`, porque si no pega el valor al nombre.

## Tests

- Los unitarios van junto al código (`*.test.ts`). Las operaciones sobre Dexie usan `fake-indexeddb`, y la sincronización entre dos dispositivos se prueba en `src/lib/server/sync/sync.test.ts`.
- Los e2e van en `e2e/*.e2e.ts`, uno por flujo (`routine-workout`, `log-mode`, `history`, `corrections`, `dashboard`, `charts`…), contra el build y a tamaño de teléfono.

## Avisos conocidos e inofensivos

Al construir o correr los e2e aparecen dos avisos que no indican ningún problema:

- `failed to locate dependencies` (@opentelemetry/api, binarios de libsql).
- `Base URL is not set` (Better Auth).
