import { HOME_SPORTS } from '@juandavidfuentes/indomitox-shared';
import { useTranslations } from 'next-intl';
import { AppCta } from '@/components/home/app-cta';
import { Destinations } from '@/components/home/destinations';
import { Elements } from '@/components/home/elements';
import { Featured } from '@/components/home/featured';
import { Hero } from '@/components/home/hero';
import { HostCta } from '@/components/home/host-cta';
import { Levels } from '@/components/home/levels';
import { SportTicker } from '@/components/home/sport-ticker';
import { ValueStrip } from '@/components/home/value-strip';

export default function HomePage() {
  const t = useTranslations();

  return (
    <>
      <Hero />
      <SportTicker
        items={HOME_SPORTS.map((sport) => t(`sports.${sport}`))}
        pauseLabel={t('common.pauseAnimation')}
        playLabel={t('common.playAnimation')}
      />
      <ValueStrip />
      <Elements />
      <Featured />
      <Destinations />
      <Levels />
      <HostCta />
      <AppCta />
    </>
  );
}
