# workout_logger

## Agent skills

### Issue tracker

Issues are tracked as GitHub Issues on `SimonCrA/workout_logger`, via the `gh` CLI. Personal project on a work laptop, where `gh` has the work account active: run every `gh` call as `GH_TOKEN="$(gh auth token --user SimonCrA)" gh … -R SimonCrA/workout_logger`. `git push` already goes out as `SimonCrA` over SSH. Read a ticket with `gh issue view <n> --json title,body,comments` (the `--comments` form prints only the comments). See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Stack

SvelteKit 3 sobre Vercel, local-first (ADR-0001): Dexie en el dispositivo; Drizzle sobre libSQL (Turso) y Better Auth solo para la cuenta y la sincronización. Comandos, variables de entorno y cada área explicada: `README.md`. Qué archivo abrir para un ticket: `docs/agents/code-map.md`. Lo que exige la revisión: `CODING_STANDARDS.md`.

Lo que la configuración no dice:

- No hay `svelte.config.js`: adapter y opciones del compilador van en `vite.config.ts`. El alias es `#lib/...` (no `$lib`) y los módulos `.ts` se importan con extensión `.js`.
- Módulos de servidor de SvelteKit 3: `$app/env` (no `$app/environment`) y `$app/env/private`, cuyas variables se declaran en `src/env.ts`.
- Antes de dar algo por terminado: `pnpm check`, `pnpm lint` y `pnpm test` (unitarios y de navegador; los segundos construyen la app).
- Cada push a `main` despliega a producción. Si trae migraciones en `drizzle/`, el dueño corre `pnpm db:migrate` contra producción antes de la fusión (`pnpm db:status` lo comprueba, solo leyendo); no se fusiona sin su confirmación.
- Reparto: el agente hace commit y push de su rama y abre los PR; el dueño aplica las migraciones y cierra issues y PR. Un ticket que genera una migración lo avisa al terminar.
- Mensajes de commit en español y minúsculas, sin prefijos, con el ticket al final: `indicadores por ejercicio (#8)`. Sin línea `Co-Authored-By`, ni en commits ni en PR.
