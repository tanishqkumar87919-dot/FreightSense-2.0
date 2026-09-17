'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { RouteItem } from '@/types';
import {
  initializeMapboxAuth,
  getBasemapStyle,
} from './mapConfig';
import { MapControls } from './MapControls';
import { MapLegend } from './MapLegend';
import { MapStatusBadge, MapLoadStatus } from './MapStatusBadge';

interface RouteMapProps {
  route: RouteItem;
  height?: string;
}

export const RouteMap: React.FC<RouteMapProps> = ({ route, height = 'h-[460px]' }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapStatus, setMapStatus] = useState<MapLoadStatus>('loading');
  const [statusDetail, setStatusDetail] = useState('Loading route corridor...');

  const waypoints = route.coordinates.waypoints || [];
  const originCoord = route.coordinates.origin;
  const destCoord = route.coordinates.destination;

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const hasValidToken = initializeMapboxAuth();
    const mapStyle = getBasemapStyle(hasValidToken);

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [waypoints[0]?.[1] || 60, waypoints[0]?.[0] || 20],
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

      // 1. ROUTE LINESTRING SOURCE
      const lineCoords = waypoints.map((wp) => [wp[1], wp[0]]);
      map.addSource('active-route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {
            name: route.name,
            spotRateUsd: route.spotRateUsd,
            transitDays: route.transitDays,
          },
          geometry: {
            type: 'LineString',
            coordinates: lineCoords,
          },
        },
      });

      // Glow layer
      map.addLayer({
        id: 'active-route-glow',
        type: 'line',
        source: 'active-route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#0284C7',
          'line-width': 6,
          'line-opacity': 0.25,
        },
      });

      // Sharp corridor line
      map.addLayer({
        id: 'active-route-line',
        type: 'line',
        source: 'active-route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#0369A1',
          'line-width': 3,
          'line-dasharray': [4, 2],
        },
      });

      // 2. ORIGIN, DESTINATION & VESSEL STATIONS
      const midPointIdx = Math.floor(waypoints.length / 2);
      const midPoint = waypoints[midPointIdx] || originCoord;

      const endpointsGeoJSON: any = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              role: 'origin',
              name: `${route.origin} (${route.originCountry})`,
              label: 'Origin Gateway',
            },
            geometry: {
              type: 'Point',
              coordinates: [originCoord[1], originCoord[0]],
            },
          },
          {
            type: 'Feature',
            properties: {
              role: 'destination',
              name: `${route.destination} (${route.destinationCountry})`,
              label: 'Destination Gateway',
            },
            geometry: {
              type: 'Point',
              coordinates: [destCoord[1], destCoord[0]],
            },
          },
          {
            type: 'Feature',
            properties: {
              role: 'vessel',
              name: `${route.name} - Fleet Track`,
              label: `${route.activeVesselsCount} Vessels En Route`,
            },
            geometry: {
              type: 'Point',
              coordinates: [midPoint[1], midPoint[0]],
            },
          },
        ],
      };

      map.addSource('route-endpoints', {
        type: 'geojson',
        data: endpointsGeoJSON,
      });

      // Circle layers for origin, destination, vessel
      map.addLayer({
        id: 'route-endpoints-circle',
        type: 'circle',
        source: 'route-endpoints',
        paint: {
          'circle-radius': [
            'match',
            ['get', 'role'],
            'origin', 8,
            'destination', 8,
            6,
          ],
          'circle-color': [
            'match',
            ['get', 'role'],
            'origin', '#0284C7',
            'destination', '#059669',
            '#059669',
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FFFFFF',
        },
      });

      // Fit bounds to entire route corridor
      const bounds = new mapboxgl.LngLatBounds();
      waypoints.forEach((wp) => bounds.extend([wp[1], wp[0]]));
      bounds.extend([originCoord[1], originCoord[0]]);
      bounds.extend([destCoord[1], destCoord[0]]);
      map.fitBounds(bounds, {
        padding: { top: 70, bottom: 70, left: 70, right: 70 },
        maxZoom: 6,
        duration: 1000,
      });

      // Interactive tooltips
      map.on('mouseenter', 'route-endpoints-circle', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        if (e.features && e.features[0]) {
          const p = e.features[0].properties as any;
          const coords = (e.features[0].geometry as any).coordinates;
          popupRef.current
            ?.setLngLat(coords)
            .setHTML(
              `<div style="font-family:sans-serif; padding:4px; color:#0F172A; min-width:140px;">
                <div style="font-size:12px; font-weight:700; color:#0F172A;">${p.name}</div>
                <div style="font-size:11px; color:#475569; margin-top:2px;">${p.label}</div>
              </div>`
            )
            .addTo(map);
        }
      });
      map.on('mouseleave', 'route-endpoints-circle', () => {
        map.getCanvas().style.cursor = '';
        popupRef.current?.remove();
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
  }, [route]);

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleReset = () => {
    if (!mapRef.current) return;
    const bounds = new mapboxgl.LngLatBounds();
    waypoints.forEach((wp) => bounds.extend([wp[1], wp[0]]));
    bounds.extend([originCoord[1], originCoord[0]]);
    bounds.extend([destCoord[1], destCoord[0]]);
    mapRef.current.fitBounds(bounds, {
      padding: { top: 70, bottom: 70, left: 70, right: 70 },
      maxZoom: 6,
      duration: 800,
    });
  };

  const legendItems = [
    { color: '#0369A1', label: 'Corridor Track', shape: 'line' as const },
    { color: '#0284C7', label: `Origin: ${route.origin}`, shape: 'circle' as const },
    { color: '#059669', label: `Destination: ${route.destination}`, shape: 'circle' as const },
    { color: '#059669', label: 'Active Vessels', shape: 'circle' as const },
  ];

  return (
    <div
      className={`relative w-full ${height} rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/90 shadow-md select-none group`}
    >
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating HUD info top-left */}
      <div className="absolute top-4 left-4 z-20 glass-card px-4 py-2.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md">
        <p className="font-bold text-xs text-slate-900">{route.name}</p>
        <p className="text-slate-600 text-[11px] mt-0.5">
          {route.distanceNm.toLocaleString()} Nautical Miles • Avg Transit: {route.transitDays} Days
        </p>
      </div>

      {/* Controls top-right */}
      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
      />

      {/* Legend bottom-left with dark high-contrast text */}
      <MapLegend items={legendItems} />

      {/* Floating telemetry bottom-right */}
      <div className="absolute bottom-4 right-4 z-20 hidden sm:flex items-center gap-3 px-3.5 py-2 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/90 text-slate-800 text-[11px] font-medium shadow-md">
        <span>Active Lane Vessels: <strong className="text-sky-700">{route.activeVesselsCount}</strong></span>
        <span>•</span>
        <span>Capacity: <strong className="text-emerald-700">{route.capacityUtilization}%</strong></span>
      </div>
    </div>
  );
};
