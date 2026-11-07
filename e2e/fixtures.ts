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

/** Las series de hoy en la página del ejercicio: la lista "Hecho hoy" bajo el registro. */
export function todaySets(page: Page) {
	return page.getByRole('list', { name: 'Series de hoy' }).getByRole('listitem');
}

/** Cambia de pestaña en la página del ejercicio: Registrar, Indicadores o Info. */
export async function showTab(page: Page, tab: 'Registrar' | 'Indicadores' | 'Info') {
	await page.getByRole('radio', { name: tab, exact: true }).click();
}

/** Dentro de Indicadores, cambia de parte: Resumen, Récords, Historial o Totales. */
export async function showPart(page: Page, part: 'Resumen' | 'Récords' | 'Historial' | 'Totales') {
	await page.getByRole('tab', { name: part, exact: true }).click();
}
