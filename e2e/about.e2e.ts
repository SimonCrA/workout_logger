import { readFileSync } from 'node:fs';
import { expect, signUp, test } from './fixtures';

const { version } = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string };

test('shows Acerca de at the end of Perfil with the version and support email', async ({
	page
}) => {
	await page.goto('/perfil');
	const about = page.getByRole('region', { name: 'Acerca de' });

	await expect(about).toContainText(new RegExp(`Versión\\s*${version.replaceAll('.', '\\.')}`));
	await expect(about.getByRole('link', { name: 'simonct3ch@gmail.com' })).toHaveAttribute(
		'href',
		'mailto:simonct3ch@gmail.com'
	);
	await expect(about.getByRole('link')).toHaveCount(1);
	await expect(page.locator('main section').last()).toHaveAttribute('aria-label', 'Acerca de');
});

test('keeps Acerca de the same once signed in', async ({ page }) => {
	await page.goto('/perfil');
	const about = page.getByRole('region', { name: 'Acerca de' });
	const signedOut = (await about.textContent()) ?? '';

	await signUp(page);

	await expect(about).toHaveText(signedOut);
});
