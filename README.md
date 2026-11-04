# Workout Logger

Registro personal de entrenamientos de fuerza, pensado para usarse desde el teléfono entre series. Es una app local-first: los datos viven en el dispositivo y, con cuenta, se respaldan en el servidor.

Vocabulario del dominio en `GLOSSARY.md`; decisiones de fondo en `docs/adr/`. Es la reescritura sobre SvelteKit de la app Astro anterior (ADR-0002); el código Astro queda en el historial, en la etiqueta `astro`.

## Stack

SvelteKit en Vercel (páginas renderizadas en el cliente), Tailwind 4 y shadcn-svelte con el tema en variables CSS (`src/routes/layout.css`), fuente Russo One e íconos en un sprite SVG.

## Correr la app

Requiere Node 24 y pnpm 12 (el campo `packageManager` fija la versión).

```sh
pnpm install
pnpm dev          # servidor de desarrollo
pnpm build        # build de producción (adapter Vercel)
pnpm preview      # sirve el build en http://localhost:4173
```

## Tests y calidad

```sh
pnpm check        # typecheck (svelte-check)
pnpm test:unit    # Vitest (añade --run para una sola pasada)
pnpm test:e2e     # Playwright contra el build; la primera vez: pnpm exec playwright install chromium
pnpm test         # unit + e2e
pnpm lint         # prettier --check
pnpm format       # prettier --write
```

Los tests unitarios van junto al código como `*.test.ts`; los de navegador, en `e2e/*.e2e.ts` y se ejecutan a tamaño de teléfono. GitHub Actions (`.github/workflows/ci.yml`) corre Prettier, typecheck, Vitest y Playwright en cada push. En local, `pnpm install` activa el hook de `.githooks/` (`core.hooksPath`): el pre-commit rechaza archivos sin formatear. `src/lib/glossary.test.ts` falla si un texto de la interfaz usa una palabra que GLOSSARY.md manda evitar. Lo que la revisión exige además está en `CODING_STANDARDS.md`.

## Íconos

Los SVG fuente están en `src/lib/assets/icons/` (estilo Hugeicons, trazo de 1,5). Tras añadir o cambiar uno, regenera el sprite y súbelo al repo:

```sh
pnpm build:icons  # escribe static/icons.svg
```

Se usan con el componente `Icon` (`<Icon name="dumbbell" class="size-6" />`). `icons.test.ts` comprueba que el sprite corresponde a la carpeta y que no sobra ni falta ningún ícono respecto a los que la app nombra.

## Catálogo base y mapa corporal

El catálogo (músculos con sus regiones del SVG y ejercicios) son datos estáticos en `src/lib/catalog/`, versionados con la app; no se sincronizan ni se editan desde la interfaz (ADR-0001, ADR-0004). `catalog.test.ts` valida su integridad y comprueba que no falte ningún ejercicio de la app Astro. Equipo, modo de carga y músculos secundarios se revisaron en el ticket #4 siguiendo ExRx.net, citado en el propio archivo de ejercicios.

Las rutinas base (`src/lib/catalog/routines.ts`) son el otro contenido del catálogo: grupos y rutinas con el objetivo de cada ejercicio (series, rango de reps y, si procede, RIR objetivo y descanso sugerido), redactadas con dos esquemas (básicos 3 × 5–8 con 150 s; accesorios 3 × 8–12 con RIR 2 y 90 s). `routines.test.ts` comprueba que cada ejercicio existe, que ninguno se repite dentro de una rutina, que los rangos tienen sentido y que todo grupo tiene al menos una rutina. Se consultan por grupo en `/rutinas/base` ("Crear rutina" → "Desde una rutina base") y en `/rutinas/base/<id>`, desde donde se copian como rutina personalizada; no se empiezan ni se editan.

El mapa corporal es `src/lib/assets/muscle-map.svg` (trazado a mano; los ids de las regiones son los que usa el catálogo) y se dibuja con el componente `BodyMap`. La búsqueda y el detalle de ejercicios viven en `/ejercicios` y `/ejercicios/<id>`, sin pestaña propia. Las pestañas son Hoy, Rutinas, Progreso y Perfil (`src/lib/navigation/tabs.ts`); Historial es una página a la que se llega desde Hoy.

## Datos locales

