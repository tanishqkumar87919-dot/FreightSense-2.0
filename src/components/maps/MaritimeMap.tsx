'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { RouteItem, PortItem, VesselItem, WeatherHazard } from '@/types';
import { mockRoutes } from '@/data/routeData';
import { mockPorts } from '@/data/portData';
import { mockVessels } from '@/data/vesselData';
import { mockWeatherHazards } from '@/data/weatherData';
import {
  getMapboxToken,
  initializeMapboxAuth,
  getBasemapStyle,
  MAP_DEFAULTS,
} from './mapConfig';
import { MapControls } from './MapControls';
import { MapLegend } from './MapLegend';
import { MapStatusBadge, MapLoadStatus } from './MapStatusBadge';

interface MaritimeMapProps {
  onSelectRoute?: (route: RouteItem) => void;
  onSelectPort?: (port: PortItem) => void;
  onSelectVessel?: (vessel: VesselItem) => void;
  onSelectHazard?: (hazard: WeatherHazard) => void;
  activeLayers?: {
    routes: boolean;
    ports: boolean;
    vessels: boolean;
    weather: boolean;
    congestion: boolean;
  };
  height?: string;
  selectedId?: string;
  onStatusChange?: (status: 'loading' | 'online' | 'unavailable', detail: string) => void;
}

