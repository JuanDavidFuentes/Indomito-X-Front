'use client';

import { ShareNetwork } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

/**
 * Compartir (EXP-04): la hoja nativa del sistema donde exista (móviles) o copiar el enlace. El
 * enlace es la URL pública de la web: abre la app si está instalada (App Links / Universal
 * Links) y muestra la vista previa de Open Graph en WhatsApp y las redes.
 */
export function ShareButton({ title, url }: { title: string; url: string }) {
  const t = useTranslations('listingDetail');

  const share = async () => {
    const data = { title, text: t('shareText', { title }), url };
    if (typeof navigator.share === 'function' && (!navigator.canShare || navigator.canShare(data))) {
      try {
        await navigator.share(data);
        return;
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
      }
    }
    await navigator.clipboard.writeText(url);
    toast(t('linkCopied'));
  };

  return (
    <Button type="button" variant="outline" onClick={() => void share()}>
      <ShareNetwork aria-hidden="true" />
      {t('share')}
    </Button>
  );
}
