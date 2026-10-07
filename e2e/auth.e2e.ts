import { expect, test, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';

const MAILPIT_URL = process.env.MAILPIT_URL ?? 'http://localhost:8025';
const PASSWORD = 'salto-al-chicamocha';

/** Último correo en Mailpit para `to` con ese asunto (espera hasta que llegue). */
async function emailLink(to: string, subject: RegExp): Promise<string> {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    const res = await fetch(`${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`);
    const { messages } = (await res.json()) as { messages: { ID: string; Subject: string }[] };
    const found = messages.find((message) => subject.test(message.Subject));
    if (found) {
      const message = (await (await fetch(`${MAILPIT_URL}/api/v1/message/${found.ID}`)).json()) as { Text: string };
      const link = /https?:\/\/\S+token=[\w-]+/.exec(message.Text)?.[0];
      if (link) return link;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`No llegó el correo ${subject} para ${to}`);
}

async function signIn(page: Page, email: string, password = PASSWORD) {
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
}

/**
 * Flujo completo de F1 en la web: explorar sin cuenta → la cuenta se pide al guardar un
 * favorito (AUTH-07) → registro con consentimientos → verificación por correo → perfil →
 * cerrar sesión → ingresar → eliminar la cuenta.
 */
test('registro, verificación, perfil, sesión y eliminación de la cuenta', async ({ page }) => {
  const email = `e2e+${randomUUID().slice(0, 8)}@prueba.indomitox.co`;

  // AUTH-07: sin sesión, guardar un favorito pide la cuenta y recuerda de dónde venía.
  await page.goto('/es');
  await page.getByRole('button', { name: /Guardar en favoritos/ }).first().click();
  await expect(page).toHaveURL(/\/es\/ingresar\?next=%2Fes/);
  await expect(page.getByText('Ingresa o crea tu cuenta para continuar.')).toBeVisible();

  // Registro (AUTH-02, AUTH-04, AUTH-08).
  await page.getByRole('link', { name: 'Crea una gratis' }).click();
  await expect(page).toHaveURL(/\/es\/registro\?next=/);
  await page.getByLabel('Nombre completo').fill('Ana Explora');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  // Sin los consentimientos no se envía.
  await expect(page.getByText('Debes aceptar para continuar.').first()).toBeVisible();
  await page.getByLabel(/Acepto los Términos/).check();
  await page.getByLabel(/Autorizo el tratamiento/).check();
  await page.getByRole('button', { name: 'Crear cuenta' }).click();

  // Vuelve a donde estaba, con la sesión abierta.
  await expect(page).toHaveURL(/\/es$/);
  await expect(page.getByRole('button', { name: 'Menú de tu cuenta' })).toBeVisible();

  // Verificación con el enlace del correo.
  await page.goto(await emailLink(email, /Verifica tu correo/));
  await expect(page.getByText('¡Listo! Tu correo quedó verificado.')).toBeVisible();

  // Perfil (EXP-02).
  await page.getByRole('link', { name: 'Mi cuenta' }).click();
  await expect(page.getByRole('heading', { name: 'Hola, Ana' })).toBeVisible();
  await expect(page.getByText('Correo verificado')).toBeVisible();
  await page.getByLabel('Ciudad donde vives').fill('San Gil');
  await page.locator('#datos').getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Cambios guardados.').first()).toBeVisible();

  // Foto de perfil: se sube directo a S3 y se puede quitar.
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64',
  );
  await page.getByLabel('Cambiar foto').setInputFiles({ name: 'yo.png', mimeType: 'image/png', buffer: png });
  await expect(page.getByText('Foto actualizada.')).toBeVisible();
  await page.getByRole('button', { name: 'Quitar foto' }).click();
  await expect(page.getByText('Quitamos tu foto.')).toBeVisible();

  await page.getByRole('button', { name: 'Agregar participante' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nombre completo').fill('Sofía Explora');
  await dialog.getByLabel('Número de documento').fill('1098765432');
  await dialog.getByLabel('Fecha de nacimiento').fill('2014-05-20');
  await dialog.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.locator('#participantes').getByText('•••• 5432')).toBeVisible();

  // Al recargar, los datos siguen ahí (vienen del servidor).
  await page.reload();
  await expect(page.getByLabel('Ciudad donde vives')).toHaveValue('San Gil');

  // Cerrar sesión e ingresar de nuevo.
  await page.getByRole('button', { name: 'Menú de tu cuenta' }).click();
  await page.getByRole('menuitem', { name: 'Cerrar sesión' }).click();
  await expect(page.getByRole('link', { name: 'Ingresar' })).toBeVisible();

  await page.goto('/es/cuenta');
  await expect(page).toHaveURL(/\/es\/ingresar\?next=%2Fes%2Fcuenta/);
  await signIn(page, email, 'clave-equivocada');
  await expect(page.getByText('El correo o la contraseña no coinciden.')).toBeVisible();
  await signIn(page, email);
  await expect(page).toHaveURL(/\/es\/cuenta$/);

  // Eliminar la cuenta (AUTH-06).
  await page.getByRole('button', { name: 'Eliminar mi cuenta' }).click();
  await page.getByLabel('Escribe tu contraseña para confirmar').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sí, eliminar mi cuenta' }).click();
  await expect(page).toHaveURL(/\/es$/);
  await expect(page.getByRole('link', { name: 'Ingresar' })).toBeVisible();

  await page.goto('/es/ingresar');
  await signIn(page, email);
  await expect(page.getByText('El correo o la contraseña no coinciden.')).toBeVisible();
});
