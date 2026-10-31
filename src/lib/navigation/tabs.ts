/** Una pestaña de la barra inferior. `icon` es el id de un símbolo de `static/icons.svg`. */
export type Tab = {
	label: string;
	href: string;
	icon: string;
};

/** Historial no es pestaña: se llega desde Hoy. Ejercicios tampoco, se llega desde el registro. */
export const tabs: readonly Tab[] = [
	{ label: 'Hoy', href: '/', icon: 'dumbbell' },
	{ label: 'Rutinas', href: '/rutinas', icon: 'clipboard' },
	{ label: 'Progreso', href: '/progreso', icon: 'chart' },
	{ label: 'Perfil', href: '/perfil', icon: 'user' }
];

/** La pestaña raíz solo coincide con `/`; las demás también con las páginas anidadas bajo su ruta. */
export function isActiveTab(pathname: string, href: string): boolean {
	if (href === '/') return pathname === '/';
	return pathname === href || pathname.startsWith(`${href}/`);
}
