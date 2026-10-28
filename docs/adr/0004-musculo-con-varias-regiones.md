---
status: accepted
date: 2026-10-28
---

# Un músculo puede tener varias regiones en el mapa corporal

El seed original modelaba aductores, antebrazos, tríceps, hombros, trapecios, gemelos, oblicuos y cuello como dos músculos distintos cada uno, uno por vista del dibujo (`_f` y `_b`), porque el mapa SVG tiene una forma por vista. Decidimos que el músculo es un concepto único y que las formas del dibujo son regiones que le pertenecen, de modo que un ejercicio apunta a "Aductores" y no a "Aductores (frente)", y las series por músculo no se parten entre dos filas.

## Consequences

- Los ids de las regiones del SVG (`adductors_f`, `adductors_b`) se mantienen como ids de región; el músculo tiene su propio código.
- Cualquier SVG alternativo, como la versión femenina, debe usar exactamente los mismos ids de región.
- El mapa de calor y la búsqueda por músculo resaltan todas las regiones de un músculo a la vez.
