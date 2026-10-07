import type { PhotoId } from '@juandavidfuentes/indomitox-shared';
import type { StaticImageData } from 'next/image';
import aguaRaftingFonce from '@/assets/photos/agua-rafting-fonce.jpg';
import aireParapenteSanGil from '@/assets/photos/aire-parapente-san-gil.jpg';
import cuevaVacaCuriti from '@/assets/photos/cueva-vaca-curiti.jpg';
import destinoBarichara from '@/assets/photos/destino-barichara.jpg';
import destinoChicamocha from '@/assets/photos/destino-chicamocha.jpg';
import destinoCuriti from '@/assets/photos/destino-curiti.jpg';
import destinoSanGil from '@/assets/photos/destino-san-gil.jpg';
import guiaRafting from '@/assets/photos/guia-rafting.jpg';
import heroChicamochaParapente from '@/assets/photos/hero-chicamocha-parapente.jpg';
import parqueBungee from '@/assets/photos/parque-bungee.jpg';
import subterraneoCuevaVaca from '@/assets/photos/subterraneo-cueva-vaca.jpg';
import tierraEscalada from '@/assets/photos/tierra-escalada.jpg';
import torrentismo from '@/assets/photos/torrentismo.jpg';

/**
 * Importaciones estáticas: next/image conoce el tamaño (sin saltos de diseño), genera el
 * desenfoque de carga y sirve AVIF/WebP. Los créditos están en PHOTO_CREDITS (shared).
 */
export const PHOTOS: Record<PhotoId, StaticImageData> = {
  'hero-chicamocha-parapente': heroChicamochaParapente,
  'agua-rafting-fonce': aguaRaftingFonce,
  'aire-parapente-san-gil': aireParapenteSanGil,
  'tierra-escalada': tierraEscalada,
  'subterraneo-cueva-vaca': subterraneoCuevaVaca,
  'parque-bungee': parqueBungee,
  'cueva-vaca-curiti': cuevaVacaCuriti,
  torrentismo,
  'destino-chicamocha': destinoChicamocha,
  'destino-san-gil': destinoSanGil,
  'destino-barichara': destinoBarichara,
  'destino-curiti': destinoCuriti,
  'guia-rafting': guiaRafting,
};