Las series y los entrenamientos viven en IndexedDB del dispositivo, con Dexie (`src/lib/log/db.ts`, base `workout_logger`); es la fuente de verdad (ADR-0001). Toda fila lleva `id` (UUID v7 generado en el cliente), `userId`, `createdAt`, `updatedAt`, `deletedAt` (borrado lógico) y `pending` (cambios sin subir). Un entrenamiento guarda además la rutina de la que nació y su nombre copiado (vacíos si es libre) y el modo (acompañamiento o solo registrar). Las reglas puras están en `src/lib/log/rules.ts`: en curso según ADR-0006 (con rutina, hasta "Terminar" o hasta que se empieza otro; libre, hasta 3 horas sin series; si de otro dispositivo bajan dos sin terminar, el más reciente cierra a los anteriores en su última serie), prellenado y última vez. El acceso a la base está en `src/lib/log/sets.ts` (series) y `src/lib/log/workouts.ts` (empezar desde una rutina, terminar, cambiar el modo; la última elección de modo se guarda en la tabla `meta` y el libre nace con ella), probado con `fake-indexeddb`. Un cambio de esquema es una versión nueva de Dexie con su `upgrade`, probada en `db.test.ts`. Los indicadores por ejercicio (series, reps, volumen, peso máximo, peso total, promedio por rep, 1RM estimado y fuerza relativa) se calculan en `src/lib/log/indicators.ts` solo sobre series de trabajo. El 1RM estimado usa Epley sobre reps efectivas (reps + RIR), `peso efectivo × (1 + reps efectivas / 30)`, solo hasta 10 reps efectivas, y se fecha en la primera serie que dio el máximo; en modo corporal y asistido cada serie usa el peso corporal vigente en su fecha (`bodyWeightAt` en `src/lib/log/profile-rules.ts`: el último registro de ese día o de antes, y antes del primero, el primero), y sin ningún registro los kilos quedan sin calcular. La fuerza relativa es el 1RM estimado de cada serie entre el peso corporal vigente en su fecha, con dos decimales ("1,45 × peso corporal"), y se compara solo con uno mismo (ADR-0005): sin ningún peso corporal no hay cuadro ni vista, solo una nota que lleva a Perfil, en cualquier modo de carga. El gráfico del ejercicio usa el mismo peso efectivo. Los récords (`src/lib/log/records.ts`) son tres medidas sobre las series de trabajo con peso efectivo conocido: peso máximo, 1RM estimado y reps máximas a un mismo peso efectivo. Una serie bate un récord si supera estrictamente a todas las anteriores en esa medida, así que la primera serie del ejercicio, o la primera a un peso, no bate nada; la marca "Récord" la lleva solo la serie que tiene hoy cada récord (la última que lo batió), y de varias registradas juntas, la primera. No se guardan: se derivan de las series, y borrar o corregir una las recalcula. La página del ejercicio tiene una sección "Récords" (peso máximo y 1RM estimado con fecha, y una tabla de reps máximas por peso), un aviso al registrar una serie que bate alguno y la marca "Récord" en las filas de sus series y en el detalle de Historial.

Las rutinas personalizadas son otra tabla sincronizable (`routines`, Dexie v4): nombre, rutina base de origen (si la hay) y la lista ordenada de ejercicios con su objetivo (series, rango de reps, RIR objetivo y descanso sugerido opcionales) embebida en la fila como un solo valor, así que cada guardado es un cambio de la rutina entera y un conflicto entre dispositivos se resuelve por rutina. La pestaña Rutinas lista las propias ("Mis rutinas") y ofrece crearlas desde una rutina base o desde cero; `/rutinas/nueva` y `/rutinas/<id>` son el editor (`RoutineEditor`), que trabaja sobre una copia en memoria con las reglas puras de `src/lib/log/routine-rules.ts` (copia de una rutina base, añadir sin repetir con el buscador, reordenar, validez, cambios sin guardar) y solo escribe al Guardar; salir con cambios pregunta y borrar es lógico. Las operaciones están en `src/lib/log/routines.ts`. Mis rutinas se ordena por la que lleva más tiempo sin hacerse (el inicio del último entrenamiento con esa rutina), las nunca hechas primero, y cada una tiene "Empezar", que pregunta el modo con la última elección preseleccionada (`StartRoutineDialog`) y lleva a Hoy; la que está en curso aparece marcada "En curso" y lleva a Hoy en lugar de empezarse otra vez.

