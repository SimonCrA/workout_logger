import { expect, openTodaySets, test } from './fixtures';

const press = '/ejercicios/press-de-banca-plano';

/** El mismo momento un día antes, tal como lo escribe un campo `datetime-local`: "2026-10-30T18:05". */
function dayBefore(value: string): string {
	const [date, time] = value.split('T');
	const [year, month, day] = date.split('-').map(Number);
	const moved = new Date(year, month - 1, day - 1);
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${moved.getFullYear()}-${pad(moved.getMonth() + 1)}-${pad(moved.getDate())}T${time}`;
}

test('edits a set from its row, sees the new value in the detail and the exercise page, moves the workout to yesterday and deletes it', async ({
	page
}) => {
	// Flujo 4: dos series de press de hoy, en un libre.
	await page.goto(press);
	await page.getByRole('spinbutton', { name: 'Peso (kg)' }).fill('60');
	await page.getByRole('button', { name: 'Registrar serie' }).click();
	await page.getByRole('button', { name: 'Registrar serie' }).click();
	let today = await openTodaySets(page);
	await expect(today).toHaveText([/60 kg × 10/, /60 kg × 10/]);

	// La segunda se corrige desde su fila con los mismos controles que al registrar.
	await today.nth(1).getByRole('button').click();
	const editor = page.getByRole('dialog', { name: 'Editar serie' });
	await expect(editor).toContainText('Press de banca plano');
	await expect(editor.getByRole('spinbutton', { name: 'Reps' })).toHaveValue('10');
	await expect(editor.getByRole('spinbutton', { name: 'Peso (kg)' })).toHaveValue('60');
	await editor.getByRole('button', { name: 'Menos Reps' }).click();
	await editor.getByRole('button', { name: 'Menos Reps' }).click();
	await editor.getByRole('spinbutton', { name: 'Peso (kg)' }).fill('-5');
	await expect(editor.getByRole('spinbutton', { name: 'Peso (kg)' })).toHaveValue('0');
	await editor.getByRole('spinbutton', { name: 'Peso (kg)' }).fill('65');
	await editor.getByRole('radio', { name: 'Fallo' }).click();
	await editor.getByRole('radio', { name: 'RIR 0' }).click();
	await editor.getByLabel('Nota (opcional)').fill('última al fallo');
	await editor.getByRole('button', { name: 'Guardar' }).click();
	await expect(editor).toBeHidden();
	today = await openTodaySets(page);
	await expect(today).toHaveText([/60 kg × 10/, /65 kg × 8/]);
	await expect(today.nth(1)).toContainText('Fallo');
	await expect(today.nth(1)).toContainText('RIR 0');
	await expect(today.nth(1)).toContainText('última al fallo');

	// El detalle del entrenamiento muestra el valor nuevo, y desde ahí se borra la primera serie.
	await page.goto('/historial');
	const workouts = page.getByRole('list', { name: /de \d{4}$/ }).getByRole('listitem');
	await expect(workouts).toHaveText([/Hoy · Libre/]);
	await workouts.first().getByRole('link').click();
	const pressSets = page
		.getByRole('list', { name: 'Series de Press de banca plano' })
		.getByRole('listitem');
	await expect(pressSets).toHaveText([/60 kg × 10/, /65 kg × 8/]);
	await pressSets.first().getByRole('button').click();
	await editor.getByRole('button', { name: 'Borrar serie' }).click();
	await expect(editor).toBeHidden();
	await expect(pressSets).toHaveText([/65 kg × 8/]);

	// Cambiar la fecha a ayer: el futuro no vale, y las series se mueven con el entrenamiento.
	await page.getByRole('button', { name: 'Cambiar fecha' }).click();
	const question = page.getByRole('alertdialog');
	await expect(question).toContainText('¿Cuándo empezó?');
	const start = question.getByLabel('Inicio');
	const current = await start.inputValue();
	expect(current).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
	await start.fill('2099-01-01T10:00');
	await question.getByRole('button', { name: 'Guardar' }).click();
	await expect(question.getByRole('alert')).toContainText('futuro');
	const yesterday = dayBefore(current);
	await start.fill(yesterday);
	await question.getByRole('button', { name: 'Guardar' }).click();
	await expect(question).toBeHidden();
	await expect(page.getByText(`· ${yesterday.slice(11)}`)).toBeVisible();
	await page.getByRole('link', { name: '← Historial' }).click();
	await expect(workouts).toHaveText([/Ayer · Libre/]);

	// La página del ejercicio: ya no es de hoy, y la última vez lleva el valor corregido.
	await page.goto(press);
	await expect(page.getByLabel('Última vez')).toContainText('65 kg × 8');
	// Sin series hoy, la página no ofrece la hoja de las de hoy.
	await expect(page.getByRole('button', { name: 'Registrar serie' })).toBeVisible();
	await expect(page.getByRole('button', { name: /^Hoy: / })).toHaveCount(0);

	// Borrar el entrenamiento entero desde el detalle, con confirmación.
	await page.goto('/historial');
	await workouts.first().getByRole('link').click();
	await page.getByRole('button', { name: 'Borrar entrenamiento' }).click();
	await expect(question).toContainText('¿Borrar el entrenamiento?');
	await question.getByRole('button', { name: 'Conservar' }).click();
	await expect(question).toBeHidden();
	await page.getByRole('button', { name: 'Borrar entrenamiento' }).click();
	await question.getByRole('button', { name: 'Borrar' }).click();
	await expect(page).toHaveURL(/\/historial$/);
	await expect(page.getByText('Todavía no hay entrenamientos.')).toBeVisible();
});
