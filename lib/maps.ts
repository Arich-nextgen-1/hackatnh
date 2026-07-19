// Fixed departure point: Shymkent IT Hub, мкр. Север 66/2
export const IT_HUB = { lat: 42.3417, lng: 69.5901 };

/**
 * Build a 2GIS route URL from IT Hub to a destination.
 */
export function build2GISUrl(destLat: number, destLng: number): string {
  return `https://2gis.kz/shymkent/routeSearch/rsType/car/from/${IT_HUB.lng},${IT_HUB.lat}/to/${destLng},${destLat}`;
}

/**
 * Haversine distance in km from IT Hub to a given coordinate.
 */
export function getDistanceFromHub(lat: number, lng: number): number {
  const R = 6371;
  const dLat = (lat - IT_HUB.lat) * (Math.PI / 180);
  const dLng = (lng - IT_HUB.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(IT_HUB.lat * (Math.PI / 180)) *
      Math.cos(lat * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
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
 * Estimate travel time in minutes from IT Hub based on distance.
 */
export function getTravelTimeFromHub(lat: number, lng: number): number {
  const dist = getDistanceFromHub(lat, lng);
  // Estimate ~1.8 minutes per km + 4 minutes traffic/stoplight overhead
  return Math.max(5, Math.round(dist * 1.8 + 4));
}

