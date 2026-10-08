import { expect, test, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

const FIXTURES = path.join(__dirname, 'fixtures');
const PHOTOS = ['foto-1.jpg', 'foto-2.jpg', 'foto-3.jpg'].map((name) => path.join(FIXTURES, name));
const API_URL = process.env.API_URL ?? 'http://localhost:4000';
const WEB_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const DESCRIPTION =
  'Salida guiada con todo el equipo certificado, charla de seguridad antes de empezar y fotos del recorrido. Grupos pequeños para cuidar cada detalle.';

async function signIn(page: Page, email: string) {
  await page.goto('/es/ingresar');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill('Aventura-2026');
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  await expect(page).not.toHaveURL(/ingresar/);
}

async function saved(page: Page) {
  await expect(page.getByText('Cambios guardados').first()).toBeVisible();
}

async function next(page: Page, title: string) {
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await expect(page.getByRole('heading', { level: 2, name: title })).toBeVisible();
}

async function newListing(page: Page, type: string): Promise<string> {
  await page.goto('/es/panel/publicaciones');
  await page.getByRole('button', { name: 'Nueva publicación' }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('radio', { name: new RegExp(`^${type}`) }).click();
  await dialog.getByRole('button', { name: 'Crear borrador' }).click();
  await expect(page).toHaveURL(/\/es\/panel\/publicaciones\/[\w-]+/);
  await expect(page.getByRole('heading', { level: 2, name: 'Lo básico' })).toBeVisible();
  return page.url().split('/').pop()!.split('?')[0]!;
}

async function basics(page: Page, title: string) {
  await page.getByRole('textbox', { name: 'Título', exact: true }).fill(title);
  await page.getByRole('textbox', { name: 'Descripción', exact: true }).fill(DESCRIPTION);
  await page.getByRole('checkbox', { name: /Rafting/ }).click();
  await saved(page);
}

async function photos(page: Page) {
  await page.locator('input[type="file"]').setInputFiles(PHOTOS);
  await expect(page.getByText(/^3 fotos/)).toBeVisible({ timeout: 30_000 });
  // La API genera las variantes en segundo plano (cola `media`).
  await expect(page.getByText('Procesando la foto…')).toHaveCount(0, { timeout: 60_000 });
}

async function pricing(page: Page, pesos: string) {
  await page.getByLabel('Precio (COP)').fill(pesos);
  await page.getByRole('checkbox', { name: /Pago en línea/ }).click();
  await saved(page);
}

async function publish(page: Page) {
  await expect(page.getByText('Lista para publicar.')).toBeVisible();
  await page.getByRole('button', { name: 'Publicar', exact: true }).first().click();
  await expect(page.getByText('¡Publicada! Ya la pueden encontrar los Exploradores.')).toBeVisible();
}

/**
 * "Listo cuando" de F3: un Guía aprobado (Fonce Extremo, de la semilla) publica una
 * experiencia con horarios y un producto con variantes, y los ve en su panel y su calendario.
 */
test('un Guía aprobado publica una experiencia con horarios y un producto con variantes', async ({ page }) => {
  test.setTimeout(240_000);
  const id = randomUUID().slice(0, 6);
  const experience = `Rafting al atardecer ${id}`;
  const product = `Gorra Fonce Extremo ${id}`;
  await signIn(page, 'guia@indomitox.co');

  // ─── Experiencia ───────────────────────────────────────────
  const experienceId = await newListing(page, 'Experiencia');
  await basics(page, experience);

  // Ubicación: el municipio y la dirección vienen del Guía; el punto, del centro del municipio.
  await next(page, 'Dónde');
  await page.getByRole('button', { name: /Usar el centro de San Gil/ }).click();
  await saved(page);

  await next(page, 'Detalles');
  await page.getByLabel('Duración (horas)').fill('3');
  await page.getByRole('radio', { name: /Principiante/ }).click();
  await page.getByRole('textbox', { name: 'Incluye', exact: true }).fill('Transporte desde San Gil\nCasco y chaleco');
  await saved(page);

  await next(page, 'Fotos y video');
  await photos(page);

  await next(page, 'Precio y políticas');
  await pricing(page, '95000');

  // Disponibilidad: todos los días a las 16:00 con 8 cupos (genera los horarios de 90 días).
  await next(page, 'Disponibilidad');
  await page.getByRole('button', { name: 'Agregar horario' }).click();
  await page.getByRole('button', { name: 'Todos los días' }).click();
  await page.getByLabel('Hora de salida 1').fill('16:00');
  await page.getByLabel('Cupos').fill('8');
  await page.getByRole('button', { name: 'Guardar horario' }).click();
  await expect(page.getByText('Horario guardado.')).toBeVisible();
  await expect(page.getByText(/horarios abiertos en los próximos 90 días/)).toBeVisible();
  await publish(page);

  // ─── Producto con variantes ────────────────────────────────
  const productId = await newListing(page, 'Producto');
  await basics(page, product);

  await next(page, 'Dónde');
  await next(page, 'Detalles');
  await page.getByLabel('Talla').first().fill('Única');
  await page.getByLabel('Color').first().fill('Lava');
  await page.getByLabel('Stock').first().fill('5');
  await page.getByRole('button', { name: 'Agregar variante' }).click();
  await page.getByLabel('Talla').nth(1).fill('Única');
  await page.getByLabel('Color').nth(1).fill('Noche');
  await page.getByLabel('Stock').nth(1).fill('3');
  await page.getByRole('button', { name: 'Guardar variantes' }).click();
  await expect(page.getByText('Variantes guardadas.')).toBeVisible();
  await page.getByRole('checkbox', { name: 'Se puede recoger en mi punto' }).click();
  await saved(page);

  await next(page, 'Fotos y video');
  await photos(page);

  await next(page, 'Precio y políticas');
  await pricing(page, '45000');
  await publish(page);

  // ─── En el panel ───────────────────────────────────────────
  await page.goto('/es/panel/publicaciones');
  const experienceCard = page.getByRole('listitem').filter({ hasText: experience });
  await expect(experienceCard.getByText('Publicada')).toBeVisible();
  await expect(experienceCard.getByText(/Próximo: .+ · \d+ horarios en 90 días/)).toBeVisible();
  const productCard = page.getByRole('listitem').filter({ hasText: product });
  await expect(productCard.getByText('Publicada')).toBeVisible();
  await expect(productCard.getByText('8 unidades en stock')).toBeVisible();

  // Y sus horarios en el calendario (vista de semana).
  await page.goto('/es/panel/calendario?vista=semana');
  await expect(page.getByText(experience).first()).toBeVisible();

  // Limpieza: se archivan para no llenar el panel del Guía de la semilla en cada corrida.
  for (const listingId of [experienceId, productId]) {
    const response = await page.request.post(`${API_URL}/v1/host/listings/${listingId}/transition`, {
      headers: { origin: WEB_URL },
      data: { action: 'ARCHIVE' },
    });
    expect(response.ok()).toBeTruthy();
  }
});
