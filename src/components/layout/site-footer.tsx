import { useTranslations } from 'next-intl';
import { Logo } from '@/components/brand/logo';

export function SiteFooter() {
  const t = useTranslations();

  return (
    <footer className="bg-night text-night-foreground">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-end md:justify-between lg:px-8">
        <div className="space-y-3">
          <Logo />
          <p className="font-display text-lg tracking-wide text-accent uppercase">
            {t('common.tagline')}
          </p>
          <p className="max-w-md text-night-foreground/75">{t('footer.madeIn')}</p>
        </div>
        <p className="text-sm text-night-foreground/75">
          {t('footer.rights', { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}
