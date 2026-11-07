import { expect, test as base, type Page } from '@playwright/test';

/**
 * El `test` de los e2e: al terminar cada uno, la página no se desborda a lo ancho en el teléfono
 * (spec #10 y #25: "no desborda en pantalla de teléfono"). Un test que deja la página en
 * `about:blank` o la cierra no comprueba nada.
 */
export const test = base.extend<{ fitsThePhone: void }>({
	fitsThePhone: [
		async ({ page }, use) => {
			await use();
			if (page.isClosed() || page.url() === 'about:blank') return;
			const overflow = await page.evaluate(
				() => document.documentElement.scrollWidth - document.documentElement.clientWidth
			);
			expect(
				overflow,
				`la página ${page.url()} se desborda ${overflow} px a lo ancho`
			).toBeLessThanOrEqual(0);
		},
		{ auto: true }
	]
});

export { expect };

/** La página del ejercicio guarda las series de hoy en una hoja: la abre y devuelve sus filas. */
export async function openTodaySets(page: Page) {
	await page.getByRole('button', { name: /^Hoy: \d+ series?$/ }).click();
	return page
		.getByRole('dialog')
		.getByRole('list', { name: 'Series de hoy' })
		.getByRole('listitem');
}

/** Cambia de pestaña en la página del ejercicio: Registrar, Indicadores o Info. */
export async function showTab(page: Page, tab: 'Registrar' | 'Indicadores' | 'Info') {
	await page.getByRole('radio', { name: tab, exact: true }).click();
}
