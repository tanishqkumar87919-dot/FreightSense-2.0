'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { WeatherHazard } from '@/types';
import { mockWeatherHazards } from '@/data/weatherData';
import { mockRoutes } from '@/data/routeData';
import {
  initializeMapboxAuth,
  getBasemapStyle,
  MAP_DEFAULTS,
} from './mapConfig';
import { MapControls } from './MapControls';
import { MapLegend } from './MapLegend';
import { MapStatusBadge, MapLoadStatus } from './MapStatusBadge';

interface EnvironmentalMapProps {
  activeLayers: {
    storms: boolean;
    wind: boolean;
    waves: boolean;
    precipitation: boolean;
  };
  selectedHazardId?: string;
  onSelectHazard: (h: WeatherHazard) => void;
  height?: string;
}

export const EnvironmentalMap: React.FC<EnvironmentalMapProps> = ({
  activeLayers,
  selectedHazardId,
  onSelectHazard,
  height = 'h-[520px]',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapStatus, setMapStatus] = useState<MapLoadStatus>('loading');
  const [statusDetail, setStatusDetail] = useState('Loading weather hazard overlays...');

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const hasValidToken = initializeMapboxAuth();
    const mapStyle = getBasemapStyle(hasValidToken);

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [55, 25],
      zoom: 2,
      minZoom: 1.1,
      maxZoom: 12,
      attributionControl: false,
    });

    mapRef.current = map;
    popupRef.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 12,
      className: 'fs-light-popup',
    });

    map.on('load', () => {
      setMapLoaded(true);
      setMapStatus('online');
      setStatusDetail(hasValidToken ? 'Mapbox GL Vector • Online' : 'Mapbox GL Light Basemap • Online');

      // 1. BACKGROUND SHIPPING LANES
      const routesGeoJSON: any = {
        type: 'FeatureCollection',
        features: mockRoutes.map((r) => ({
          type: 'Feature',
          properties: { name: r.name },
          geometry: {
            type: 'LineString',
            coordinates: r.coordinates.waypoints.map((wp) => [wp[1], wp[0]]),
          },
        })),
      };

      map.addSource('env-shipping-routes', {
        type: 'geojson',
        data: routesGeoJSON,
      });

      map.addLayer({
        id: 'env-shipping-routes-line',
        type: 'line',
        source: 'env-shipping-routes',
        paint: {
          'line-color': '#0284C7',
          'line-width': 1.8,
          'line-opacity': 0.35,
          'line-dasharray': [3, 2],
        },
      });

      // 2. OCEAN SWELL CONTROURS (Significant Wave Heights)
      const swellGeoJSON: any = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { label: 'Severe Swell (8.8m)', waves: 8.8 },
            geometry: { type: 'Point', coordinates: [131.8, 24.2] },
          },
          {
            type: 'Feature',
            properties: { label: 'Gale Swell (7.2m)', waves: 7.2 },
            geometry: { type: 'Point', coordinates: [-28.5, 54.0] },
          },
          {
            type: 'Feature',
            properties: { label: 'Monsoon Cross Swell (4.6m)', waves: 4.6 },
            geometry: { type: 'Point', coordinates: [64.0, 12.5] },
          },
        ],
      };

      map.addSource('env-swell-source', {
        type: 'geojson',
        data: swellGeoJSON,
      });

      map.addLayer({
        id: 'env-swell-outer',
        type: 'circle',
        source: 'env-swell-source',
        layout: {
          visibility: activeLayers.waves ? 'visible' : 'none',
        },
        paint: {
          'circle-radius': 50,
          'circle-color': '#0284C7',
          'circle-opacity': 0.12,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#0284C7',
          'circle-stroke-opacity': 0.4,
        },
      });

      map.addLayer({
        id: 'env-swell-inner',
        type: 'circle',
        source: 'env-swell-source',
        layout: {
          visibility: activeLayers.waves ? 'visible' : 'none',
        },
        paint: {
          'circle-radius': 28,
          'circle-color': '#38BDF8',
          'circle-opacity': 0.18,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#0284C7',
          'circle-stroke-opacity': 0.6,
        },
      });

      // 3. SEVERE WEATHER HAZARDS
      const hazardsGeoJSON: any = {
        type: 'FeatureCollection',
        features: mockWeatherHazards.map((h) => ({
          type: 'Feature',
          id: h.id,
          properties: {
            id: h.id,
            name: h.name,
            severity: h.severity,
            type: h.type,
            location: h.location,
            windSpeedKnots: h.maxWindSpeedKnots,
            waveHeightMeters: h.significantWaveHeightMeters,
            routeDelayDays: h.freightImpact.routeDelayDays,
            reroutingRisk: h.freightImpact.reroutingRisk,
          },
          geometry: {
            type: 'Point',
            coordinates: [h.coordinates[1], h.coordinates[0]],
          },
        })),
      };

      map.addSource('env-hazards-source', {
        type: 'geojson',
        data: hazardsGeoJSON,
      });

      // Hazard Warning Perimeter
      map.addLayer({
        id: 'env-hazard-perimeter',
        type: 'circle',
        source: 'env-hazards-source',
        layout: {
          visibility: activeLayers.storms ? 'visible' : 'none',
        },
        paint: {
          'circle-radius': [
            'match',
            ['get', 'severity'],
            'Severe', 40,
            'High', 30,
            22,
          ],
          'circle-color': [
            'match',
            ['get', 'severity'],
            'Severe', '#DC2626',
            'High', '#EA580C',
            '#D97706',
          ],
          'circle-opacity': 0.22,
        },
      });

      // Hazard Center Marker
      map.addLayer({
        id: 'env-hazard-center',
        type: 'circle',
        source: 'env-hazards-source',
        layout: {
          visibility: activeLayers.storms ? 'visible' : 'none',
        },
        paint: {
          'circle-radius': 9,
          'circle-color': [
            'match',
            ['get', 'severity'],
            'Severe', '#DC2626',
            'High', '#EA580C',
            '#D97706',
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FFFFFF',
        },
      });

      // Interactive tooltips & clicks
      map.on('mouseenter', 'env-hazard-center', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        if (e.features && e.features[0]) {
          const h = e.features[0].properties as any;
          const coords = (e.features[0].geometry as any).coordinates;
          popupRef.current
            ?.setLngLat(coords)
            .setHTML(
              `<div style="font-family:sans-serif; padding:4px; color:#0F172A; min-width:180px;">
                <div style="font-size:12px; font-weight:700; color:#DC2626;">⚠️ ${h.name}</div>
                <div style="font-size:11px; color:#334155; font-weight:600; margin-top:2px;">Severity: ${h.severity} • ${h.type}</div>
                <div style="font-size:10px; color:#475569; margin-top:2px;">Waves: <strong>${h.waveHeightMeters}m</strong> • Winds: <strong>${h.windSpeedKnots} kts</strong></div>
                <div style="font-size:10px; color:#64748B; margin-top:2px;">Delay Impact: +${h.routeDelayDays} Days (Detour Risk: ${h.reroutingRisk})</div>
              </div>`
            )
            .addTo(map);
        }
      });

      map.on('mouseleave', 'env-hazard-center', () => {
        map.getCanvas().style.cursor = '';
        popupRef.current?.remove();
      });

      map.on('click', 'env-hazard-center', (e) => {
        if (e.features && e.features[0]) {
          const hid = e.features[0].properties?.id;
          const found = mockWeatherHazards.find((h) => h.id === hid);
          if (found) onSelectHazard(found);
        }
      });
    });

    map.on('error', (e: any) => {
      const msg = e?.error?.message || (typeof e?.message === 'string' ? e.message : '');
      if (msg.includes('access token') || msg.includes('Unauthorized') || msg.includes('Forbidden')) {
        setMapStatus('unavailable');
        setStatusDetail('Map Service Configuration Required');
      }
    });

    return () => {
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Layer visibility updates
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    const setVisibility = (layerId: string, visible: boolean) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
      }
    };

    setVisibility('env-hazard-perimeter', activeLayers.storms);
    setVisibility('env-hazard-center', activeLayers.storms);
    setVisibility('env-swell-outer', activeLayers.waves);
    setVisibility('env-swell-inner', activeLayers.waves);
  }, [activeLayers, mapLoaded]);

  // Highlight or fly to selected hazard
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !selectedHazardId) return;
    const hazard = mockWeatherHazards.find((h) => h.id === selectedHazardId);
    if (hazard) {
      mapRef.current.flyTo({
        center: [hazard.coordinates[1], hazard.coordinates[0]],
        zoom: 3.8,
        essential: true,
      });
    }
  }, [selectedHazardId, mapLoaded]);

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleReset = () => {
    mapRef.current?.flyTo({
      center: [55, 25],
      zoom: 2,
      essential: true,
    });
  };

  const legendItems = [
    { color: '#DC2626', label: 'Cyclone Warning (>8m Waves)', shape: 'circle' as const },
    { color: '#EA580C', label: 'Gale Force Swell (>4m Waves)', shape: 'circle' as const },
    { color: '#D97706', label: 'Monsoon Swell Surge', shape: 'circle' as const },
    { color: '#0284C7', label: 'Corridor Route Exposure', shape: 'line' as const },
  ];

  return (
    <div
      className={`relative w-full ${height} rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/90 shadow-md select-none group`}
    >
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Controls top-right */}
      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
      />

      {/* Reusable Light Legend with dark high-contrast text */}
      <MapLegend items={legendItems} />

      {/* Status badge bottom-right */}
      <MapStatusBadge status={mapStatus} detail={statusDetail} />
    </div>
  );
};
