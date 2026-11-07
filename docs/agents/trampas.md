# Trampas conocidas

Lo que ya mordió una vez y no se deduce del README, el mapa del código ni el código. Quien descubra otra la añade aquí; quien la elimine del código la borra.

## Toolchain

- `shadcn-svelte init --preset` pide un código codificado, no un nombre. El del repo es `bIkeymG` (estilo vega, íconos lucide, neutral); `b1D0eTD6` (mira + hugeicons) se descartó por botones de 28 px, demasiado densos para el teléfono. El aviso de sobrescribir CSS no tiene `-y`.
- `pnpm dlx shadcn-svelte@latest add <nombre> -y` genera archivos con comillas dobles: corre `pnpm format` antes de commitear.
- pnpm 12 ignora el campo `pnpm` de `package.json`: la configuración va en `pnpm-workspace.yaml`. Un script de instalación sin aprobar falla con `ERR_PNPM_IGNORED_BUILDS`; se resuelve con `pnpm approve-builds '!<paquete>' -y` (escribe `allowBuilds`). Con una versión recién publicada, pnpm añade una entrada `minimumReleaseAgeExclude` a propósito.
- Un servidor en Vercel con una URL `libsql://` usa `@libsql/client/web` y `drizzle-orm/libsql/web` (`src/lib/server/db/client.ts`): el cliente nativo no cabe en la función y solo vale para `file:`.
- `workout-logger.vercel.app` es la app de otra persona, no la nuestra: no la uses para comprobar producción. El dominio público es el del README; las URL de cada despliegue piden login y no se pueden sondear con `curl`.
- Un ícono cuyo nombre se calcula (`<Icon name={x}>`) rompe `icons.test.ts`: decláralo como dato (`icon: 'check'`).
- Prettier recoloca un `{#if}` en línea dentro de texto de Svelte y se come el espacio antes de "·": arma esas líneas como cadena en el `<script>`.
- `git push` por SSH sale con la cuenta del trabajo (`simon-2528`) y GitHub lo rechaza; todo va con la cuenta personal, `SimonCrA`. El clon del dueño ya sube por HTTPS con su token, sin guardarlo, y `git push` funciona tal cual. En un clon nuevo, una vez: `git config remote.origin.pushurl https://github.com/SimonCrA/workout_logger.git`, `git config --add credential.helper ''` (vacía la lista: si no, responde antes el llavero de macOS con la cuenta del trabajo) y `git config --add credential.helper '!f(){ test "$1" = get || exit 0; echo username=x-access-token; echo "password=$(gh auth token --user SimonCrA)"; }; f'`. `git fetch` por SSH sí funciona.
- zsh indexa los arreglos desde 1 (`${A[0]}` queda vacío) y un script por índices se desplaza sin avisar: escribe los guiones de varios pasos con `bash <<'EOF' … EOF`. En macOS no existe `timeout`; usa el parámetro de timeout de la herramienta.

## Dexie y sincronización

- `ROUTINE_LIMITS` (`src/lib/log/routine-rules.ts`) es la única fuente de topes del editor y del `zod` de `src/lib/sync/tables.ts`. Si difieren, el editor guarda una fila que el servidor rechaza y cada subida falla con 400, bloqueando toda la sincronización.
- `live()` (`live.svelte.ts`) trata `undefined` como "cargando": una consulta que puede no encontrar nada debe emitir `null`, no `undefined`.
- Varias series con la misma hora (`addSets`) se ordenan por id, que más allá del milisegundo es aleatorio: los tests comparan ids como conjunto, no como lista.
- Nunca borres una fila sincronizada de verdad: toda baja es `softDelete`.

## Gráficos

- `LineChart` de LayerChart 2 fuerza el eje de valores desde 0; para una serie que no parte de cero (peso corporal) pasa `domain` a `PointsChart`. `BarChart` no lo necesita.
- Un alto en `dvh` sigue a la barra del navegador móvil, que aparece y se esconde con el scroll: el mapa corporal cambiaba de tamaño al levantar el dedo. Lo que vive dentro de una página con scroll mide en `svh`; `dvh` queda para los `max-h` de las hojas inferiores.
- Las etiquetas del eje cuelgan a la izquierda de la caja del gráfico, así que una captura de elemento las recorta: captura la página.

## Tests unitarios

- Vitest no fija zona horaria. Un test sensible a la fecha asigna `process.env.TZ` dentro del test y la restaura al terminar (ejemplo en `src/lib/log/profile-rules.test.ts`).
- La sincronización entre dos dispositivos se prueba con dos `WorkoutLoggerDb` sobre `fake-indexeddb` y los handlers reales (`src/lib/server/sync/sync.test.ts`); no simules el servidor con otra cosa.

## Tests de navegador

- La app se renderiza en el cliente: un id inexistente responde HTTP 200 con una página 404 del cliente. Comprueba el encabezado "404", no el estado.
- Sin service worker (fase 5), el flujo sin red es `context.setOffline(true)`, registrar y volver a `setOffline(false)` antes de `reload()`.
- Los campos del paso se localizan con `getByRole('spinbutton', { name })`: `getByLabel` también coincide con los botones "Menos/Más …".
- La página del ejercicio guarda las series de hoy en una hoja y los indicadores, récords y gráficos en otra sección: en los e2e usa `openTodaySets(page)` y `showTab(page, 'Indicadores')` de `e2e/fixtures.ts`, y cierra la hoja con Escape antes de seguir registrando.
- En el mapa corporal haz clic en el `path` hijo (`#triceps_f path`), no en el grupo: el centro del grupo puede caer sobre otro músculo.
- `datetime-local` acepta `fill('2026-10-30T18:05')`.
- Tras corregir una serie, el formulario de registro se rellena con la serie más reciente, que ya es la editada: no afirmes lo contrario.
- Tras pulsar un modo (acompañamiento o solo registrar), espera a que el texto de duración cambie antes de `goto`: el radio se marca de forma optimista y navegar antes pierde la escritura.
- Un texto de estado vacío nuevo no debe empezar por "Sin series de trabajo todavía": `e2e/indicators.e2e.ts` lo busca por ese comienzo.
- Un `getByRole('timer', { name: 'Descanso' })` funciona; una consulta viva de Dexie se propaga entre pestañas del mismo contexto de Playwright.
