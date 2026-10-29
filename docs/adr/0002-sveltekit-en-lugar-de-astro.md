---
status: accepted
date: 2026-10-28
---

# SvelteKit en lugar de Astro y Astro DB

La app original está en Astro 5 con islas de Svelte 5 y Astro DB; con la decisión local-first (ADR-0001) casi todo el estado vive en el cliente y el servidor se reduce a autenticación y dos endpoints de sincronización, que es terreno de un framework de aplicación y no de uno de contenido. Decidimos reescribir sobre SvelteKit en Vercel, con las páginas de la app renderizadas en cliente y `+server.ts` para auth y sync; Drizzle sobre Turso, la misma base libSQL que Astro DB usaba por debajo; Tailwind 4; y shadcn-svelte en lugar de daisyUI, porque daisyUI es solo CSS y una app móvil necesita componentes con comportamiento (hojas, cajones, diálogos) accesibles.

## Considered Options

- **Seguir en Astro y cambiar solo Astro DB por Drizzle**: evita la reescritura, pero el estado seguiría compartiéndose entre islas con nanostores y `localStorage` a mano, y Astro DB quedó en mantenimiento mínimo desde el cierre de Astro Studio.
- **Supabase (Postgres + Auth)**: conocido por el autor, pero su plan gratuito pausa el proyecto tras una semana sin uso, incompatible con una app personal que puede quedar un mes sin abrirse.

## Consequences

- La reescritura se hace en este mismo repo, en una rama que reemplaza `main` cuando alcanza paridad con la app Astro. La versión Astro queda en el historial.
- Los componentes Svelte 5 existentes (mapa corporal, stepper, tabla) se portan casi sin cambios.
