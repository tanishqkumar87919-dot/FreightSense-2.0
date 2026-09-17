import mapboxgl from 'mapbox-gl';

/**
 * Checks if the Mapbox public token is set and appears valid
 */
export function getMapboxToken(): { token: string; hasValidToken: boolean } {
  const token = (process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '').trim();
  const hasValidToken =
    token.length > 20 &&
    token.startsWith('pk.') &&
    !token.includes('your-mapbox') &&
    !token.includes('placeholder');
  return { token, hasValidToken };
}

/**
 * Configure Mapbox GL instance with appropriate token or open raster fallback
 */
export function initializeMapboxAuth(): boolean {
  const { token, hasValidToken } = getMapboxToken();
  if (hasValidToken) {
    mapboxgl.accessToken = token;
    return true;
  }

  // Prevent Mapbox GL v3 from aborting open raster tiles when running in local dev without public token
  if (typeof window !== 'undefined' && mapboxgl?.Map?.prototype) {
    (mapboxgl.Map.prototype as any)._authenticate = function () {};
    (mapboxgl.Map.prototype as any)._revokeAuth = function () {};
  }
  return false;
}

/**
 * Enterprise Light GIS Raster Basemap Style (ESRI World Light Gray Canvas + Reference Labels)
 * Displays light gray landmasses, clean white ocean waters, subtle country boundaries, and crisp labels.
 */
export const LIGHT_RASTER_MAP_STYLE: any = {
  version: 8,
  sources: {
    'esri-light-base': {
      type: 'raster',
      tiles: [
        'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: '&copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors',
    },
    'esri-light-labels': {
      type: 'raster',
      tiles: [
        'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: '&copy; Esri',
    },
  },
  layers: [
    {
      id: 'esri-light-base-layer',
      type: 'raster',
      source: 'esri-light-base',
      minzoom: 0,
      maxzoom: 16,
    },
    {
      id: 'esri-light-labels-layer',
      type: 'raster',
      source: 'esri-light-labels',
      minzoom: 0,
      maxzoom: 16,
    },
  ],
};

/**
 * Primary Light Vector Mapbox style
 */
export const LIGHT_VECTOR_MAP_STYLE = 'mapbox://styles/mapbox/light-v11';

/**
 * Resolves the appropriate basemap style based on token presence
 */
export function getBasemapStyle(hasValidToken: boolean): any {
  return hasValidToken ? LIGHT_VECTOR_MAP_STYLE : LIGHT_RASTER_MAP_STYLE;
}

export const MAP_DEFAULTS = {
  globalCenter: [40, 18] as [number, number],
  globalZoom: 1.7,
  minZoom: 1.1,
  maxZoom: 14,
  indiaCenter: [82.5, 16.5] as [number, number],
  indiaZoom: 5.2,
};
