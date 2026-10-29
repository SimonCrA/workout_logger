---
status: accepted
date: 2026-10-28
---

# Cuenta con email y contraseña, sin proveedor de correo

La cuenta existe solo para respaldar y recuperar los datos locales (ADR-0001), y la app es personal. Decidimos usar Better Auth autoalojado con email y contraseña como único método, sin proveedor de envío de correo: no hay verificación de email ni flujo de recuperación de contraseña; si se olvida, el dueño la restablece a mano en la base. Un lector esperará un flujo de recuperación; su ausencia es deliberada, para no depender de un servicio de email por un caso que el dueño puede resolver solo.

## Consequences

- La tabla de usuarios lleva una columna `role` (`user` por defecto, `admin`) desde el inicio, para poder añadir más adelante un administrador que restablezca contraseñas sin migrar datos. No hay interfaz de administración hasta que haga falta.
- Hace falta un comando de consola para restablecer una contraseña.
- Si la app deja de ser personal, esta decisión debe revisarse: recuperación por email con un proveedor como Resend es el camino previsto.
