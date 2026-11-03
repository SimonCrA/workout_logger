import { expect, test } from '@playwright/test';

/** Un día local como lo escribe un campo de fecha, `days` antes de hoy: "2026-11-01". */
function daysAgo(days: number): string {
	const date = new Date();
	date.setDate(date.getDate() - days);
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

test('logs a body weight in Perfil, sees it after reloading, corrects it and deletes it', async ({
	page
}) => {
	await page.goto('/perfil');
	const section = page.getByRole('region', { name: 'Peso corporal' });
	await expect(section).toContainText('Aún no has registrado tu peso corporal.');
	await expect(section.getByLabel('Fecha')).toHaveValue(daysAgo(0));

	// Hoy y ayer; registrar otra vez hoy actualiza el de hoy en vez de añadir otro.
	await section.getByLabel('Peso corporal (kg)').fill('80');
	await section.getByRole('button', { name: 'Registrar peso' }).click();
	const history = section
		.getByRole('list', { name: 'Historial de peso corporal' })
		.getByRole('listitem');
	await expect(history).toHaveText([/80 kg/]);
	await section.getByLabel('Peso corporal (kg)').fill('79.5');
	await section.getByRole('button', { name: 'Registrar peso' }).click();
	await expect(history).toHaveText([/79,5 kg/]);
	await section.getByLabel('Peso corporal (kg)').fill('81');
	await section.getByLabel('Fecha').fill(daysAgo(1));
	await section.getByRole('button', { name: 'Registrar peso' }).click();
	await expect(history).toHaveText([/79,5 kg/, /81 kg/]);
	await expect(section.getByLabel('Último peso corporal')).toContainText('79,5 kg');

	// Fuera de rango no se guarda.
	await section.getByLabel('Peso corporal (kg)').fill('500');
	await section.getByRole('button', { name: 'Registrar peso' }).click();
	await expect(section.getByRole('alert')).toContainText('de 20 a 400 kg');

	await page.reload();
	await expect(history).toHaveText([/79,5 kg/, /81 kg/]);

	// Corregir el de ayer: otros kilos.
	await history
		.nth(1)
		.getByRole('button', { name: /^Editar/ })
		.click();
	const editor = page.getByRole('dialog', { name: 'Editar peso corporal' });
	await expect(editor.getByLabel('Peso corporal (kg)')).toHaveValue('81');
	await expect(editor.getByLabel('Fecha')).toHaveValue(daysAgo(1));
	await editor.getByLabel('Peso corporal (kg)').fill('80.8');
	await editor.getByRole('button', { name: 'Guardar' }).click();
	await expect(editor).toBeHidden();
	await expect(history).toHaveText([/79,5 kg/, /80,8 kg/]);

	// Borrar el de hoy: el último pasa a ser el de ayer.
	await history
		.first()
		.getByRole('button', { name: /^Borrar/ })
		.click();
	const question = page.getByRole('alertdialog', { name: '¿Borrar el registro?' });
	await question.getByRole('button', { name: 'Borrar' }).click();
	await expect(question).toBeHidden();
	await expect(history).toHaveText([/80,8 kg/]);
	await expect(section.getByLabel('Último peso corporal')).toContainText('80,8 kg');

	await page.reload();
	await expect(history).toHaveText([/80,8 kg/]);
});

test('saves sex, birth date and height on change, and keeps them after reloading', async ({
	page
}) => {
	await page.goto('/perfil');
	const data = page.getByRole('region', { name: 'Datos' });
	await expect(data.getByRole('radio', { name: 'Sin indicar' })).toBeChecked();

	await data.getByRole('radio', { name: 'Mujer' }).click();
	await data.getByLabel('Fecha de nacimiento').fill('1990-05-01');
	await data.getByLabel('Estatura (cm)').fill('168');
	await data.getByLabel('Estatura (cm)').blur();
	await expect(data.getByRole('radio', { name: 'Mujer' })).toBeChecked();
	await expect(data.getByRole('status')).toHaveText('Guardado');

	// Una estatura imposible se avisa y no se guarda.
	await data.getByLabel('Estatura (cm)').fill('20');
	await data.getByLabel('Estatura (cm)').blur();
	await expect(data.getByRole('alert')).toContainText('de 50 a 250 cm');

	await page.reload();
	await expect(data.getByRole('radio', { name: 'Mujer' })).toBeChecked();
	await expect(data.getByLabel('Fecha de nacimiento')).toHaveValue('1990-05-01');
	await expect(data.getByLabel('Estatura (cm)')).toHaveValue('168');
});
