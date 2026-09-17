'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { TradeFlowItem } from '@/types';
import { mockTradeFlows } from '@/data/tradeFlowData';
import {
  initializeMapboxAuth,
  getBasemapStyle,
  MAP_DEFAULTS,
} from './mapConfig';
import { MapControls } from './MapControls';
import { MapLegend } from './MapLegend';
import { MapStatusBadge, MapLoadStatus } from './MapStatusBadge';

interface TradeFlowMapProps {
  selectedFlowId?: string;
  onSelectFlow: (flow: TradeFlowItem) => void;
  height?: string;
}

// Generate smooth curved geographic arc between from, mid, to
function generateArcCoordinates(
  from: [number, number],
  mid: [number, number],
  to: [number, number],
  steps = 32
): [number, number][] {
  const coords: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Quadratic bezier in geographic space
    const lat = (1 - t) * (1 - t) * from[0] + 2 * (1 - t) * t * mid[0] + t * t * to[0];
    let lng = (1 - t) * (1 - t) * from[1] + 2 * (1 - t) * t * mid[1] + t * t * to[1];
    // Normalize longitude wrapping
    if (lng > 180) lng -= 360;
    if (lng < -180) lng += 360;
    coords.push([lng, lat]);
  }
  return coords;
}

export const TradeFlowMap: React.FC<TradeFlowMapProps> = ({
  selectedFlowId,
  onSelectFlow,
  height = 'h-[520px]',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapStatus, setMapStatus] = useState<MapLoadStatus>('loading');
  const [statusDetail, setStatusDetail] = useState('Loading trade flow network...');
  const [hoveredFlow, setHoveredFlow] = useState<TradeFlowItem | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const hasValidToken = initializeMapboxAuth();
    const mapStyle = getBasemapStyle(hasValidToken);

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [20, 25],
      zoom: 1.8,
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

      // 1. TRADE FLOW ARCS GEOJSON
      const flowsFeatures = mockTradeFlows.map((flow) => {
        const coords = generateArcCoordinates(
          flow.flowCoords.from,
          flow.flowCoords.mid,
          flow.flowCoords.to
        );
        const strokeWidth = Math.max(3, Math.min(10, (flow.annualTeuVolume / 22800000) * 8 + 2));
        return {
          type: 'Feature',
          id: flow.id,
          properties: {
            id: flow.id,
            corridor: flow.corridor,
            annualTeuVolume: flow.annualTeuVolume,
            monthlyGrowthPercent: flow.monthlyGrowthPercent,
            freightRateAverage: flow.freightRateAverage,
            strokeWidth,
          },
          geometry: {
            type: 'LineString',
            coordinates: coords,
          },
        };
      });

      map.addSource('trade-flows-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: flowsFeatures as any,
        },
      });

      // Flow glow layer
      map.addLayer({
        id: 'trade-flows-glow',
        type: 'line',
        source: 'trade-flows-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#0284C7',
          'line-width': ['get', 'strokeWidth'],
          'line-opacity': 0.25,
        },
      });

      // Flow core line
      map.addLayer({
        id: 'trade-flows-line',
        type: 'line',
        source: 'trade-flows-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#0369A1',
          'line-width': [
            'case',
            ['==', ['get', 'id'], selectedFlowId || ''],
            ['+', ['get', 'strokeWidth'], 3],
            ['get', 'strokeWidth'],
          ],
          'line-opacity': 0.85,
        },
      });

      // Fat hit layer for hover/click
      map.addLayer({
        id: 'trade-flows-hit',
        type: 'line',
        source: 'trade-flows-source',
        paint: {
          'line-color': '#000000',
          'line-width': 22,
          'line-opacity': 0.001,
        },
      });

      // 2. NODES (Origin Export Gateways & Destination Ingestion Ports)
      const nodesFeatures: any[] = [];
      mockTradeFlows.forEach((flow) => {
        nodesFeatures.push({
          type: 'Feature',
          properties: {
            flowId: flow.id,
            role: 'origin',
            label: `${flow.originRegion} (Export Hub)`,
          },
          geometry: {
            type: 'Point',
            coordinates: [flow.flowCoords.from[1], flow.flowCoords.from[0]],
          },
        });
        nodesFeatures.push({
          type: 'Feature',
          properties: {
            flowId: flow.id,
            role: 'destination',
            label: `${flow.destinationRegion} (Ingestion Gateway)`,
          },
          geometry: {
            type: 'Point',
            coordinates: [flow.flowCoords.to[1], flow.flowCoords.to[0]],
          },
        });
      });

      map.addSource('trade-nodes-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: nodesFeatures,
        },
      });

      map.addLayer({
        id: 'trade-nodes-circle',
        type: 'circle',
        source: 'trade-nodes-source',
        paint: {
          'circle-radius': 6.5,
          'circle-color': [
            'match',
            ['get', 'role'],
            'origin', '#0284C7',
            'destination', '#059669',
            '#0284C7',
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FFFFFF',
        },
      });

      // INTERACTIVE LISTENERS
      map.on('mouseenter', 'trade-flows-hit', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        if (e.features && e.features[0]) {
          const fid = e.features[0].properties?.id;
          const found = mockTradeFlows.find((f) => f.id === fid);
          if (found) setHoveredFlow(found);
        }
      });

      map.on('mouseleave', 'trade-flows-hit', () => {
        map.getCanvas().style.cursor = '';
        setHoveredFlow(null);
      });

      map.on('click', 'trade-flows-hit', (e) => {
        if (e.features && e.features[0]) {
          const fid = e.features[0].properties?.id;
          const found = mockTradeFlows.find((f) => f.id === fid);
          if (found) onSelectFlow(found);
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

  // Update selected flow highlighting
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;
    if (map.getLayer('trade-flows-line')) {
      map.setPaintProperty('trade-flows-line', 'line-color', [
        'case',
        ['==', ['get', 'id'], selectedFlowId || ''],
        '#0284C7',
        '#0369A1',
      ]);
    }
  }, [selectedFlowId, mapLoaded]);

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleReset = () => {
    mapRef.current?.flyTo({
      center: [20, 25],
      zoom: 1.8,
      essential: true,
    });
  };

  const legendItems = [
    { color: '#0369A1', label: 'Line Thickness = Cargo Volume (TEU)', shape: 'line' as const },
    { color: '#0284C7', label: 'Export Origin Hub', shape: 'circle' as const },
    { color: '#059669', label: 'Import Destination Gateway', shape: 'circle' as const },
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

      {/* Floating Hover Card top-left */}
      {hoveredFlow && (
        <div className="absolute top-4 left-4 z-20 glass-card px-4 py-3 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-lg text-xs max-w-sm pointer-events-none animate-in fade-in">
          <p className="font-bold text-slate-900">{hoveredFlow.corridor}</p>
          <p className="text-[11px] text-slate-600 mt-1">
            Volume: <strong className="text-slate-900">{(hoveredFlow.annualTeuVolume / 1000000).toFixed(1)}M TEU / year</strong>
          </p>
          <p className="text-[11px] text-slate-600">
            Growth: <strong className="text-emerald-700">+{hoveredFlow.monthlyGrowthPercent}% MoM</strong>
          </p>
          <p className="text-[11px] text-sky-800 font-semibold mt-1">
            Avg Freight Rate: ${hoveredFlow.freightRateAverage}/FEU
          </p>
        </div>
      )}

      {/* Reusable Light Legend with dark high-contrast text */}
      <MapLegend items={legendItems} />

      {/* Status badge bottom-right */}
      <MapStatusBadge status={mapStatus} detail={statusDetail} />
    </div>
  );
};
