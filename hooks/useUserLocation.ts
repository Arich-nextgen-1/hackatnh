'use client';

import { useState, useEffect, useCallback } from 'react';

// Fallback: Шымкент, мкр Север 66/2
export const FALLBACK_ORIGIN = { lat: 42.3417, lng: 69.5901, label: 'Шымкент, мкр Север 66/2' };

export type UserLocation = {
  lat: number;
  lng: number;
  label: string;
  isReal: boolean; // true = GPS, false = fallback
};

/**
 * Hook that returns the user's current GPS location, or the fallback address.
 * Requests geolocation once on mount. Updates state when location resolves.
 */
export function useUserLocation(): {
  location: UserLocation;
  loading: boolean;
  error: string | null;
  retry: () => void;
} {
  const [location, setLocation] = useState<UserLocation>({
    ...FALLBACK_ORIGIN,
    isReal: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setLoading(false);
      setError('Геолокация недоступна в браузере');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: 'Ваше местоположение',
          isReal: true,
        });
        setLoading(false);
      },
      (err) => {
        console.warn('[Geolocation] Denied or error, using fallback:', err.message);
        setLocation({ ...FALLBACK_ORIGIN, isReal: false });
        setError(err.code === 1 ? 'Геолокация отклонена' : 'Ошибка геолокации');
        setLoading(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 60 * 1000, // 1 min cache
      }
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return { location, loading, error, retry: requestLocation };
}

/**
 * Build a Google Maps driving route URL from user's location (or fallback) to destination.
 */
export function buildGoogleMapsRouteUrl(
  origin: { lat: number; lng: number },
  destLat: number,
  destLng: number
): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destLat},${destLng}&travelmode=driving`;
}
