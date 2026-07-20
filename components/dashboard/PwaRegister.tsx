'use client';

import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (reg) => console.log('Service Worker registered with scope:', reg.scope),
          (err) => console.error('Service Worker registration failed:', err)
        );
      });
    }
  }, []);

  return null;
}
