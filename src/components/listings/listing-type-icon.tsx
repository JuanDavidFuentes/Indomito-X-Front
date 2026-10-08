import type { ListingType } from '@juandavidfuentes/indomitox-shared';
import { Backpack, ChalkboardTeacher, Compass, SuitcaseRolling, TShirt, type Icon } from '@phosphor-icons/react';

/** Ícono de cada tipo de publicación (decorativo: el nombre va siempre al lado). */
export const LISTING_TYPE_ICONS: Record<ListingType, Icon> = {
  EXPERIENCE: Compass,
  RENTAL: Backpack,
  COURSE: ChalkboardTeacher,
  PACKAGE: SuitcaseRolling,
  PRODUCT: TShirt,
};
