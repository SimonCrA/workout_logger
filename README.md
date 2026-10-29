# Workout Logger

Registro personal de entrenamientos de fuerza, pensado para usarse desde el teléfono entre series. Es una app local-first: los datos viven en el dispositivo y, con cuenta, se respaldan en el servidor.

Vocabulario del dominio en `GLOSSARY.md`; decisiones de fondo en `docs/adr/`. La reescritura sobre SvelteKit vive en la rama `reescritura-sveltekit` y reemplazará a `main` (hoy, la app Astro anterior) cuando alcance paridad; el código Astro queda en el historial de `main`.

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

Los tests unitarios van junto al código como `*.test.ts`; los de navegador, en `e2e/*.e2e.ts` y se ejecutan a tamaño de teléfono. GitHub Actions (`.github/workflows/ci.yml`) corre typecheck, Vitest y Playwright en cada push.

## Íconos

Los SVG fuente están en `src/lib/assets/icons/` (estilo Hugeicons, trazo de 1,5). Tras añadir o cambiar uno, regenera el sprite y súbelo al repo:

```sh
pnpm build:icons  # escribe static/icons.svg
```

Se usan con el componente `Icon` (`<Icon name="dumbbell" class="size-6" />`).

## Catálogo base y mapa corporal

El catálogo (músculos con sus regiones del SVG y ejercicios) son datos estáticos en `src/lib/catalog/`, versionados con la app; no se sincronizan ni se editan desde la interfaz (ADR-0001, ADR-0004). `catalog.test.ts` valida su integridad y comprueba que no falte ningún ejercicio de la app Astro. Equipo, modo de carga y músculos secundarios se revisaron en el ticket #4 siguiendo ExRx.net, citado en el propio archivo de ejercicios.

El mapa corporal es `src/lib/assets/muscle-map.svg` (trazado a mano; los ids de las regiones son los que usa el catálogo) y se dibuja con el componente `BodyMap`. La búsqueda y el detalle de ejercicios viven en `/ejercicios` y `/ejercicios/<id>`.

## Datos locales

Las series y los entrenamientos viven en IndexedDB del dispositivo, con Dexie (`src/lib/log/db.ts`, base `workout_logger`); es la fuente de verdad (ADR-0001). Toda fila lleva `id` (UUID v7 generado en el cliente), `userId`, `createdAt`, `updatedAt`, `deletedAt` (borrado lógico) y `pending` (cambios sin subir). Las reglas puras (entrenamiento libre por día abierto hasta 3 horas sin series, prellenado, última vez, historial) están en `src/lib/log/rules.ts`; el acceso a la base en `src/lib/log/sets.ts`, probado con `fake-indexeddb`.

Para empezar de cero en el navegador: herramientas de desarrollo → Application → IndexedDB → borrar `workout_logger`.

## Componentes de shadcn-svelte

```sh
pnpm dlx shadcn-svelte@latest add <componente>
```

La configuración está en `components.json`; los componentes se instalan en `src/lib/components/ui/`.

## Cuenta y base del servidor

La cuenta es opcional (ADR-0003): email y contraseña con Better Auth sobre Drizzle y libSQL, sin verificación ni recuperación por correo. El servidor solo atiende `/api/auth/*` (`src/hooks.server.ts`); las tablas están en `src/lib/server/db/schema.ts` y las migraciones en `drizzle/`.

```sh
pnpm db:generate                       # nueva migración a partir del esquema
pnpm db:migrate                        # aplica las migraciones a TURSO_DATABASE_URL
pnpm db:reset-password <email>         # pide la contraseña nueva, la guarda y cierra sus sesiones
```

Para una base local basta `TURSO_DATABASE_URL=file:local.db` y `pnpm db:migrate`. En Turso, crea la base, ejecuta `pnpm db:migrate` con sus credenciales en `.env` y configura las mismas variables en Vercel.

## Variables de entorno

Se declaran en `src/env.ts` y se leen al arrancar el servidor; copia `.env.example` a `.env`.

| Variable             | Uso                                                                     |
| -------------------- | ----------------------------------------------------------------------- |
| `TURSO_DATABASE_URL` | `libsql://…` en Turso o `file:…` en local (por defecto `file:local.db`) |
| `TURSO_AUTH_TOKEN`   | Token de Turso; vacío con un archivo local                              |
| `BETTER_AUTH_SECRET` | Firma las sesiones (`openssl rand -base64 32`); obligatorio en Vercel   |

Sin `BETTER_AUTH_SECRET` fuera de desarrollo la app funciona, pero la cuenta responde 503.

## Despliegue

Vercel despliega cada push: `main` como producción y las demás ramas como preview. El build genera `.vercel/output` (Build Output API), así que no depende del preset de framework del proyecto.
