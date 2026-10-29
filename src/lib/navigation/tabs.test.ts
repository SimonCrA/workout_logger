import { describe, expect, it } from 'vitest';
import { isActiveTab, tabs } from './tabs';

describe('tabs', () => {
	it('offers Hoy, Historial, Progreso and Perfil, in that order', () => {
		expect(tabs.map((tab) => tab.label)).toEqual(['Hoy', 'Historial', 'Progreso', 'Perfil']);
	});
});

describe('isActiveTab', () => {
	it('marks Hoy active only on the root path', () => {
		expect(isActiveTab('/', '/')).toBe(true);
		expect(isActiveTab('/historial', '/')).toBe(false);
	});

	it('marks a tab active on its own path and on pages nested under it', () => {
		expect(isActiveTab('/historial', '/historial')).toBe(true);
		expect(isActiveTab('/historial/2026-10-28', '/historial')).toBe(true);
	});

	it('does not match a path that merely starts with the same letters', () => {
		expect(isActiveTab('/perfilado', '/perfil')).toBe(false);
	});
});
