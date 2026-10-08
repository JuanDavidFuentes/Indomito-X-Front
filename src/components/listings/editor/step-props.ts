import type { HostListingResponse, MyHostResponse, SportDto } from '@juandavidfuentes/indomitox-shared';

/** Lo que recibe cada paso del editor de publicaciones. */
export interface StepProps {
  data: HostListingResponse;
  /** La publicación se puede editar (estado y rol del equipo). */
  editable: boolean;
  /** Actividades que declaró el Guía (los servicios solo pueden usar estas). */
  hostSportKeys: string[];
  catalog: SportDto[];
  mine: MyHostResponse;
}
