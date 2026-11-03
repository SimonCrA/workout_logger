# Estándares de código

Lo que la revisión exige y ningún chequeo automático puede comprobar. Lo mecánico va en un test o en un hook, no aquí: el vocabulario de la interfaz lo comprueba `src/lib/glossary.test.ts` y el formato, el pre-commit.

**Mantenimiento**: cuando una revisión corrige algo por una regla que no está escrita, el mismo commit la añade aquí; si es mecánica, añade el chequeo. Una regla que el código ya no puede romper se borra.

## Capas

- Las reglas son funciones puras sin Dexie ni Svelte (`src/lib/log/rules.ts`, `routine-rules.ts`, `companion.ts`, `today.ts`, `history.ts`, `dashboard.ts`, `charts.ts`, `indicators.ts`, `records.ts`, `profile-rules.ts`; `src/lib/sync/rules.ts`), con su test unitario. Las operaciones sobre Dexie (`sets.ts`, `workouts.ts`, `routines.ts`, `profile.ts`) las aplican y escriben.
- Las páginas escriben; los componentes reciben datos y callbacks y no importan operaciones de escritura.
- Una regla vive en un solo sitio. Si una página o un componente calcula algo que otro también necesita (lo prescrito, la duración, agrupar por ejercicio), va a un módulo de reglas y ambos lo usan.

## Interfaz

- Una escritura desde un manejador de eventos atrapa el rechazo y lo muestra, y se bloquea mientras está en curso (`busy`) para que un doble toque no la repita. Un campo que guarda al cambiar no se bloquea: encola su escritura detrás de la anterior, para que cambiar dos campos seguidos no pierda ninguno, y muestra cuándo terminó ("Guardado").
- Un diálogo que se guarda sin tocar nada no cambia datos: se compara con el valor original antes de escribir (un `datetime-local` pierde los segundos).
- Los nombres en el código siguen al glosario: el término inglés entre paréntesis de GLOSSARY.md, no un sinónimo.
- Nada en la app enlaza al repositorio ni expone datos del dueño: el repo es privado.

## Tests de navegador

- Cada flujo que la spec pide probar tiene un e2e que lo recorre tal como la spec lo describe (modo, pasos, lo que se comprueba al final).
- Tras una acción que escribe en Dexie, el test espera su efecto visible antes de navegar o recargar (`goto`, `reload`, cambiar de pestaña); si no, la escritura puede no haber terminado.
- Un locator por nombre accesible usa una expresión regular cuando la fila lleva más texto que el nombre ("Empuje 6 ejercicios").

## Datos y sincronización

- Un cambio de esquema es una versión nueva de Dexie con su `upgrade` probado en `db.test.ts` y, si sincroniza, una migración de `drizzle/`.
- Las migraciones solo añaden: columnas con valor por defecto o tablas nuevas.
- Mientras la app tenga un solo usuario, la compatibilidad con la versión anterior de la app no bloquea un cambio. Cuando haya otros usuarios, un teléfono con la versión anterior sigue sincronizando: los campos nuevos del protocolo son opcionales y una fila que llega sin ellos conserva lo guardado, no lo pisa con valores por defecto.

## Documentación

- Un ticket que cambia lo que la app hace o cómo se trabaja en ella actualiza README.md, y `docs/agents/code-map.md` si añade, mueve o borra un módulo, en el mismo commit.
