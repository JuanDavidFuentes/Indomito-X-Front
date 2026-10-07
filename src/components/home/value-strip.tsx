import { Certificate, MapPin, ShieldCheck } from '@phosphor-icons/react/ssr';
import { useTranslations } from 'next-intl';

/** Franja de confianza bajo la cinta de deportes. */
export function ValueStrip() {
  const t = useTranslations('home');
  const items = [
    { icon: Certificate, label: t('valueVerified') },
    { icon: ShieldCheck, label: t('valueSafety') },
    { icon: MapPin, label: t('valueLocal') },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
      <ul className="grid gap-4 sm:grid-cols-3">
        {items.map(({ icon: ItemIcon, label }) => (
          <li key={label} className="flex items-center gap-3 font-semibold">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <ItemIcon size={24} aria-hidden="true" />
            </span>
            {label}
          </li>
        ))}
      </ul>
    </section>
  );
}