Hoy, con un entrenamiento en curso, muestra arriba del dashboard su tarjeta: un panel oscuro (`WorkoutHeader`) con el nombre o "Libre", la hora de inicio y el descanso en grande (`RestCounter` en su variante `panel`, con una barra que se llena hasta el sugerido y se invierte a lima al llegar), el modo como interruptor deslizante, los ejercicios de la rutina en su orden con el objetivo, el progreso en series de trabajo frente a las prescritas (un punto por serie; el ejercicio que toca, el primero sin completar, va resaltado y su siguiente serie es el punto lima) y la línea de última vez, los ejercicios registrados fuera de la rutina ("Añadidos", en orden de primera serie), "Añadir ejercicio" (el buscador de `/ejercicios`) y "Terminar". Lo que se dibuja sale de una sola consulta viva (`todayLog` en `workouts.ts`) y de las funciones puras de `src/lib/log/today.ts`; la rutina se lee en directo, así que editarla cambia los objetivos del entrenamiento en curso, y si se borra a mitad sigue guiando hasta Terminar.

Hoy es siempre el dashboard (`TodayDashboard`); con un entrenamiento en curso, este ocupa el lugar de "Menos trabajados", el resto sigue debajo y el último entrenamiento es el anterior al en curso. La cabecera lleva la fecha sobre el título y, sin entrenamiento en curso, el botón "Libre" (entrenamiento libre, abre el buscador). Debajo, en este orden: "Menos trabajados", chips deslizables de lado con los músculos con ejercicios por debajo de mantenimiento, el más desatendido primero, cada uno con un anillo que se llena hasta mantenimiento y sus series por músculo sobre 6, que abren la hoja del músculo; "Últimos 7 días" (`WeekCard`: una tira con hoy y los 6 días anteriores, cada uno con su inicial y una barra con sus series de trabajo; debajo, entrenamientos con al menos una serie, series de trabajo y reps en una franja, cada uno con su diferencia frente a los 7 días anteriores, y "Músculos en banda: n de m"); el mapa de calor en un recuadro (cada músculo con un tono continuo del gris base al naranja secundario según sus series por músculo, 1 por primario y 0,5 por secundario, saturado a las 20; un interruptor Frente/Espalda con la pastilla que se desliza, que también sigue al gesto de deslizar el mapa; leyenda con 0, 6, 10 y 20; tocar un músculo abre su hoja), y el último entrenamiento como tarjeta que lleva a su detalle, con el botón Historial al final de su título. Las reglas puras (ventanas, series por músculo, banda y mantenimiento fijos en 10–20 y 6, tono, los chips de "Menos trabajados", la semana y su tira por día) están en `src/lib/log/dashboard.ts`; `BodyMap` acepta una intensidad por músculo (`data-heat` y la variable `--heat`) además de los resaltados, que siguen en azul primario.

Historial (`/historial`, desde Hoy) lista los entrenamientos con al menos una serie viva, del más reciente al más antiguo y separados por mes: cada fila dice el día ("Hoy", "Ayer" o el día de la semana con la fecha), el nombre copiado de la rutina o "Libre", la duración solo con acompañamiento (del inicio al fin o, si sigue sin terminar, a la última serie; ADR-0006) y "N ejercicios · M series", contando también las de calentamiento. `/historial/<id>` es el detalle: fecha, nombre, modo y duración si la hay, y los ejercicios en el orden en que se hicieron con sus series. Las reglas puras están en `src/lib/log/history.ts` (qué entrenamientos aparecen, lo que dice la fila, los separadores por mes) y la duración en `companion.ts`; las consultas vivas, en `workouts.ts`.

El pasado se corrige desde el detalle del historial y desde "Series de hoy" en la página del ejercicio: tocar una serie abre "Editar serie" (`SetEditor`: reps, peso, RIR, tipo y nota, o "Borrar serie"), y el detalle ofrece "Cambiar fecha" (`MoveWorkoutDialog`: el inicio nuevo no puede quedar en el futuro y todas las series se desplazan con él) y "Borrar entrenamiento". Todo borrado es lógico y cada corrección es un cambio normal de la fila, que se sincroniza con "gana el cambio más reciente" sin reglas aparte. Las reglas puras (`editSet`, `shiftWorkout`, `softDelete`, `newStartProblem`) están en `rules.ts`; las operaciones, en `sets.ts` y `workouts.ts`.

