# workout_logger

## Agent skills

### Issue tracker

Issues are tracked as GitHub Issues on `SimonCrA/workout_logger`, via the `gh` CLI. Personal project: every `gh` call and commit uses the personal account `SimonCrA`, never the work account. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Stack

SvelteKit 3 sobre Vercel, local-first (ADR-0001): Dexie en el dispositivo; Drizzle sobre libSQL (Turso) y Better Auth solo para la cuenta y la sincronización. Comandos, variables de entorno y dónde vive cada cosa: `README.md`.

Lo que la configuración no dice:

- No hay `svelte.config.js`: adapter y opciones del compilador van en `vite.config.ts`. El alias es `#lib/...` (no `$lib`) y los módulos `.ts` se importan con extensión `.js`.
- Módulos de servidor de SvelteKit 3: `$app/env` (no `$app/environment`) y `$app/env/private`, cuyas variables se declaran en `src/env.ts`.
- Antes de dar algo por terminado: `pnpm check`, `pnpm lint` y `pnpm test` (unitarios y de navegador; los segundos construyen la app).
- Mensajes de commit en español y minúsculas, sin prefijos, con el ticket al final: `indicadores por ejercicio (#8)`.
