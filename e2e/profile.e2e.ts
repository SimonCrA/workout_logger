import { expect, openBodyWeights, signUp, test } from './fixtures';

/** Un día local como lo escribe un campo de fecha, `days` antes de hoy: "2026-11-01". */
function daysAgo(days: number): string {
	const date = new Date();
	date.setDate(date.getDate() - days);
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

test('without a session, Perfil shows only the login card (ADR-0007)', async ({ page }) => {
	await page.goto('/perfil');
	await expect(page.getByRole('heading', { name: 'Entra a tu cuenta' })).toBeVisible();
	await expect(page.getByRole('tab', { name: 'Iniciar sesión' })).toHaveAttribute(
		'aria-selected',
		'true'
	);
	await expect(page.getByRole('button', { name: /^Hoy/ })).toHaveCount(0);
	await expect(page.getByRole('button', { name: /^Estatura/ })).toHaveCount(0);
});

test('logs today’s body weight in its row, and the history sheet adds, corrects and deletes', async ({
	page
}) => {
	await signUp(page);
	const today = page.getByRole('button', { name: /^Hoy/ });
	await expect(today).toContainText('Sin registrar');

	// Tocar "Hoy" lo edita ahí mismo; guardar otra vez hoy actualiza el de hoy.
	await today.click();
	await page.getByLabel('Peso de hoy (kg)').fill('80');
	await page.getByRole('button', { name: 'Guardar' }).click();
	await expect(today).toContainText('80 kg');
	await today.click();
	await expect(page.getByLabel('Peso de hoy (kg)')).toHaveValue('80');
	await page.getByLabel('Peso de hoy (kg)').fill('500');
	await page.getByRole('button', { name: 'Guardar' }).click();
	await expect(page.getByRole('alert')).toContainText('de 20 a 400 kg');
	await page.getByLabel('Peso de hoy (kg)').fill('79.5');
	await page.getByRole('button', { name: 'Guardar' }).click();
	await expect(today).toContainText('79,5 kg');
	await expect(page.getByRole('button', { name: /^Historial/ })).toContainText('1 registro');

	// El historial, en una hoja: registrar ayer, corregirlo y borrar el de hoy.
	const section = await openBodyWeights(page);
	const history = section
		.getByRole('list', { name: 'Historial de peso corporal' })
		.getByRole('listitem');
	await expect(history).toHaveText([/79,5 kg/]);
	await section.getByLabel('Peso corporal (kg)').fill('81');
	await section.getByLabel('Fecha').fill(daysAgo(1));
	await section.getByRole('button', { name: 'Registrar peso' }).click();
	await expect(history).toHaveText([/79,5 kg/, /81 kg/]);

	await history
		.nth(1)
		.getByRole('button', { name: /^Editar/ })
		.click();
	const editor = page.getByRole('dialog', { name: 'Editar peso corporal' });
	await expect(editor.getByLabel('Fecha')).toHaveValue(daysAgo(1));
	await editor.getByLabel('Peso corporal (kg)').fill('80.8');
	await editor.getByRole('button', { name: 'Guardar' }).click();
	await expect(editor).toBeHidden();
	await expect(history).toHaveText([/79,5 kg/, /80,8 kg/]);

	await history
		.first()
		.getByRole('button', { name: /^Borrar/ })
		.click();
	const question = page.getByRole('alertdialog', { name: '¿Borrar el registro?' });
	await question.getByRole('button', { name: 'Borrar' }).click();
	await expect(question).toBeHidden();
	await expect(history).toHaveText([/80,8 kg/]);

	await page.reload();
	await expect(today).toContainText('Sin registrar');
	await expect(page.getByRole('button', { name: /^Historial/ })).toContainText('1 registro');
});

test('edits sex, birth date and height in their rows, and keeps them after reloading', async ({
	page
}) => {
	await signUp(page);
	const sex = page.getByRole('button', { name: /^Sexo/ });
	const birth = page.getByRole('button', { name: /^Fecha de nacimiento/ });
	const height = page.getByRole('button', { name: /^Estatura/ });
	await expect(sex).toContainText('Sin indicar');

	await sex.click();
	await page.getByRole('radio', { name: 'Mujer' }).click();
	await expect(sex).toContainText('Mujer');

	await birth.click();
	await page.getByLabel('Fecha de nacimiento').fill('1990-05-01');
	await page.getByRole('button', { name: 'Guardar' }).click();
	await expect(birth).toContainText('1990');

	// Una estatura imposible se avisa y no se guarda.
	await height.click();
	await page.getByLabel('Estatura (cm)').fill('20');
	await page.getByRole('button', { name: 'Guardar' }).click();
	await expect(page.getByRole('alert')).toContainText('de 50 a 250 cm');
	await page.getByLabel('Estatura (cm)').fill('168');
	await page.getByRole('button', { name: 'Guardar' }).click();
	await expect(height).toContainText('168 cm');

	await page.reload();
	await expect(sex).toContainText('Mujer');
	await expect(birth).toContainText('1990');
	await expect(height).toContainText('168 cm');
});