Los gráficos usan LayerChart 2 (componente `chart` de shadcn-svelte) a través de `PointsChart`. La página del ejercicio tiene una sección "Progreso" con un punto por entrenamiento: "Peso máximo" y "1RM estimado" (líneas) o "Volumen" (barras) con carga externa o con peso corporal conocido, "Fuerza relativa" (línea) con peso corporal conocido, y solo "Reps" en corporal y asistido sin peso corporal. La pestaña Progreso muestra "Series de trabajo por semana" (todas o de un músculo elegido) y "Entrenamientos por semana" por semanas naturales, de lunes a domingo, y "Peso corporal" (línea) con un punto por registro vivo de Perfil y el eje ajustado a los registros, no desde cero; sin registros, enlaza a Perfil. Cada página tiene un selector "Periodo" (`PeriodPicker`) que aplica a todos sus gráficos y no se guarda: 12 semanas, 6 meses (26 semanas), 1 año (52 semanas) o Todo, contados en semanas naturales con la actual incluida; el ejercicio abre en Todo y Progreso en 12 semanas, donde Todo empieza en la semana del primer entrenamiento y el peso corporal se recorta por fecha. El eje de fechas rotula como mucho seis fechas, por meses con su año si los puntos cubren unos ocho meses o más, y el tooltip lleva el año si cruzan un cambio de año. Las reglas puras están en `src/lib/log/charts.ts`.

Perfil empieza por "Peso corporal" (`BodyWeightSection`): el último valor con su fecha, un formulario de kg y fecha (hoy por defecto) y el historial con editar (`BodyWeightEditor`) y borrar por fila. Siguen "Datos" (`ProfileFields`): sexo, fecha de nacimiento y estatura, opcionales, que se guardan al cambiar. Son dos tablas sincronizables más (`profiles` y `bodyWeights`, Dexie v5), y existen con o sin cuenta. El peso corporal es un registro por día (fecha local sin hora, de 20 a 400 kg con un decimal): registrar en un día que ya tiene uno lo actualiza, corregir un registro hacia un día ocupado deja solo el corregido, y borrar es lógico; si dos dispositivos registraron el mismo día sin red, se muestra el más reciente, y registrar, corregir o borrar en ese día borra también el otro. El perfil es una fila que se guarda entera; si al asociar lo anónimo a una cuenta quedan dos vivos, la app muestra y edita el de `updatedAt` más reciente. Las reglas puras están en `src/lib/log/profile-rules.ts` y las operaciones en `src/lib/log/profile.ts`.

Después vienen la cuenta y "Acerca de" (`AboutSection`): la versión de `package.json`, inyectada al construir como `__APP_VERSION__` (`vite.config.ts`), y el correo de soporte.

Para empezar de cero en el navegador: herramientas de desarrollo → Application → IndexedDB → borrar `workout_logger`.

## Componentes de shadcn-svelte

```sh
pnpm dlx shadcn-svelte@latest add <componente>
```

La configuración está en `components.json`; los componentes se instalan en `src/lib/components/ui/`.

## Cuenta y base del servidor

La cuenta es opcional (ADR-0003): email y contraseña con Better Auth sobre Drizzle y libSQL, sin verificación ni recuperación por correo. Better Auth se monta en `/api/auth/*` desde `src/hooks.server.ts`; el resto del servidor son los dos endpoints de sincronización de la sección siguiente. Las tablas están en `src/lib/server/db/schema.ts` y las migraciones en `drizzle/`.

```sh
pnpm db:generate                       # nueva migración a partir del esquema
pnpm db:migrate                        # aplica las migraciones a TURSO_DATABASE_URL
pnpm db:reset-password <email>         # pide la contraseña nueva, la guarda y cierra sus sesiones
```

Para una base local basta `TURSO_DATABASE_URL=file:local.db` y `pnpm db:migrate`. En Turso, crea la base, ejecuta `pnpm db:migrate` con sus credenciales en `.env` y configura las mismas variables en Vercel.

## Sincronización

