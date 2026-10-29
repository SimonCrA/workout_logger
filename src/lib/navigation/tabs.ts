/** Una pestaña de la barra inferior. `icon` es el id de un símbolo de `static/icons.svg`. */
export type Tab = {
	label: string;
	href: string;
	icon: string;
};

export const tabs: readonly Tab[] = [
	{ label: 'Hoy', href: '/', icon: 'dumbbell' },
	{ label: 'Historial', href: '/historial', icon: 'calendar' },
	{ label: 'Progreso', href: '/progreso', icon: 'chart' },
	{ label: 'Perfil', href: '/perfil', icon: 'user' }
];

/** La pestaña raíz solo coincide con `/`; las demás también con las páginas anidadas bajo su ruta. */
export function isActiveTab(pathname: string, href: string): boolean {
	if (href === '/') return pathname === '/';
	return pathname === href || pathname.startsWith(`${href}/`);
}
