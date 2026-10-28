---
status: accepted
date: 2026-10-28
---

# Fuerza relativa sin niveles ni tablas por músculo

Investigamos estándares de fuerza por sexo y peso corporal y rangos de series semanales por músculo (ver `docs/research/metrics.md`). Las tablas de estándares disponibles son propiedad de terceros (Strength Level) o fórmulas de powerlifting (Wilks, DOTS, IPF GL) válidas solo para sentadilla, banca y peso muerto, y no encontramos una tabla de series por músculo publicada y verificable. Decidimos mostrar la fuerza relativa como el cociente 1RM estimado entre peso corporal, comparado con uno mismo en el tiempo y sin etiquetas de nivel, y una única banda objetivo de series por músculo (10 a 20, mantenimiento 6) editable por músculo, en lugar de una tabla por músculo.

## Consequences

- No hay "principiante / intermedio / avanzado" en la app. Si aparece una fuente con licencia libre y validez para máquinas y accesorios, se agrega como funcionalidad aparte.
- Las series por músculo cuentan 1 la serie directa y 0,5 la indirecta, sobre una ventana móvil de 7 días. El 1RM estimado usa Epley con reps más RIR y no se calcula por encima de 10 reps efectivas. Cambiar estas fórmulas cambia retroactivamente los indicadores mostrados, no los datos guardados.
