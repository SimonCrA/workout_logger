---
status: accepted
date: 2026-11-07
---

# El perfil se edita solo con cuenta

ADR-0001 hizo la app local primero: todo funciona sin cuenta y la cuenta solo respalda. Con el rediseño de Perfil, el dueño decidió que la pestaña muestre solo el acceso sin sesión, y que el peso corporal y los datos (sexo, fecha de nacimiento, estatura) se registren y corrijan solo con la sesión iniciada. Los entrenamientos, las rutinas y las series siguen siendo locales primero y funcionan sin cuenta, como dice ADR-0001.

## Consequences

- Sin cuenta no se puede registrar el peso corporal, y sin él no se calculan el peso efectivo de dominadas y fondos ni la fuerza relativa. Las notas que mandan a Perfil llevan al acceso.
- Lo que ya estaba en el dispositivo no se borra: el perfil y el peso corporal registrados antes, o los de una sesión cerrada, siguen guardados y usándose en los cálculos; solo no se ven ni se editan hasta entrar.
- Las tablas `profiles` y `bodyWeights` no cambian ni se sincronizan distinto: es una decisión de interfaz, reversible sin migrar datos.
