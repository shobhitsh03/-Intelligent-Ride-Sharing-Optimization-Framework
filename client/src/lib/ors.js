import axios from 'axios';

const ORS_BASE = 'https://api.openrouteservice.org/v2/directions/driving-car';
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

export async function getRouteAndEta({ start, end }) {
  const apiKey = import.meta.env.VITE_ORS_API_KEY;
  if (!apiKey) throw new Error('Missing ORS key');
  // Use GET with GeoJSON for highest fidelity and simplicity
  const params = new URLSearchParams({
    api_key: apiKey,
    start: `${start[0]},${start[1]}`,
    end: `${end[0]},${end[1]}`,
    instructions: 'false',
    geometry_format: 'geojson',
    geometry_simplify: 'false',
    preference: 'fastest',
    units: 'm',
  });
  const url = `${ORS_BASE}?${params.toString()}`;
  const { data } = await axios.get(url);
  const first = data?.features?.[0];
  const secs = first?.properties?.summary?.duration || 0;
  const meters = first?.properties?.summary?.distance || 0;
  const coords = Array.isArray(first?.geometry?.coordinates)
    ? first.geometry.coordinates.map(([lng, lat]) => [lat, lng])
    : [];
  // Fallback to OSRM if we didn't get a usable linestring
  if (!coords || coords.length < 3) {
    try {
      const osrmUrl = `${OSRM_BASE}/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`;
      const osrm = await axios.get(osrmUrl);
      const line = osrm?.data?.routes?.[0]?.geometry?.coordinates || [];
      const osrmCoords = line.map(([lng, lat]) => [lat, lng]);
      if (osrmCoords.length > 1) {
        return {
          seconds: secs,
          meters,
          minutes: Math.round(secs / 60),
          km: +(meters / 1000).toFixed(1),
          coords: osrmCoords,
        };
      }
    } catch {}
  }
  return {
    seconds: secs,
    meters,
    minutes: Math.round(secs / 60),
    km: +(meters / 1000).toFixed(1),
    coords,
  };
}
