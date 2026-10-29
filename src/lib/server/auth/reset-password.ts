import type { Auth } from './create';

/**
 * Restablece la contraseña de un email y cierra sus sesiones. No hay recuperación por correo:
 * lo ejecuta el dueño desde la consola (ADR-0003, `pnpm db:reset-password`).
 */
export async function resetPassword(auth: Auth, email: string, newPassword: string): Promise<void> {
	if (newPassword.length < 8) throw new Error('La contraseña necesita al menos 8 caracteres');
	const ctx = await auth.$context;
	const found = await ctx.internalAdapter.findUserByEmail(email);
	if (!found) throw new Error(`No hay cuenta con el email ${email}`);
	await ctx.internalAdapter.updatePassword(found.user.id, await ctx.password.hash(newPassword));
	const sessions = await ctx.internalAdapter.listSessions(found.user.id);
	await ctx.internalAdapter.deleteSessions(sessions.map((session) => session.token));
}