Con sesión, las series, entrenamientos, rutinas, el perfil y el peso corporal del dispositivo se suben solos y los de otros dispositivos bajan (ADR-0001): al abrir la app, al recuperar red, al volver a primer plano y tras cada registro. No hay botón de guardar. Las reglas de fusión ("gana el cambio más reciente", el borrado lógico compite igual, lo anónimo se asocia a la cuenta al entrar) son funciones puras en `src/lib/sync/rules.ts`; el cliente del dispositivo está en `src/lib/sync/client.ts` y el servidor en `src/lib/server/sync/` (`POST /api/sync/push`, `GET /api/sync/pull?cursor=N`, ambos con sesión). El cursor es una secuencia del servidor, no la fecha del cliente. Las tablas que se sincronizan se declaran en una lista en `src/lib/sync/tables.ts` (nombre en Dexie y en el protocolo, esquema de la fila, tope por subida y, si cuelga de otra, la tabla padre) con su tabla del servidor en `src/lib/server/sync/tables.ts`; subida, bajada, asociación a la cuenta y limpieza de pendientes recorren esa lista en orden, padres antes que hijos, así que añadir una tabla es declarar una entrada. Las columnas que una versión nueva añade a una fila son opcionales en el protocolo: al insertar toman el valor por defecto de la columna del servidor y al actualizar se conservan, para que un dispositivo con la app anterior siga subiendo sin borrar lo que otro guardó (así entraron rutina, nombre y modo del entrenamiento). Por la misma razón, una tabla que la subida no trae cuenta como vacía (así entraron las rutinas personalizadas, y después el perfil y el peso corporal); la app anterior, a su vez, ignora al bajar las tablas que no conoce, pero mueve el cursor igual, así que la versión de Dexie que trae una tabla nueva borra el cursor y el dispositivo baja todo otra vez. Perfil muestra los cambios pendientes y la última sincronización, y avisa antes de entrar con otra cuenta en un teléfono con datos.

## Variables de entorno

Se declaran en `src/env.ts` y se leen al arrancar el servidor; copia `.env.example` a `.env`.

| Variable                 | Uso                                                                     |
| ------------------------ | ----------------------------------------------------------------------- |
| `TURSO_DATABASE_URL`     | `libsql://…` en Turso o `file:…` en local (por defecto `file:local.db`) |
| `TURSO_AUTH_TOKEN`       | Token de Turso; vacío con un archivo local                              |
| `BETTER_AUTH_SECRET`     | Firma las sesiones (`openssl rand -base64 32`); obligatorio en Vercel   |
| `BETTER_AUTH_RATE_LIMIT` | Límite de peticiones de la cuenta; `off` solo en pruebas de navegador   |

Sin `BETTER_AUTH_SECRET` fuera de desarrollo la app funciona, pero la cuenta responde 503.

## Despliegue

Vercel despliega cada push: `main` como producción (https://workout-logger-simons-projects-981b9d10.vercel.app) y las demás ramas como preview. El build genera `.vercel/output` (Build Output API), así que no depende del preset de framework del proyecto. Las variables de entorno se configuran en Vercel para Production y Preview y se inyectan al crear cada despliegue: tras cambiarlas hay que redesplegar. Las URL propias de cada despliegue (`workout-logger-<hash>-…vercel.app`) piden iniciar sesión en Vercel; el dominio del proyecto es público.

Una versión que cambia el esquema del servidor se publica en dos pasos: primero `pnpm db:migrate` contra la base de producción (con sus credenciales en `.env`) y después el push a `main`. `pnpm db:status` lista las migraciones de `drizzle/` y si cada una ya está aplicada en esa base, solo leyendo. Las migraciones solo añaden columnas con valor por defecto o tablas nuevas, así que la app anterior sigue funcionando sobre el esquema nuevo, pero la nueva falla al sincronizar sobre el anterior.

Tras una versión que cambia una regla del dispositivo, conviene abrir la app en cada teléfono antes de seguir entrenando: uno con la versión anterior sigue sincronizando, pero aplica sus reglas viejas a lo que baja. Al pasar a la fase 2, la app anterior cierra a las 3 horas sin series cualquier entrenamiento, también uno empezado desde una rutina, y ese cierre gana en todos los dispositivos por ser el cambio más reciente.
