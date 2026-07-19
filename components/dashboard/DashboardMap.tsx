'use client';

import { useEffect, useRef, useState } from 'react';

interface MapMarker {
  id: string;
  name: string;
  address: string;
  rating: number;
  lat: number;
  lng: number;
  type: 'public' | 'private' | 'rehab';
}

interface DashboardMapProps {
  center: [number, number];
  zoom?: number;
  markers: MapMarker[];
  activeMarkerId?: string | null;
  onSelectMarker?: (id: string) => void;
}

declare global {
  interface Window {
    L: any;
  }
}

export default function DashboardMap({
  center,
  zoom = 12,
  markers,
  activeMarkerId,
  onSelectMarker,
}: DashboardMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerInstancesRef = useRef<{ [id: string]: any }>({});
  const [loaded, setLoaded] = useState(false);

  // Load Leaflet from CDN
  useEffect(() => {
    if (window.L) {
      setLoaded(true);
      return;
    }

    // Stylesheet
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.id = 'leaflet-css';
    document.head.appendChild(link);

    // Script
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.id = 'leaflet-js';
    script.async = true;
    script.onload = () => {
      setLoaded(true);
    };
    document.head.appendChild(script);

    return () => {
      // Keep CDN script and CSS cached to avoid reloading,
      // but clean up map instances.
    };
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!loaded || !mapContainerRef.current) return;

    // Destroy existing map if any
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      markerInstancesRef.current = {};
    }

    const L = window.L;
    if (!L) return;

    // Create map instance
    const map = L.map(mapContainerRef.current).setView(center, zoom);
    mapRef.current = map;

    // Tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Update map size to fix grey rendering bugs
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 200);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerInstancesRef.current = {};
      }
    };
  }, [loaded]);

  // Update Markers
  useEffect(() => {
    if (!loaded || !mapRef.current) return;

    const L = window.L;
    if (!L) return;

    // Clear old markers
    Object.values(markerInstancesRef.current).forEach((marker: any) => {
      marker.remove();
    });
    markerInstancesRef.current = {};

    // Custom Icon Definitions
    const createCustomIcon = (color: string, isActive: boolean) => {
      const shadowColor = color === '#10B981' ? 'rgba(16, 185, 129, 0.6)' : color === '#06B6D4' ? 'rgba(6, 182, 212, 0.6)' : 'rgba(37, 99, 235, 0.6)';
      const pulseRing = isActive
        ? `<div style="position:absolute;top:50%;left:50%;width:28px;height:28px;border-radius:50%;background:${color};opacity:0.35;animation:pulse-ring 1.4s ease-out infinite;"></div>
           <div style="position:absolute;top:50%;left:50%;width:28px;height:28px;border-radius:50%;background:${color};opacity:0.2;animation:pulse-ring 1.4s ease-out 0.5s infinite;"></div>`
        : '';
      const dotStyle = isActive
        ? `width:18px;height:18px;border:3px solid white;box-shadow:0 0 12px ${shadowColor};animation:marker-bounce 0.9s infinite ease-in-out;z-index:1000;`
        : `width:12px;height:12px;border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);`;
      return L.divIcon({
        html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;">
                 ${pulseRing}
                 <div style="background-color:${color};border-radius:50%;${dotStyle}position:relative;z-index:2;"></div>
               </div>`,
        className: `custom-leaflet-marker ${isActive ? 'active-marker' : ''}`,
        iconSize: isActive ? [32, 32] : [16, 16],
        iconAnchor: isActive ? [16, 16] : [8, 8],
      });
    };

    markers.forEach((m) => {
      const isActive = m.id === activeMarkerId;
      const icon = createCustomIcon(m.type === 'rehab' ? '#06B6D4' : m.type === 'private' ? '#10B981' : '#2563EB', isActive);
      const marker = L.marker([m.lat, m.lng], { icon }).addTo(mapRef.current);

      // Popup HTML
      const isOpenStr = m.rating > 0 ? `<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#22c55e;margin-right:4px;"></span>Открыто` : '';
      const twoGisUrl = `https://2gis.kz/shymkent/routeSearch/rsType/car/from/69.5901,42.3417/to/${m.lng},${m.lat}`;
      const popupHtml = `
        <div style="padding:12px 14px;min-width:200px;">
          <h4 style="margin:0 0 4px;font-weight:700;color:#172033;font-size:13px;line-height:1.3;">${m.name}</h4>
          <p style="margin:0 0 8px;color:#64748B;font-size:11px;">${m.address}</p>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
            <span style="font-size:11px;font-weight:700;color:#f59e0b;">&#9733; ${m.rating}</span>
            <span style="font-size:10px;color:#22c55e;font-weight:600;"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#22c55e;margin-right:3px;vertical-align:middle;"></span>Открыто</span>
          </div>
          <a href="${twoGisUrl}" target="_blank" rel="noreferrer"
            style="display:flex;align-items:center;justify-content:center;gap:5px;width:100%;padding:6px 0;background:#2563EB;color:white;border-radius:8px;font-size:11px;font-weight:600;text-decoration:none;">
            Построить маршрут
          </a>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        closeButton: false,
        minWidth: 210,
        maxWidth: 240,
      });

      marker.on('click', () => {
        if (onSelectMarker) onSelectMarker(m.id);
      });

      markerInstancesRef.current[m.id] = marker;
    });
  }, [loaded, markers, activeMarkerId]);

  // Center on active marker or coordinates
  useEffect(() => {
    if (!loaded || !mapRef.current) return;

    if (activeMarkerId && markerInstancesRef.current[activeMarkerId]) {
      const marker = markerInstancesRef.current[activeMarkerId];
      const latLng = marker.getLatLng();
      mapRef.current.setView(latLng, 14, { animate: true });
      marker.openPopup();
    } else {
      mapRef.current.setView(center, zoom, { animate: true });
    }
  }, [loaded, activeMarkerId, center, zoom]);

  // Add click listener for popup "Подробнее" buttons
  useEffect(() => {
    const handleDetailClick = (e: Event) => {
      const customEvent = e as CustomEvent;
      const id = customEvent.detail;
      if (onSelectMarker) {
        onSelectMarker(id);
      }
    };

    window.addEventListener('map-detail-click', handleDetailClick);
    return () => {
      window.removeEventListener('map-detail-click', handleDetailClick);
    };
  }, [onSelectMarker]);

  return (
    <div className="w-full h-full relative" style={{ minHeight: '200px' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marker-bounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.15); }
        }
        @keyframes pulse-ring {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.9; }
          100% { transform: translate(-50%, -50%) scale(2.8); opacity: 0; }
        }
        .leaflet-popup-content-wrapper {
          border-radius: 14px !important;
          box-shadow: 0 8px 24px rgba(23,32,51,0.12) !important;
          border: 1px solid #DCE5EE !important;
          padding: 0 !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          font-family: Inter, -apple-system, sans-serif !important;
        }
        .leaflet-popup-tip-container { display: none !important; }
      `}} />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#EEF3F8] z-20">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin" />
            <span className="text-xs text-[#64748B]">Загрузка карты...</span>
          </div>
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-full z-10" />
    </div>
  );
}
