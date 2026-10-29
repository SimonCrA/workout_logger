---
status: accepted
date: 2026-10-28
---

# Local-first con sincronización propia

La versión anterior (Astro) guardaba las series solo en `localStorage` y nunca llegó a escribir en la base de datos, así que el historial se perdía al cambiar de teléfono; además la app se usa en gimnasios con mala señal y no debe exigir cuenta para funcionar. Decidimos que la base de datos de verdad vive en el dispositivo (IndexedDB) y que el servidor es una réplica que solo existe si hay cuenta, con una sincronización escrita por nosotros: ids generados en el cliente, `updatedAt`, borrado lógico, subida de filas pendientes y bajada de cambios desde la última sincronización, y "gana la escritura más reciente" si una fila cambió en dos dispositivos.

## Considered Options

- **Servidor como fuente de verdad con caché optimista**: lo obvio, pero sin red no se puede registrar, que es el caso principal.
- **Servicio de sync (PowerSync, ElectricSQL, InstantDB, Dexie Cloud)**: resuelven colaboración en tiempo real y conflictos complejos que este dominio no tiene (un usuario por cuenta, datos casi solo de inserción), a cambio de dependencia de proveedor y costo.
- **Sync propia**: elegida. Son unos cientos de líneas porque el dominio lo permite.

## Consequences

- Toda tabla sincronizada lleva `id` (UUID de cliente), `userId`, `createdAt`, `updatedAt`, `deletedAt` y una marca local de pendiente.
- El catálogo base de ejercicios se empaqueta con la app como datos estáticos versionados; no se sincroniza. Por eso los ejercicios base se pueden ocultar pero no editar: una edición local chocaría con la siguiente versión del catálogo.
- Al iniciar sesión por primera vez, las filas locales sin `userId` se asocian a la cuenta y se suben; no se pregunta.
- Las reglas de fusión son funciones puras con tests unitarios: un error ahí es silencioso y destruye datos.
