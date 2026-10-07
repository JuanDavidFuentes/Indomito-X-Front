import { HostOverview } from '@/components/host/overview';
import { loadHostOr } from '@/components/host/panel-fallbacks';

/** /panel: resumen del Guía, o la invitación a empezar el alta si aún no tiene cuenta de Guía. */
export default async function PanelPage() {
  const loaded = await loadHostOr('/panel');
  if ('fallback' in loaded) return loaded.fallback;
  return <HostOverview initial={loaded.mine} />;
}
