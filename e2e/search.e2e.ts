import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';
const WEB_URL = process.env.BASE_URL ?? 'http://localhost:3000';

/**
 * "Listo cuando" de F4 en la web: se busca "San Gil", se filtra por rafting, el mapa muestra los
 * pines agrupados, se abre el detalle (con el RNT del Guía) y se guarda en favoritos. Usa las
 * publicaciones de la semilla (`npm run setup`).
 */
test('busca San Gil, filtra por rafting, abre el detalle y lo guarda en favoritos', async ({ page, context }) => {
  test.setTimeout(120_000);
  const id = randomUUID().slice(0, 6);

  // Una cuenta nueva por la API (deja las cookies de sesión en el navegador).
  const register = await context.request.post(`${API_URL}/v1/auth/register`, {
    headers: { origin: WEB_URL },
    data: { name: 'Exploradora F4', email: `busqueda+${id}@prueba.indomitox.co`, password: 'salto-al-chicamocha', acceptTerms: true, acceptPrivacy: true },
  });
  expect(register.ok()).toBe(true);

  // Portada: destino con autocompletado.
  await page.goto('/es');
  const destination = page.getByRole('combobox', { name: 'Destino' });
  await destination.fill('San Gil');
  await page.getByRole('option', { name: /^San Gil/ }).first().click();
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page).toHaveURL(/\/es\/buscar\?place=san-gil/);
  await expect(page.getByRole('heading', { level: 1, name: 'Aventuras en San Gil' })).toBeVisible();

  // Filtro por rafting: la URL lo refleja (SRCH-05) y el mapa recibe los pines.
  const pins = page.waitForResponse((res) => res.url().includes('/v1/search/pins') && res.url().includes('sport=RAFTING'));
  await page.getByRole('button', { name: /^Rafting \d+/ }).click();
  await expect(page).toHaveURL(/sport=RAFTING/);
  const pinsBody = (await (await pins).json()) as { pins: unknown[]; total: number };
  expect(pinsBody.total).toBeGreaterThan(1);
  await expect(page.getByRole('region', { name: 'Mapa de las aventuras encontradas' }).locator('canvas')).toBeVisible();
  const results = page.getByRole('heading', { level: 2 }).filter({ hasText: /rafting/i });
  await expect(results.first()).toBeVisible();

  // Detalle: URL /{deporte}/{ciudad}/{slug} y el RNT del Guía (LIST-05, LIST-07).
  await results.first().getByRole('link').click();
  await expect(page).toHaveURL(/\/es\/rafting\/san-gil\/[a-z0-9-]+$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText(/^RNT \d+/)).toBeVisible();

  // Favoritos (EXP-01): una lista nueva con la aventura.
  const listName = `San Gil ${id}`;
  await page.getByRole('button', { name: 'Guardar en favoritos', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Guardar en una lista' });
  await dialog.getByLabel(/Nombre de la lista|Lista nueva/).fill(listName);
  await dialog.getByRole('button', { name: 'Crear y guardar' }).click();
  await expect(page.getByText(`Guardada en «${listName}»`)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Quitar de favoritos', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const title = await page.getByRole('heading', { level: 1 }).textContent();

  // Atrás vuelve a la búsqueda con el filtro (SRCH-05).
  await page.goBack();
  await expect(page).toHaveURL(/place=san-gil.*sport=RAFTING|sport=RAFTING.*place=san-gil/);

  // La lista en la cuenta, con la aventura; al final se elimina.
  await page.goto('/es/cuenta/favoritos');
  await page.getByRole('link', { name: new RegExp(listName) }).click();
  await expect(page.getByRole('heading', { level: 1, name: listName })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: title!.trim() })).toBeVisible();
  await page.getByRole('button', { name: 'Eliminar la lista' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar la lista' }).click();
  await expect(page).toHaveURL(/\/es\/cuenta\/favoritos$/);
  await expect(page.getByText('Aún no guardas aventuras')).toBeVisible();
});
