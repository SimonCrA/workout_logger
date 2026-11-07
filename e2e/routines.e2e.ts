import { expect, test } from './fixtures';

const tabBar = (page: import('@playwright/test').Page) =>
	page.getByRole('navigation', { name: 'Pestañas' });

test('offers the base routines by group under "Desde una rutina base" and previews one with its objectives', async ({
	page
}) => {
	await page.goto('/rutinas');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Rutinas');

	await page.getByRole('link', { name: 'Desde una rutina base' }).click();

	await expect(page).toHaveURL(/\/rutinas\/base$/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Desde una rutina base');
	await expect(page.getByRole('heading', { name: 'Empuje, Tirón y Pierna (PPL)' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Hombro y brazo' })).toBeVisible();
	// Cada rutina enseña sus ejercicios antes de abrirla.
	await expect(page.getByRole('link', { name: /^Empuje/ })).toContainText('Press de banca plano');

	await page.getByRole('link', { name: /^Empuje/ }).click();

	await expect(page).toHaveURL(/\/rutinas\/base\/empuje$/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Empuje');
	await expect(tabBar(page).getByRole('link', { name: 'Rutinas' })).toHaveAttribute(
		'aria-current',
		'page'
	);
	const rows = page.getByRole('list', { name: 'Ejercicios de la rutina' }).getByRole('listitem');
	await expect(rows).toHaveCount(6);
	await expect(rows.first()).toContainText('Press de banca plano');
	await expect(rows.first()).toContainText('3 × 5–8 · 150 s');
	await expect(rows.last()).toContainText('Extensión de tríceps en polea');
	await expect(rows.last()).toContainText('3 × 8–12 · RIR 2 · 90 s');
	await expect(page.getByRole('link', { name: 'Crear desde esta rutina' })).toBeVisible();
});

test('without routines of its own, shows the empty state with both ways to create and the base groups', async ({
	page
}) => {
	await page.goto('/rutinas');
	await expect(page.getByText('Ninguna todavía')).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Arma tu primera rutina' })).toBeVisible();
	// El estado vacío ya ofrece las dos maneras de crear: la cabecera no repite el botón.
	await expect(page.getByRole('button', { name: 'Crear rutina personalizada' })).toHaveCount(0);
	await expect(page.getByRole('link', { name: 'Desde cero' })).toHaveAttribute(
		'href',
		'/rutinas/nueva'
	);
	const groups = page.getByRole('list', { name: 'Grupos de rutinas base' }).getByRole('link');
	await expect(groups.first()).toContainText('Empuje, Tirón y Pierna (PPL)');
	await expect(groups.first()).toContainText('3 rutinas');
	await groups.first().click();
	await expect(page).toHaveURL(/\/rutinas\/base#grupo-ppl$/);
});

test('shows a 404 page for a base routine that does not exist', async ({ page }) => {
	// La app se renderiza en el navegador: el servidor responde 200 y la página de error la pinta el cliente.
	await page.goto('/rutinas/base/no-existe');

	await expect(page.getByRole('heading', { level: 1 })).toHaveText('404');
	await expect(page.getByText('No existe esa rutina')).toBeVisible();
});

test('creates a routine from a base routine, renames it, saves it, finds it in Mis rutinas after a reload and deletes it', async ({
	page
}) => {
	await page.goto('/rutinas/base/empuje');
	await page.getByRole('link', { name: 'Crear desde esta rutina' }).click();

	await expect(page).toHaveURL(/\/rutinas\/nueva\?base=empuje$/);
	const name = page.getByRole('textbox', { name: 'Nombre' });
	await expect(name).toHaveValue('Empuje');
	const rows = page.getByRole('list', { name: 'Ejercicios de la rutina' }).getByRole('listitem');
	await expect(rows).toHaveCount(6);
	await expect(rows.first()).toContainText('Press de banca plano');
	await expect(
		page.getByRole('spinbutton', { name: 'Series de Press de banca plano' })
	).toHaveValue('3');
	await expect(
		page.getByRole('spinbutton', { name: 'Descanso de Press de banca plano (s)' })
	).toHaveValue('150');
	await expect(rows.last().getByRole('radio', { name: 'RIR 2' })).toBeChecked();

	await name.fill('Empuje A');
	await page.getByRole('button', { name: 'Guardar' }).click();

	await expect(page).toHaveURL(/\/rutinas$/);
	const mine = page.getByRole('list', { name: 'Mis rutinas' }).getByRole('listitem');
	await expect(mine).toHaveText([/Empuje A/]);
	await expect(mine.first()).toContainText('6 ejercicios · 18 series');
	await expect(mine.first()).toContainText('Pecho');
	await expect(mine.first()).toContainText('Hombros');
	await expect(mine.first()).toContainText('Tríceps');
	await expect(page.getByText('1 rutina', { exact: true })).toBeVisible();

	// Con rutinas propias, crear otra está en el menú de la cabecera.
	await page.getByRole('button', { name: 'Crear rutina personalizada' }).click();
	await expect(page.getByRole('menuitem', { name: /^Desde una rutina base/ })).toHaveAttribute(
		'href',
		'/rutinas/base'
	);
	await expect(page.getByRole('menuitem', { name: /^Desde cero/ })).toHaveAttribute(
		'href',
		'/rutinas/nueva'
	);
	await page.keyboard.press('Escape');

	await page.reload();

	await expect(mine).toHaveText([/Empuje A/]);
	await mine.first().getByRole('link').click();
	await expect(page).toHaveURL(/\/rutinas\/[0-9a-f-]{36}$/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Empuje A');
	await expect(page.getByRole('textbox', { name: 'Nombre' })).toHaveValue('Empuje A');
	// Sin cambios no hay nada que guardar: una copia vieja nunca pisa lo guardado después.
	await expect(page.getByRole('button', { name: 'Guardar' })).toBeDisabled();
	await page.getByRole('button', { name: 'Quitar Press de banca plano' }).click();
	await expect(page.getByRole('button', { name: 'Guardar' })).toBeEnabled();

	await page.getByRole('button', { name: 'Borrar rutina' }).click();
	const dialog = page.getByRole('alertdialog');
	await expect(dialog).toContainText('¿Borrar la rutina?');
	await dialog.getByRole('button', { name: 'Borrar', exact: true }).click();

	await expect(page).toHaveURL(/\/rutinas$/);
	await expect(page.getByRole('heading', { name: 'Arma tu primera rutina' })).toBeVisible();
});

test('builds a routine from scratch with the search, reorders and removes exercises, and asks before discarding', async ({
	page
}) => {
	await page.goto('/rutinas');
	await page.getByRole('link', { name: 'Desde cero' }).click();
	await expect(page).toHaveURL(/\/rutinas\/nueva$/);
	const save = page.getByRole('button', { name: 'Guardar' });
	await expect(save).toBeDisabled();

	await page.getByRole('textbox', { name: 'Nombre' }).fill('Pierna B');
	await page.getByRole('button', { name: 'Añadir ejercicio' }).click();
	const picker = page.getByRole('dialog');
	await picker
		.getByRole('searchbox', { name: 'Buscar músculo o ejercicio' })
		.fill('sentadilla con barra');
	await picker.getByRole('button', { name: /Sentadilla con barra/ }).click();

	await expect(picker).toBeHidden();
	const rows = page.getByRole('list', { name: 'Ejercicios de la rutina' }).getByRole('listitem');
	await expect(rows).toHaveText([/Sentadilla con barra/]);
	await expect(
		page.getByRole('spinbutton', { name: 'Series de Sentadilla con barra' })
	).toHaveValue('3');
	await expect(
		page.getByRole('spinbutton', { name: 'Reps mínimas de Sentadilla con barra' })
	).toHaveValue('8');
	await expect(
		page.getByRole('spinbutton', { name: 'Reps máximas de Sentadilla con barra' })
	).toHaveValue('12');

	// El mismo ejercicio no se añade dos veces: en el buscador queda marcado y no se puede elegir.
	await page.getByRole('button', { name: 'Añadir ejercicio' }).click();
	await picker
		.getByRole('searchbox', { name: 'Buscar músculo o ejercicio' })
		.fill('sentadilla con barra');
	await expect(picker.getByRole('button', { name: /Sentadilla con barra/ })).toBeDisabled();
	await picker
		.getByRole('searchbox', { name: 'Buscar músculo o ejercicio' })
		.fill('prensa de piernas');
	await picker.getByRole('button', { name: /Prensa de piernas/ }).click();
	await expect(rows).toHaveText([/Sentadilla con barra/, /Prensa de piernas/]);

	await page.getByRole('button', { name: 'Subir Prensa de piernas' }).click();
	await expect(rows).toHaveText([/Prensa de piernas/, /Sentadilla con barra/]);
	await page.getByRole('button', { name: 'Quitar Sentadilla con barra' }).click();
	await expect(rows).toHaveText([/Prensa de piernas/]);

	await page.getByRole('spinbutton', { name: 'Reps mínimas de Prensa de piernas' }).fill('15');
	await expect(page.getByText('El mínimo de reps no puede superar el máximo')).toBeVisible();
	await expect(save).toBeDisabled();
	await page.getByRole('spinbutton', { name: 'Reps mínimas de Prensa de piernas' }).fill('10');
	await expect(save).toBeEnabled();

	await page.getByRole('link', { name: '← Rutinas' }).click();
	const dialog = page.getByRole('alertdialog');
	await expect(dialog).toContainText('¿Descartar los cambios?');
	await dialog.getByRole('button', { name: 'Seguir editando' }).click();
	await expect(dialog).toBeHidden();
	await expect(page).toHaveURL(/\/rutinas\/nueva$/);

	await page.getByRole('link', { name: '← Rutinas' }).click();
	await dialog.getByRole('button', { name: 'Descartar' }).click();

	await expect(page).toHaveURL(/\/rutinas$/);
	await expect(page.getByRole('heading', { name: 'Arma tu primera rutina' })).toBeVisible();
});
