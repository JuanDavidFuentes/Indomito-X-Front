'use client';

import { DEFAULT_MAP_CENTER, type BoundingBox, type ListingPin } from '@juandavidfuentes/indomitox-shared';
import { MagnifyingGlass } from '@phosphor-icons/react';
import type { GeoJSONSource, LngLatBoundsLike, Map as MapLibreMap, MapLayerMouseEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

const STYLES = {
  light: 'https://tiles.openfreemap.org/styles/liberty',
  dark: 'https://tiles.openfreemap.org/styles/dark',
} as const;

const SOURCE = 'ix-pins';

/** Color de un token de diseño (los tokens son hex: MapLibre los entiende). */
function token(name: string, fallback: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim() || fallback;
}

function toGeoJson(pins: ListingPin[]) {
  return {
    type: 'FeatureCollection' as const,
    features: pins.map((pin) => ({
      type: 'Feature' as const,
      properties: { id: pin.id },
      geometry: { type: 'Point' as const, coordinates: [pin.lng, pin.lat] },
    })),
  };
}

function boundsOf(pins: ListingPin[]): LngLatBoundsLike | null {
  if (!pins.length) return null;
  let [west, south, east, north] = [180, 90, -180, -90];
  for (const pin of pins) {
    west = Math.min(west, pin.lng);
    east = Math.max(east, pin.lng);
    south = Math.min(south, pin.lat);
    north = Math.max(north, pin.lat);
  }
  return [west, south, east, north];
}

/**
 * Mapa de resultados (SRCH-02): pines agrupados por MapLibre en el cliente (color `brand`), el
 * seleccionado se agranda en `primary` y el que se resalta desde la lista también. Al mover el
 * mapa aparece "Buscar en esta zona". Los mismos resultados están en la lista, que es la
 * alternativa accesible al mapa.
 */
export function SearchMap({
  pins,
  fitKey,
  bbox,
  selectedId,
  highlightedId,
  onSelect,
  onSearchArea,
  label,
  className = 'size-full',
}: {
  pins: ListingPin[];
  /** Cambia cuando cambia la búsqueda: el mapa se ajusta a los pines nuevos. */
  fitKey: string;
  /** Si la búsqueda es "en esta zona", el mapa se queda donde el usuario lo dejó. */
  bbox: BoundingBox | undefined;
  selectedId: string | null;
  highlightedId: string | null;
  onSelect: (id: string | null) => void;
  onSearchArea: (bbox: BoundingBox) => void;
  label: string;
  className?: string;
}) {
  const t = useTranslations();
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === 'dark' ? 'dark' : 'light';
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const [ready, setReady] = useState(false);
  const [moved, setMoved] = useState(false);
  const callbacks = useRef({ onSelect, onSearchArea });
  const fitted = useRef<string | null>(null);

  useEffect(() => {
    callbacks.current = { onSelect, onSearchArea };
  }, [onSelect, onSearchArea]);

  // Crea el mapa una vez por tema.
  useEffect(() => {
    let cancelled = false;
    let instance: MapLibreMap | null = null;
    let observer: ResizeObserver | null = null;
    void (async () => {
      const maplibregl = await import('maplibre-gl');
      if (cancelled || !container.current) return;
      maplibregl.setWorkerUrl('/vendor/maplibre-gl-worker.mjs');
      instance = new maplibregl.Map({
        container: container.current,
        style: STYLES[theme],
        center: [DEFAULT_MAP_CENTER.lng, DEFAULT_MAP_CENTER.lat],
        zoom: DEFAULT_MAP_CENTER.zoom,
        attributionControl: { compact: true },
        locale: { 'NavigationControl.ZoomIn': t('maps.zoomIn'), 'NavigationControl.ZoomOut': t('maps.zoomOut') },
      });
      instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
      const brand = token('brand', '#EA580C');
      const primary = token('primary', '#C2410C');
      const night = token('night', '#0B1120');
      const ring = token('background', '#F8FAFC');

      instance.on('load', () => {
        if (!instance) return;
        instance.addSource(SOURCE, { type: 'geojson', data: toGeoJson([]), cluster: true, clusterRadius: 46, clusterMaxZoom: 13 });
        instance.addLayer({
          id: 'clusters',
          type: 'circle',
          source: SOURCE,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': brand,
            'circle-radius': ['step', ['get', 'point_count'], 18, 10, 23, 30, 28],
            'circle-stroke-color': ring,
            'circle-stroke-width': 3,
          },
        });
        instance.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: SOURCE,
          filter: ['has', 'point_count'],
          layout: { 'text-field': '{point_count_abbreviated}', 'text-font': ['Noto Sans Bold'], 'text-size': 14, 'text-allow-overlap': true },
          paint: { 'text-color': night },
        });
        instance.addLayer({
          id: 'pins',
          type: 'circle',
          source: SOURCE,
          filter: ['!', ['has', 'point_count']],
          paint: { 'circle-color': brand, 'circle-radius': 9, 'circle-stroke-color': ring, 'circle-stroke-width': 3 },
        });
        instance.addLayer({
          id: 'pins-active',
          type: 'circle',
          source: SOURCE,
          filter: ['==', ['get', 'id'], ''],
          paint: { 'circle-color': primary, 'circle-radius': 13, 'circle-stroke-color': ring, 'circle-stroke-width': 4 },
        });
        setReady(true);
      });

      instance.on('click', 'clusters', async (event: MapLayerMouseEvent) => {
        const feature = event.features?.[0];
        const source = instance?.getSource(SOURCE) as GeoJSONSource | undefined;
        if (!feature || !source || feature.geometry.type !== 'Point') return;
        const zoom = await source.getClusterExpansionZoom(feature.properties.cluster_id as number);
        instance?.easeTo({ center: feature.geometry.coordinates as [number, number], zoom: zoom + 0.5 });
      });
      instance.on('click', (event) => {
        const hit = instance?.queryRenderedFeatures(event.point, { layers: ['pins', 'pins-active', 'clusters'] }) ?? [];
        const pin = hit.find((feature) => feature.layer.id !== 'clusters');
        if (pin) callbacks.current.onSelect(String(pin.properties.id));
        else if (!hit.length) callbacks.current.onSelect(null);
      });
      for (const layer of ['clusters', 'pins', 'pins-active']) {
        instance.on('mouseenter', layer, () => instance && (instance.getCanvas().style.cursor = 'pointer'));
        instance.on('mouseleave', layer, () => instance && (instance.getCanvas().style.cursor = ''));
      }
      // Solo cuando el usuario mueve el mapa (no cuando se ajusta solo a los resultados).
      instance.on('moveend', (event) => {
        if ((event as { originalEvent?: unknown }).originalEvent) setMoved(true);
      });
      observer = new ResizeObserver(() => instance?.resize());
      observer.observe(container.current);
      map.current = instance;
    })();
    return () => {
      cancelled = true;
      observer?.disconnect();
      instance?.remove();
      map.current = null;
      fitted.current = null;
      setReady(false);
    };
    // El tema cambia el estilo: se vuelve a crear el mapa (pocas veces).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  // Pines nuevos y ajuste de la vista a la búsqueda.
  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready) return;
    (instance.getSource(SOURCE) as GeoJSONSource | undefined)?.setData(toGeoJson(pins));
    if (fitted.current === fitKey) return;
    fitted.current = fitKey;
    if (bbox) {
      instance.fitBounds([bbox.west, bbox.south, bbox.east, bbox.north], { duration: 0 });
    } else {
      const bounds = boundsOf(pins);
      if (bounds) instance.fitBounds(bounds, { padding: 56, maxZoom: 13, duration: 400 });
    }
    setMoved(false);
  }, [pins, fitKey, bbox, ready]);

  // Pin seleccionado o resaltado desde la lista.
  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready) return;
    const active = highlightedId ?? selectedId ?? '';
    instance.setFilter('pins-active', ['==', ['get', 'id'], active]);
    if (selectedId) {
      const pin = pins.find((item) => item.id === selectedId);
      if (pin && !instance.getBounds().contains([pin.lng, pin.lat])) instance.easeTo({ center: [pin.lng, pin.lat] });
    }
  }, [highlightedId, selectedId, pins, ready]);

  const searchArea = () => {
    const bounds = map.current?.getBounds();
    if (!bounds) return;
    setMoved(false);
    callbacks.current.onSearchArea({ west: bounds.getWest(), south: bounds.getSouth(), east: bounds.getEast(), north: bounds.getNorth() });
  };

  return (
    <div className={`relative overflow-hidden bg-muted ${className}`}>
      <div ref={container} role="region" aria-label={label} className="size-full" />
      {moved ? (
        <button
          type="button"
          onClick={searchArea}
          className="absolute top-3 left-1/2 z-10 inline-flex h-11 -translate-x-1/2 animate-rise cursor-pointer items-center gap-2 rounded-full bg-night px-5 font-semibold text-night-foreground shadow-lg transition-transform duration-150 hover:brightness-110 active:scale-[0.98]"
        >
          <MagnifyingGlass size={18} weight="bold" aria-hidden="true" />
          {t('search.searchThisArea')}
        </button>
      ) : null}
      {!ready ? (
        <p role="status" className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
          {t('maps.loading')}
        </p>
      ) : null}
    </div>
  );
}
