'use client';

import { circlePolygon, DEFAULT_MAP_CENTER, type GeoPoint } from '@juandavidfuentes/indomitox-shared';
import type { GeoJSONSource, Map as MapLibreMap, Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

/** Mapas libres y sin clave (PLAN §3): OpenFreeMap, con su estilo oscuro en el tema oscuro. */
const STYLES = {
  light: 'https://tiles.openfreemap.org/styles/liberty',
  dark: 'https://tiles.openfreemap.org/styles/dark',
} as const;

const CIRCLE_SOURCE = 'ix-radius';

/** Color de un token de diseño (los tokens son hex: MapLibre los entiende). */
function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim() || '#EA580C';
}

function circleData(point: GeoPoint, radiusMeters: number) {
  return {
    type: 'Feature' as const,
    properties: {},
    geometry: { type: 'Polygon' as const, coordinates: [circlePolygon(point, radiusMeters)] },
  };
}

/**
 * Mapa de MapLibre con un punto: el de encuentro de una publicación o el centro de una zona (con
 * su radio). En modo edición se elige tocando el mapa o arrastrando el marcador; las coordenadas
 * también se pueden escribir en los campos de al lado (alternativa al arrastre, WCAG 2.5.7).
 */
export function LocationMap({
  point,
  onPick,
  radiusMeters,
  label,
  className = 'h-72',
  zoom = 13,
}: {
  point: GeoPoint | null;
  onPick?: (point: GeoPoint) => void;
  radiusMeters?: number | null;
  label: string;
  className?: string;
  zoom?: number;
}) {
  const t = useTranslations('maps');
  const { resolvedTheme } = useTheme();
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const onPickRef = useRef(onPick);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const theme = resolvedTheme === 'dark' ? 'dark' : 'light';

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  // Crea el mapa una sola vez (MapLibre se carga solo en el navegador).
  useEffect(() => {
    let cancelled = false;
    let instance: MapLibreMap | null = null;
    void (async () => {
      try {
        const maplibregl = await import('maplibre-gl');
        if (cancelled || !container.current) return;
        maplibregl.setWorkerUrl('/vendor/maplibre-gl-worker.mjs');
        const start = point ?? DEFAULT_MAP_CENTER;
        instance = new maplibregl.Map({
          container: container.current,
          style: STYLES[theme],
          center: [start.lng, start.lat],
          zoom: point ? zoom : DEFAULT_MAP_CENTER.zoom,
          attributionControl: { compact: true },
          cooperativeGestures: true,
          locale: {
            'NavigationControl.ZoomIn': t('zoomIn'),
            'NavigationControl.ZoomOut': t('zoomOut'),
            'CooperativeGesturesHandler.WindowsHelpText': t('gesturesDesktop', { key: 'Ctrl' }),
            'CooperativeGesturesHandler.MacHelpText': t('gesturesDesktop', { key: '⌘' }),
            'CooperativeGesturesHandler.MobileHelpText': t('gesturesMobile'),
          },
        });
        instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
        const element = document.createElement('div');
        element.className = 'size-7 rounded-full border-4 border-background bg-primary shadow-lg';
        marker.current = new maplibregl.Marker({ element, draggable: Boolean(onPickRef.current) });
        if (point) marker.current.setLngLat([point.lng, point.lat]).addTo(instance);
        marker.current.on('dragend', () => {
          const position = marker.current!.getLngLat();
          onPickRef.current?.({ lat: position.lat, lng: position.lng });
        });
        instance.on('click', (event) => {
          if (!onPickRef.current) return;
          onPickRef.current({ lat: event.lngLat.lat, lng: event.lngLat.lng });
        });
        instance.on('load', () => setReady(true));
        instance.on('error', (event) => {
          // Un mosaico que falla no es grave; el estilo que no carga sí.
          if (!instance?.isStyleLoaded() && String(event.error?.message ?? '').includes('style')) setFailed(true);
        });
        map.current = instance;
      } catch {
        setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      instance?.remove();
      map.current = null;
      marker.current = null;
      setReady(false);
    };
    // El tema cambia el estilo: se vuelve a crear el mapa (pocas veces).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  // Marcador y vista siguen al punto.
  useEffect(() => {
    const instance = map.current;
    if (!instance || !marker.current) return;
    if (!point) {
      marker.current.remove();
      return;
    }
    marker.current.setLngLat([point.lng, point.lat]).addTo(instance);
    if (!instance.getBounds().contains([point.lng, point.lat])) instance.easeTo({ center: [point.lng, point.lat], zoom: Math.max(instance.getZoom(), zoom) });
  }, [point, ready, zoom]);

  // Radio de la zona.
  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready) return;
    const source = instance.getSource(CIRCLE_SOURCE) as GeoJSONSource | undefined;
    if (!point || !radiusMeters) {
      if (source) source.setData({ type: 'FeatureCollection', features: [] });
      return;
    }
    const data = circleData(point, radiusMeters);
    if (source) {
      source.setData(data);
    } else {
      instance.addSource(CIRCLE_SOURCE, { type: 'geojson', data });
      instance.addLayer({ id: `${CIRCLE_SOURCE}-fill`, type: 'fill', source: CIRCLE_SOURCE, paint: { 'fill-color': token('brand'), 'fill-opacity': 0.15 } });
      instance.addLayer({ id: `${CIRCLE_SOURCE}-line`, type: 'line', source: CIRCLE_SOURCE, paint: { 'line-color': token('brand'), 'line-width': 2 } });
    }
    const [west, south, east, north] = data.geometry.coordinates[0]!.reduce(
      ([w, s, e, n], [lng, lat]) => [Math.min(w, lng), Math.min(s, lat), Math.max(e, lng), Math.max(n, lat)],
      [180, 90, -180, -90],
    );
    instance.fitBounds([west!, south!, east!, north!], { padding: 32, duration: 300 });
  }, [point, radiusMeters, ready]);

  return (
    <div className={`relative overflow-hidden rounded-xl border border-border bg-muted ${className}`}>
      <div ref={container} role="region" aria-label={label} className="size-full" />
      {!ready && !failed ? (
        <p className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-muted-foreground">{t('loading')}</p>
      ) : null}
      {failed ? (
        <p role="status" className="absolute inset-0 grid place-items-center p-4 text-center text-sm text-muted-foreground">
          {t('unavailable')}
        </p>
      ) : null}
      {onPick && ready ? (
        <p className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-background/90 px-2 py-1 text-xs font-semibold shadow-sm">{t('pickHint')}</p>
      ) : null}
    </div>
  );
}
