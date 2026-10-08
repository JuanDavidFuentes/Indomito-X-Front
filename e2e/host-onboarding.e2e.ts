import { slugify } from '@juandavidfuentes/indomitox-shared';
import { expect, test, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';

const MAILPIT_URL = process.env.MAILPIT_URL ?? 'http://localhost:8025';
const PASSWORD = 'salto-al-chicamocha';
const PDF = Buffer.from('%PDF-1.4\n% Documento de prueba de Indómito X\n%%EOF\n', 'latin1');

/** Enlace del último correo en Mailpit para `to` con ese asunto. */
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

async function next(page: Page, title: RegExp) {
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await expect(page.getByRole('heading', { level: 2, name: title })).toBeVisible();
}

/**
 * "Listo cuando" de F2: un usuario se registra como Guía, completa el alta por pasos con sus
 * documentos (subidos directo a S3), la envía, el administrador revisa los documentos y lo
 * aprueba, y su página pública se ve con el RNT.
 */
test('alta del Guía, aprobación del administrador y página pública con el RNT', async ({ page, browser }) => {
  const id = randomUUID().slice(0, 6);
  const email = `guia+${id}@prueba.indomitox.co`;
  const tradeName = `Cumbre Sur ${id}`;

  // Registro eligiendo "ofrecer aventuras" (AUTH-04): llega al panel del Guía.
  await page.goto('/es/registro');
  await page.getByText('Quiero ofrecer aventuras').click();
  await page.getByLabel('Nombre completo').fill('Mariana Cañón');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(PASSWORD);
  await page.getByLabel(/Acepto los Términos/).check();
  await page.getByLabel(/Autorizo el tratamiento/).check();
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page).toHaveURL(/\/es\/panel\/verificacion/);
  await expect(page.getByRole('heading', { name: 'Conviértete en Guía' })).toBeVisible();

  // Verifica el correo (hace falta para enviar la solicitud).
  await page.goto(await emailLink(email, /Verifica tu correo/));
  await expect(page.getByText('¡Listo! Tu correo quedó verificado.')).toBeVisible();
  await page.goto('/es/panel/verificacion');
  await page.getByRole('button', { name: 'Empezar mi alta' }).click();

  // Paso 1: tipo.
  await expect(page.getByRole('heading', { level: 2, name: '¿Cómo trabajas?' })).toBeVisible();
  await page.getByText('Persona natural', { exact: true }).click();
  await expect(page.getByText('Cambios guardados')).toBeVisible();

  // Paso 2: empresa, contacto y actividades (autoguardado).
  await next(page, /Datos de tu empresa/);
  await page.getByLabel('Razón social o nombre completo').fill('Mariana Cañón Rueda');
  await page.getByLabel('Nombre comercial').fill(tradeName);
  await page.getByLabel('NIT o cédula').fill('1098765432');
  await page.getByLabel('Número de RNT').fill('54321');
  await page.getByLabel('Teléfono de contacto').fill('+57 315 555 0101');
  await page.getByLabel('Correo de contacto').fill('reservas@cumbresur.co');
  // Municipio del DANE con el buscador (F3).
  await page.getByRole('combobox', { name: 'Municipio' }).fill('Curití');
  await page.getByRole('option', { name: /Curití/ }).click();
  await page.getByLabel('Dirección').fill('Vereda Palo Blanco');
  await page.getByRole('checkbox', { name: /Rafting/ }).click();
  await page.getByRole('checkbox', { name: /Senderismo/ }).click();
  // Un NIT con el dígito equivocado no se guarda y avisa al salir del campo.
  await page.getByLabel('NIT o cédula').fill('800197268-5');
  await page.getByLabel('Número de RNT').focus();
  await expect(page.getByText('El dígito de verificación no coincide con el NIT.')).toBeVisible();
  await page.getByLabel('NIT o cédula').fill('1098765432');
  await expect(page.getByText('Cambios guardados')).toBeVisible();

  // Paso 3: documentos, subidos directo a S3 (RustFS) con su vencimiento.
  await next(page, /Documentos de verificación/);
  const upload = page.getByRole('button', { name: 'Cargar documento' });
  await expect(upload).toHaveCount(5); // cédula, RUT, RNT, NTS de rafting y póliza
  while ((await upload.count()) > 0) {
    await upload.first().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Elegir archivo').setInputFiles({ name: 'documento.pdf', mimeType: 'application/pdf', buffer: PDF });
    await expect(dialog.getByText('documento.pdf')).toBeVisible();
    const expiry = dialog.getByLabel('Fecha de vencimiento');
    if (await expiry.count()) await expiry.fill('2099-12-31');
    await dialog.getByRole('button', { name: 'Guardar' }).click();
    await expect(dialog).toBeHidden();
  }
  await expect(page.getByText('En revisión')).toHaveCount(5);

  // Paso 4: cuenta de pago (cifrada).
  await next(page, /¿Dónde recibes tu dinero\?/);
  await page.getByLabel('Banco o billetera').click();
  await page.getByRole('option', { name: 'Nequi' }).click();
  await page.getByLabel('Celular de la billetera').fill('3155550101');
  await page.getByRole('button', { name: 'Guardar cuenta' }).click();
  await expect(page.getByText(/Nequi · billetera digital terminada en 0101/)).toBeVisible();

  // Paso 5: página pública.
  await next(page, /Tu página pública/);
  await page.getByLabel('Descripción').fill(
    'Torrentismo y espeleología en Curití con guías certificados, equipo revisado y grupos pequeños para cuidar cada detalle.',
  );
  await page.getByRole('checkbox', { name: 'Español' }).click();
  await expect(page.getByText('Cambios guardados')).toBeVisible();

  // Paso 6: revisar y enviar.
  await next(page, /Revisa y envía/);
  await expect(page.getByText('Todo listo. Revisa los datos y envía tu solicitud.')).toBeVisible();
  await page.getByLabel(/Declaro que la información/).check();
  await page.getByRole('button', { name: 'Enviar a revisión' }).click();
  await expect(page.getByRole('heading', { name: 'Recibimos tu solicitud' })).toBeVisible();

  // El administrador revisa los documentos y aprueba (ADM-01).
  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  await admin.goto('/es/admin/guias');
  await admin.getByLabel('Correo electrónico').fill('admin@indomitox.co');
  await admin.getByLabel('Contraseña', { exact: true }).fill('Aventura-2026');
  await admin.getByRole('button', { name: 'Ingresar', exact: true }).click();
  await admin.getByRole('link', { name: tradeName }).first().click();
  await expect(admin.getByRole('heading', { level: 2, name: tradeName })).toBeVisible();
  const approveDocument = admin.getByRole('button', { name: 'Aprobar', exact: true });
  while ((await approveDocument.count()) > 0) {
    const before = await approveDocument.count();
    await approveDocument.first().click();
    await expect(approveDocument).toHaveCount(before - 1);
  }
  await admin.getByRole('button', { name: 'Aprobar Guía' }).click();
  await admin.getByRole('dialog').getByRole('button', { name: 'Aprobar Guía' }).click();
  await expect(admin.getByText('Decisión registrada.')).toBeVisible();
  await adminContext.close();

  // PAGE-01/02: la página pública ya se ve, con el RNT.
  await page.goto(`/es/guias/${slugify(tradeName)}`);
  await expect(page.getByRole('heading', { level: 1, name: tradeName })).toBeVisible();
  await expect(page.getByText('54321').first()).toBeVisible();
  await expect(page.getByText('Guía verificado')).toBeVisible();
});
