// Fallback: Шымкент, микрорайон Терискей
export const FALLBACK_ORIGIN = { lat: 42.345126, lng: 69.643014 };

/**
 * Haversine distance in km between two coordinates.
 */
export function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

/**
 * Returns dynamic user coordinates from localStorage or fallback.
 */
export function getUserCoords(): { lat: number; lng: number } {
  if (typeof window !== 'undefined') {
    try {
      const stored = window.localStorage.getItem('user_coords');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
          return { lat: parsed.lat, lng: parsed.lng };
        }
      }
    } catch (e) {
      console.error('[maps] Error parsing user_coords:', e);
    }
  }
  return FALLBACK_ORIGIN;
}

/**
 * Calculate distance from dynamic user origin (Hub fallback) to target.
 */
export function getDistanceFromHub(lat: number, lng: number): number {
  const origin = getUserCoords();
  return getDistance(origin.lat, origin.lng, lat, lng);
}

/**
 * Build a Google Maps route URL from dynamic user origin to destination.
 * Prefer address string over coordinates for accurate local routing.
 */
export function buildGoogleMapsUrl(destLat: number, destLng: number, address?: string): string {
  const origin = getUserCoords();
  const destination = address
    ? encodeURIComponent(address)
    : `${destLat},${destLng}`;
  return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination}&travelmode=driving`;
}

/**
 * Returns a human-readable load label and color class.
 */
export function getLoadInfo(load: 'low' | 'medium' | 'high') {
  switch (load) {
    case 'low':
      return { label: 'Низкая загрузка', dot: '#22c55e', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' };
    case 'medium':
      return { label: 'Средняя загрузка', dot: '#f59e0b', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' };
    case 'high':
      return { label: 'Высокая загрузка', dot: '#ef4444', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
  }
}

/**
 * Determine if a clinic is open right now based on workingHours string.
 */
export function isOpenNow(workingHours: string): boolean {
  if (!workingHours) return false;
  const lower = workingHours.toLowerCase();
  if (lower.includes('круглосуточно') || lower.includes('24/7')) return true;
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const current = hours * 60 + minutes;

  // Parse "HH:MM — HH:MM" or "HH:MM-HH:MM"
  const match = workingHours.match(/(\d{1,2}):(\d{2})\s*[—\-]\s*(\d{1,2}):(\d{2})/);
  if (!match) return true; // default open if unparseable
  const openMin = parseInt(match[1]) * 60 + parseInt(match[2]);
  const closeMin = parseInt(match[3]) * 60 + parseInt(match[4]);
  return current >= openMin && current < closeMin;
}

/**
 * Estimate travel time in minutes based on distance.
 */
export function getTravelTime(originLat: number, originLng: number, destLat: number, destLng: number): number {
  const dist = getDistance(originLat, originLng, destLat, destLng);
  // Estimate ~1.8 minutes per km + 4 minutes traffic/stoplight overhead
  return Math.max(5, Math.round(dist * 1.8 + 4));
}