export const MaritimeMap: React.FC<MaritimeMapProps> = ({
  onSelectRoute,
  onSelectPort,
  onSelectVessel,
  onSelectHazard,
  onStatusChange,
  activeLayers = { routes: true, ports: true, vessels: true, weather: true, congestion: true },
  height = 'h-[580px]',
  selectedId,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapStatus, setMapStatus] = useState<MapLoadStatus>('loading');
  const [statusDetail, setStatusDetail] = useState('Loading geographic basemap...');

  const updateStatus = (status: MapLoadStatus, detail: string) => {
    setMapStatus(status);
    setStatusDetail(detail);
    if (status === 'configured') {
      onStatusChange?.('online', detail);
    } else {
      onStatusChange?.(status as any, detail);
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const hasValidToken = initializeMapboxAuth();
    const mapStyle = getBasemapStyle(hasValidToken);

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: MAP_DEFAULTS.globalCenter,
      zoom: MAP_DEFAULTS.globalZoom,
      minZoom: MAP_DEFAULTS.minZoom,
      maxZoom: MAP_DEFAULTS.maxZoom,
      attributionControl: false,
    });

    mapRef.current = map;
    if (typeof window !== 'undefined') {
      (window as any).fsMap = map;
    }

    popupRef.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 12,
      className: 'fs-light-popup',
    });

    map.on('load', () => {
      setMapLoaded(true);
      updateStatus(
        'online',
        hasValidToken ? 'Mapbox GL Vector • Online' : 'Mapbox GL Light Basemap • Online'
      );

      // 1. SHIPPING ROUTES GEOJSON LAYER
      const routesGeoJSON: any = {
        type: 'FeatureCollection',
        features: mockRoutes.map((route) => ({
          type: 'Feature',
          id: route.id,
          properties: {
            id: route.id,
            name: route.name,
            corridor: route.corridor,
            spotRateUsd: route.spotRateUsd,
            riskScore: route.riskScore,
            transitDays: route.transitDays,
            capacityUtilization: route.capacityUtilization,
          },
          geometry: {
            type: 'LineString',
            coordinates: route.coordinates.waypoints.map((wp) => [wp[1], wp[0]]),
          },
        })),
      };

      map.addSource('shipping-routes', {
        type: 'geojson',
        data: routesGeoJSON,
      });

      // Route glow (subtle cyan/sky glow on light ocean)
      map.addLayer({
        id: 'routes-glow',
        type: 'line',
        source: 'shipping-routes',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          visibility: activeLayers.routes ? 'visible' : 'none',
        },
        paint: {
          'line-color': '#0284C7',
          'line-width': 5,
          'line-opacity': 0.25,
        },
      });

      // Sharp primary maritime route line (deep cobalt)
      map.addLayer({
        id: 'routes-line',
        type: 'line',
        source: 'shipping-routes',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          visibility: activeLayers.routes ? 'visible' : 'none',
        },
        paint: {
          'line-color': '#0369A1',
          'line-width': 2.5,
          'line-dasharray': [4, 2],
        },
      });

      // Invisible fat hit area for easy hover/click
      map.addLayer({
        id: 'routes-hit',
        type: 'line',
        source: 'shipping-routes',
        layout: {
          visibility: activeLayers.routes ? 'visible' : 'none',
        },
        paint: {
          'line-color': '#000000',
          'line-width': 18,
          'line-opacity': 0.001,
        },
      });

      // 2. MAJOR PORTS GEOJSON LAYER (Global Gateways + Indian Major Ports)
      const portsGeoJSON: any = {
        type: 'FeatureCollection',
        features: mockPorts.map((port) => ({
          type: 'Feature',
          id: port.id,
          properties: {
            id: port.id,
            name: port.name,
            code: port.code,
            country: port.country,
            congestionIndex: port.congestionIndex,
            averageDwellDays: port.averageDwellDays,
            annualThroughputMTeu: port.annualThroughputMTeu,
            delayRisk: port.delayRisk,
            isIndianPort: port.country === 'India',
          },
          geometry: {
            type: 'Point',
            coordinates: [port.coordinates[1], port.coordinates[0]],
          },
        })),
      };

      map.addSource('major-ports', {
        type: 'geojson',
        data: portsGeoJSON,
      });

      // Congestion ring
      map.addLayer({
        id: 'ports-congestion-ring',
        type: 'circle',
        source: 'major-ports',
        layout: {
          visibility: activeLayers.congestion ? 'visible' : 'none',
        },
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'congestionIndex'],
            30, 12,
            60, 20,
            85, 30,
          ],
          'circle-color': [
            'case',
            ['>', ['get', 'congestionIndex'], 70],
            '#EF4444',
            ['>', ['get', 'congestionIndex'], 45],
            '#F59E0B',
            '#0284C7',
          ],
          'circle-opacity': 0.2,
        },
      });

      // Crisp port markers
      map.addLayer({
        id: 'ports-circle',
        type: 'circle',
        source: 'major-ports',
        layout: {
          visibility: activeLayers.ports ? 'visible' : 'none',
        },
        paint: {
          'circle-radius': [
            'case',
            ['==', ['get', 'isIndianPort'], true],
            7.5,
            6.5,
          ],
          'circle-color': [
            'case',
            ['==', ['get', 'isIndianPort'], true],
            '#EA580C',
            '#0284C7',
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FFFFFF',
        },
      });

      // 3. VESSELS GEOJSON LAYER (Demonstration AIS Fleet Tracking)
      const vesselsGeoJSON: any = {
        type: 'FeatureCollection',
        features: mockVessels.map((vessel) => ({
          type: 'Feature',
          id: vessel.id,
          properties: {
            id: vessel.id,
            name: vessel.name,
            carrier: vessel.carrier,
            currentStatus: vessel.currentStatus,
            currentSpeedKnots: vessel.currentSpeedKnots,
            destinationPort: vessel.destinationPort,
            isSimulated: true,
          },
          geometry: {
            type: 'Point',
            coordinates: [vessel.coordinates[1], vessel.coordinates[0]],
          },
        })),
      };

      map.addSource('vessels-source', {
        type: 'geojson',
        data: vesselsGeoJSON,
      });

      map.addLayer({
        id: 'vessels-circle',
        type: 'circle',
        source: 'vessels-source',
        layout: {
          visibility: activeLayers.vessels ? 'visible' : 'none',
        },
        paint: {
          'circle-radius': 4.5,
          'circle-color': [
            'match',
            ['get', 'currentStatus'],
            'At Sea', '#059669',
            'Delayed', '#DC2626',
            '#D97706',
          ],
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#FFFFFF',
        },
      });

      // 4. WEATHER HAZARDS GEOJSON LAYER (Simulated Severe Weather Envelopes)
      const weatherGeoJSON: any = {
        type: 'FeatureCollection',
        features: mockWeatherHazards.map((h) => ({
          type: 'Feature',
          id: h.id,
          properties: {
            id: h.id,
            name: h.name,
            severity: h.severity,
            hazardType: h.type,
            windSpeedKnots: h.maxWindSpeedKnots,
            waveHeightMeters: h.significantWaveHeightMeters,
            isSimulated: true,
          },
          geometry: {
            type: 'Point',
            coordinates: [h.coordinates[1], h.coordinates[0]],
          },
        })),
      };

      map.addSource('weather-source', {
        type: 'geojson',
        data: weatherGeoJSON,
      });

      map.addLayer({
        id: 'weather-halo',
        type: 'circle',
        source: 'weather-source',
        layout: {
          visibility: activeLayers.weather ? 'visible' : 'none',
        },
        paint: {
          'circle-radius': 24,
          'circle-color': '#DC2626',
          'circle-opacity': 0.2,
        },
      });

      map.addLayer({
        id: 'weather-center',
        type: 'circle',
        source: 'weather-source',
        layout: {
          visibility: activeLayers.weather ? 'visible' : 'none',
        },
        paint: {
          'circle-radius': 7,
          'circle-color': '#DC2626',
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#FFFFFF',
        },
      });

      // INTERACTIVE LISTENERS & LIGHT TOOLTIPS
      map.on('mouseenter', 'ports-circle', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        if (e.features && e.features[0]) {
          const feat = e.features[0];
          const coords = (feat.geometry as any).coordinates.slice() as [number, number];
          const p = feat.properties as any;
          const badge = p.isIndianPort
            ? '<span style="color:#EA580C; font-weight:700;">🇮🇳 Indian Major Port</span>'
            : '<span style="color:#0284C7; font-weight:700;">Global Hub</span>';
          popupRef.current
            ?.setLngLat(coords)
            .setHTML(
              `<div style="font-family:sans-serif; padding:4px; color:#0F172A; min-width:160px;">
                <div style="font-size:12px; font-weight:700; color:#0F172A;">${p.name} (${p.code})</div>
                <div style="font-size:11px; color:#334155; margin-top:2px;">${badge} • Congestion: <strong>${p.congestionIndex}/100</strong></div>
                <div style="font-size:10px; color:#64748B; margin-top:2px;">Avg Dwell: ${p.averageDwellDays}d • Risk: ${p.delayRisk}</div>
              </div>`
            )
            .addTo(map);
        }
      });
      map.on('mouseleave', 'ports-circle', () => {
        map.getCanvas().style.cursor = '';
        popupRef.current?.remove();
      });
      map.on('click', 'ports-circle', (e) => {
        if (e.features && e.features[0]) {
          const portId = e.features[0].properties?.id;
          const found = mockPorts.find((p) => p.id === portId);
          if (found) onSelectPort?.(found);
        }
      });

      map.on('mouseenter', 'routes-hit', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        if (e.features && e.features[0]) {
          const r = e.features[0].properties as any;
          popupRef.current
            ?.setLngLat(e.lngLat)
            .setHTML(
              `<div style="font-family:sans-serif; padding:4px; color:#0F172A; min-width:180px;">
                <div style="font-size:12px; font-weight:700; color:#0F172A;">${r.name}</div>
                <div style="font-size:11px; color:#0369A1; font-weight:600; margin-top:2px;">Corridor: ${r.corridor}</div>
                <div style="font-size:10px; color:#475569; margin-top:2px;">Spot Rate: <strong>$${r.spotRateUsd}/FEU</strong> • Transit: ${r.transitDays}d</div>
              </div>`
            )
            .addTo(map);
        }
      });
      map.on('mouseleave', 'routes-hit', () => {
        map.getCanvas().style.cursor = '';
        popupRef.current?.remove();
      });
      map.on('click', 'routes-hit', (e) => {
        if (e.features && e.features[0]) {
          const routeId = e.features[0].properties?.id;
          const found = mockRoutes.find((r) => r.id === routeId);
          if (found) onSelectRoute?.(found);
        }
      });

      map.on('mouseenter', 'vessels-circle', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        if (e.features && e.features[0]) {
          const v = e.features[0].properties as any;
          popupRef.current
            ?.setLngLat(e.lngLat)
            .setHTML(
              `<div style="font-family:sans-serif; padding:4px; color:#0F172A; min-width:160px;">
                <div style="font-size:12px; font-weight:700; color:#0F172A;">${v.name} (${v.carrier})</div>
                <div style="font-size:11px; color:#059669; font-weight:600; margin-top:2px;">Status: ${v.currentStatus} • ${v.currentSpeedKnots} kts</div>
                <div style="font-size:10px; color:#64748B; margin-top:2px;">Destination: ${v.destinationPort} (Demo AIS)</div>
              </div>`
            )
            .addTo(map);
        }
      });
      map.on('mouseleave', 'vessels-circle', () => {
        map.getCanvas().style.cursor = '';
        popupRef.current?.remove();
      });
      map.on('click', 'vessels-circle', (e) => {
        if (e.features && e.features[0]) {
          const vid = e.features[0].properties?.id;
          const found = mockVessels.find((v) => v.id === vid);
          if (found) onSelectVessel?.(found);
        }
      });

      map.on('mouseenter', 'weather-center', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        if (e.features && e.features[0]) {
          const h = e.features[0].properties as any;
          popupRef.current
            ?.setLngLat(e.lngLat)
            .setHTML(
              `<div style="font-family:sans-serif; padding:4px; color:#0F172A; min-width:180px;">
                <div style="font-size:12px; font-weight:700; color:#DC2626;">⚠️ ${h.name}</div>
                <div style="font-size:11px; color:#B91C1C; font-weight:600; margin-top:2px;">Severity: ${h.severity} • ${h.hazardType}</div>
                <div style="font-size:10px; color:#475569; margin-top:2px;">Winds: ${h.windSpeedKnots} kts • Waves: ${h.waveHeightMeters}m (Simulated Advisory)</div>
              </div>`
            )
            .addTo(map);
        }
      });
      map.on('mouseleave', 'weather-center', () => {
        map.getCanvas().style.cursor = '';
        popupRef.current?.remove();
      });
      map.on('click', 'weather-center', (e) => {
        if (e.features && e.features[0]) {
          const hid = e.features[0].properties?.id;
          const found = mockWeatherHazards.find((w) => w.id === hid);
          if (found) onSelectHazard?.(found);
        }
      });
    });

    map.on('error', (e: any) => {
      const msg = e?.error?.message || (typeof e?.message === 'string' ? e.message : '');
      if (msg.includes('access token') || msg.includes('Unauthorized') || msg.includes('Forbidden')) {
        updateStatus('unavailable', 'Map Service Configuration Required');
      }
    });

    return () => {
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    const setVisibility = (layerId: string, visible: boolean) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
      }
    };

    setVisibility('routes-line', activeLayers.routes);
    setVisibility('routes-glow', activeLayers.routes);
    setVisibility('routes-hit', activeLayers.routes);

    setVisibility('ports-circle', activeLayers.ports);
    setVisibility('ports-congestion-ring', activeLayers.congestion);

    setVisibility('vessels-circle', activeLayers.vessels);

    setVisibility('weather-halo', activeLayers.weather);
    setVisibility('weather-center', activeLayers.weather);
  }, [activeLayers, mapLoaded]);

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleReset = () => {
    mapRef.current?.flyTo({
      center: MAP_DEFAULTS.globalCenter,
      zoom: MAP_DEFAULTS.globalZoom,
      pitch: 0,
      bearing: 0,
      essential: true,
    });
  };

  const handleFocusIndia = () => {
    mapRef.current?.flyTo({
      center: MAP_DEFAULTS.indiaCenter,
      zoom: MAP_DEFAULTS.indiaZoom,
      pitch: 20,
      essential: true,
    });
  };

  const legendItems = [
    { color: '#0369A1', label: 'Tradelane Waypoints', shape: 'line' as const },
    { color: '#EA580C', label: 'Indian Major Ports', shape: 'circle' as const },
    { color: '#0284C7', label: 'Global Gateways', shape: 'circle' as const },
    { color: '#059669', label: 'Vessels (Demo AIS)', shape: 'circle' as const },
    { color: '#DC2626', label: 'Weather Hazards', shape: 'circle' as const },
  ];

  return (
    <div
      className={`relative w-full ${height} rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/90 shadow-md select-none group`}
    >
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Reusable Light Controls */}
      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
        onFocusIndia={handleFocusIndia}
      />

      {/* Reusable Light Legend with Dark High-Contrast Text */}
      <MapLegend items={legendItems} />

      {/* Reusable Light Status Badge */}
      <MapStatusBadge status={mapStatus} detail={statusDetail} />
    </div>
  );
};
