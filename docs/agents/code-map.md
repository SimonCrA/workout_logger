# Mapa del código

Dónde vive cada cosa, para abrir solo los archivos que el ticket toca. El detalle de cada área está en README.md; las reglas de revisión, en CODING_STANDARDS.md. Rutas con `[id]`: entre comillas en zsh.

## Registro (`src/lib/log/`)

| Módulo                                                | Qué tiene                                                                                                            |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `types.ts`                                            | `Workout`, `WorkoutSet`, `Routine`, `Profile`, `BodyWeight`, `WorkoutMode` y las columnas de sincronización          |
| `db.ts`                                               | Dexie: tablas, versiones y `upgrade`, tabla `meta`                                                                   |
| `rules.ts`                                            | Reglas puras del entrenamiento: en curso (ADR-0006), prellenado, última vez, `editSet`, `shiftWorkout`, `softDelete` |
| `routine-rules.ts`                                    | Reglas puras del editor de rutinas y lo prescrito (`prescriptionFor`)                                                |
| `companion.ts`                                        | Acompañamiento: descanso, tiempo transcurrido, duración                                                              |
| `today.ts`                                            | Hoy durante el entrenamiento: progreso por ejercicio, "Añadidos"                                                     |
| `history.ts`                                          | Historial: entradas, filas, meses                                                                                    |
| `dashboard.ts`                                        | Hoy sin entrenamiento: series por músculo, mapa de calor, "Últimos 7 días"                                           |
| `charts.ts`                                           | Puntos por entrenamiento (con peso efectivo), semanas de Progreso, peso corporal, periodos y eje de fechas           |
| `indicators.ts`                                       | Indicadores por ejercicio, peso efectivo (`effectiveWeight`), 1RM estimado y fuerza relativa (`relativeStrength`)    |
| `records.ts`                                          | Récords por ejercicio y las series que los batieron (`personalRecords`, `recordsBrokenBy`)                           |
| `profile-rules.ts`                                    | Reglas puras del perfil y del peso corporal: un registro por día, corregir, validez, perfil y peso vigentes          |
| `labels.ts`                                           | Textos y formatos de la interfaz (números, fechas, modos)                                                            |
| `sets.ts`, `workouts.ts`, `routines.ts`, `profile.ts` | Operaciones sobre Dexie y sus consultas vivas (`live*`)                                                              |
| `live.svelte.ts`, `clock.svelte.ts`                   | Consulta viva de Dexie y la hora como estado de Svelte                                                               |
| `id.ts`                                               | `uuidv7`: ids ordenados por tiempo de creación (ADR-0001)                                                            |
| `fixtures.ts`                                         | `makeSet`, `makeWorkout`, `makeRoutine`, `makeProfile`, `makeBodyWeight`: las filas de los tests                     |

## Catálogo (`src/lib/catalog/`)

`exercises.ts`, `muscles.ts` y `routines.ts` (rutinas base) son datos estáticos, y `index.ts` es lo que el resto de la app importa (`#lib/catalog/index.js`); `queries.ts` los consulta, `search.ts` busca sin acentos y `labels.ts` da los textos de equipo, modo de carga y objetivo.

## Sincronización

- Dispositivo, en `src/lib/sync/`: `tables.ts` es la lista de tablas sincronizadas (se añade una tabla nueva aquí); también están `protocol.ts`, `rules.ts` (fusión, pura), `client.ts` y `runtime.svelte.ts` (cuándo sincroniza).
- Servidor, en `src/lib/server/`: `sync/sync.ts` (push y pull), `sync/http.ts`, `sync/tables.ts`, `db/schema.ts` (Drizzle) y `auth/` (Better Auth).

## Interfaz

- Rutas en `src/routes/`: Hoy (`+page.svelte`), `ejercicios/`, `rutinas/` (`nueva`, `[id]`, `base/`), `historial/`, `progreso/` y `perfil/`.
- Componentes propios en `src/lib/components/`. Los de shadcn-svelte están en `components/ui/`, generados, y se tocan lo menos posible.
- Diálogos de bits-ui 2: `AlertDialog.Action` no cierra el diálogo por sí solo; lo cierra el manejador al terminar (así un error se muestra sin cerrarlo).
- Gráficos: LayerChart 2, a través de `PointsChart`. `yNice={5}` para que el redondeo coincida con `ticks(5)`, y el tooltip de shadcn necesita un `formatter`, porque si no pega el valor al nombre. El periodo de cada página sale de `PeriodPicker`, y `PointsChart` elige marcas y formato de fechas con `axisTicks` y `dateFormats`.

## Tests

- `src/lib/code-map.test.ts` comprueba que este mapa nombra cada módulo de `log/`, `sync/` y `catalog/`, y que cada e2e importa `test` de `e2e/fixtures.ts`.

- Los unitarios van junto al código (`*.test.ts`). Las operaciones sobre Dexie usan `fake-indexeddb`, y la sincronización entre dos dispositivos se prueba en `src/lib/server/sync/sync.test.ts`.
- Los e2e van en `e2e/*.e2e.ts`, uno por flujo (`routine-workout`, `log-mode`, `history`, `corrections`, `dashboard`, `charts`…), contra el build y a tamaño de teléfono. Importan `test` y `expect` de `e2e/fixtures.ts`, que al final de cada test comprueba que la página no se desborda a lo ancho.

## Avisos conocidos e inofensivos

Al construir o correr los e2e aparecen dos avisos que no indican ningún problema:

- `failed to locate dependencies` (@opentelemetry/api, binarios de libsql).
- `Base URL is not set` (Better Auth).
