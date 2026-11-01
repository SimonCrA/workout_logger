import { describe, expect, it } from 'vitest';
import { isActiveTab, tabs } from './tabs';

describe('tabs', () => {
	it('offers Hoy, Rutinas, Progreso and Perfil, in that order', () => {
		expect(tabs.map((tab) => tab.label)).toEqual(['Hoy', 'Rutinas', 'Progreso', 'Perfil']);
	});
});

describe('isActiveTab', () => {
	it('marks Hoy active only on the root path', () => {
		expect(isActiveTab('/', '/')).toBe(true);
		expect(isActiveTab('/rutinas', '/')).toBe(false);
	});

	it('marks a tab active on its own path and on pages nested under it', () => {
		expect(isActiveTab('/rutinas', '/rutinas')).toBe(true);
		expect(isActiveTab('/rutinas/base/empuje', '/rutinas')).toBe(true);
	});

	it('does not match a path that merely starts with the same letters', () => {
		expect(isActiveTab('/perfilado', '/perfil')).toBe(false);
	});
});
