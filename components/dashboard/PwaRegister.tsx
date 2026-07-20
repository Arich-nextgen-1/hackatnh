'use client';

import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialize geolocation retrieval
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            isReal: true,
            label: 'Ваше местоположение'
          };
          localStorage.setItem('user_coords', JSON.stringify(coords));
          window.dispatchEvent(new Event('user_coords_updated'));
          console.log('[PWA] Geolocation initialized successfully:', coords);
        },
        (err) => {
          console.warn('[Geolocation] Denied or error, using fallback:', err.message);
          const fallback = {
            lat: 42.3417,
            lng: 69.5901,
            isReal: false,
            label: 'Шымкент, мкр Север 66/2'
          };
          localStorage.setItem('user_coords', JSON.stringify(fallback));
          window.dispatchEvent(new Event('user_coords_updated'));
        },
        {
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 60 * 1000 // 1 minute
        }
      );
    } else {
      console.warn('[Geolocation] Not supported by browser, using fallback.');
      const fallback = {
        lat: 42.3417,
        lng: 69.5901,
        isReal: false,
        label: 'Шымкент, мкр Север 66/2'
      };
      localStorage.setItem('user_coords', JSON.stringify(fallback));
      window.dispatchEvent(new Event('user_coords_updated'));
    }

    if (!('serviceWorker' in navigator)) return;

    // Register immediately — don't wait for 'load' event (Next.js already handles load)
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('[PWA] SW registered, scope:', reg.scope);

        // Force update check on every app load
        reg.update();

        // When a new SW is waiting, activate it immediately
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content available — activate immediately
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });
      })
      .catch((err) => console.error('[PWA] SW registration failed:', err));

    // Reload page when new SW takes control
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[PWA] New SW controller — reloading');
    });
  }, []);

  return null;
}
