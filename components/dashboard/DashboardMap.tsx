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
  hoveredMarkerId?: string | null;
  onSelectMarker?: (id: string) => void;
}

declare global {
  interface Window {
    L: any;
  }
}

const FALLBACK_CENTER: [number, number] = [42.3417, 69.5901];

function safeCenter(center: [number, number]): [number, number] {
  if (
    Array.isArray(center) &&
    center.length === 2 &&
    Number.isFinite(center[0]) &&
    Number.isFinite(center[1])
  ) {
    return center;
  }
  return FALLBACK_CENTER;
}

function getOriginCoords(): [number, number] {
  if (typeof window === 'undefined') return FALLBACK_CENTER;
  try {
    const stored = window.localStorage.getItem('user_coords');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (
        parsed &&
        typeof parsed.lat === 'number' &&
        typeof parsed.lng === 'number' &&
        Number.isFinite(parsed.lat) &&
        Number.isFinite(parsed.lng)
      ) {
        return [parsed.lat, parsed.lng];
      }
    }
  } catch {
    // ignore
  }
  return FALLBACK_CENTER;
}

export default function DashboardMap({
  center,
  zoom = 12,
  markers,
  activeMarkerId,
  hoveredMarkerId,
  onSelectMarker,
}: DashboardMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerLayerRef = useRef<any>(null); // LayerGroup for clinic markers
  const routeLineRef = useRef<any>(null);   // Polyline for active route
  const userMarkerRef = useRef<any>(null);  // User location dot
  const [loaded, setLoaded] = useState(false);
  const [activeMarkerData, setActiveMarkerData] = useState<{
    name: string;
    lat: number;
    lng: number;
  } | null>(null);

  // ── 1. Load Leaflet CSS + JS from CDN once ──────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.L) {
      setLoaded(true);
      return;
    }

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.id = 'leaflet-css';
      document.head.appendChild(link);
    }

    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.id = 'leaflet-js';
      script.async = true;
      script.onload = () => setLoaded(true);
      document.head.appendChild(script);
    }
  }, []);

  // ── 2. Initialize MapContainer ONCE when Leaflet is ready ───────
  useEffect(() => {
    if (!loaded) return;
    if (!mapContainerRef.current) return;
    if (mapRef.current) return; // already initialized — never recreate

    const L = window.L;
    if (!L) return;

    const validCenter = safeCenter(center);

    const map = L.map(mapContainerRef.current, {
      center: validCenter,
      zoom,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // LayerGroup to hold all clinic markers — easy to clear without map.remove()
    markerLayerRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;

    // Fix grey tile bug on first render
    setTimeout(() => {
      if (mapRef.current) mapRef.current.invalidateSize();
    }, 150);

    return () => {
      // Cleanup: remove all layers before destroying map
      if (routeLineRef.current) {
        try { routeLineRef.current.remove(); } catch { /* ignore */ }
        routeLineRef.current = null;
      }
      if (userMarkerRef.current) {
        try { userMarkerRef.current.remove(); } catch { /* ignore */ }
        userMarkerRef.current = null;
      }
      if (markerLayerRef.current) {
        try { markerLayerRef.current.clearLayers(); } catch { /* ignore */ }
        markerLayerRef.current = null;
      }
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch { /* ignore */ }
        mapRef.current = null;
      }
    };
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps
  // NOTE: intentionally omitting center/zoom from deps so the map is never recreated

  // ── 3. Add / update user location marker ───────────────────────
  useEffect(() => {
    if (!loaded || !mapRef.current) return;
    const L = window.L;
    if (!L) return;

    const originCoords = getOriginCoords();

    // Remove existing user marker
    if (userMarkerRef.current) {
      try { userMarkerRef.current.remove(); } catch { /* ignore */ }
      userMarkerRef.current = null;
    }

    const originIcon = L.divIcon({
      html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;">
               <div style="position:absolute;top:50%;left:50%;width:24px;height:24px;border-radius:50%;background:#2563EB;opacity:0.35;animation:pulse-ring 1.4s ease-out infinite;transform:translate(-50%,-50%);"></div>
               <div style="background-color:#2563EB;border-radius:50%;width:12px;height:12px;border:2.5px solid white;box-shadow:0 0 8px rgba(37,99,235,0.8);position:relative;z-index:2;"></div>
             </div>`,
      className: 'user-location-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    try {
      userMarkerRef.current = L.marker(originCoords, { icon: originIcon })
        .addTo(mapRef.current)
        .bindPopup('<div style="padding:6px 10px;font-weight:bold;font-size:11px;color:#172033;text-align:center;">Моё местоположение</div>', { closeButton: false });
    } catch (e) {
      console.error('[DashboardMap] Failed to add user marker:', e);
    }
  }, [loaded]);

  // ── 4. Sync clinic markers into LayerGroup ──────────────────────
  useEffect(() => {
    if (!loaded || !mapRef.current || !markerLayerRef.current) return;
    const L = window.L;
    if (!L) return;

    // Clear previous clinic markers
    try { markerLayerRef.current.clearLayers(); } catch { /* ignore */ }

    const originCoords = getOriginCoords();

    const createCustomIcon = (color: string, isActive: boolean, isHovered: boolean) => {
      const isHighlighted = isActive || isHovered;
      const shadowColor =
        color === '#10B981' ? 'rgba(16, 185, 129, 0.6)'
        : color === '#06B6D4' ? 'rgba(6, 182, 212, 0.6)'
        : 'rgba(37, 99, 235, 0.6)';
      const pulseRing = isHighlighted
        ? `<div style="position:absolute;top:50%;left:50%;width:28px;height:28px;border-radius:50%;background:${color};opacity:0.35;animation:pulse-ring 1.4s ease-out infinite;transform:translate(-50%,-50%);"></div>`
        : '';
      const dotStyle = isHighlighted
        ? `width:18px;height:18px;border:3px solid white;box-shadow:0 0 12px ${shadowColor};`
        : `width:12px;height:12px;border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);`;
      return L.divIcon({
        html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;">
                 ${pulseRing}
                 <div style="background-color:${color};border-radius:50%;${dotStyle}position:relative;z-index:2;"></div>
               </div>`,
        className: `custom-leaflet-marker${isHighlighted ? ' active-marker' : ''}`,
        iconSize: isHighlighted ? [32, 32] : [16, 16],
        iconAnchor: isHighlighted ? [16, 16] : [8, 8],
      });
    };

    markers.forEach((m) => {
      // Guard: skip markers with invalid coordinates
      if (!Number.isFinite(m.lat) || !Number.isFinite(m.lng)) return;

      const isActive = m.id === activeMarkerId;
      const isHovered = m.id === hoveredMarkerId;
      const color = m.type === 'rehab' ? '#06B6D4' : m.type === 'private' ? '#10B981' : '#2563EB';
      const icon = createCustomIcon(color, isActive, isHovered);

      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${originCoords[0]},${originCoords[1]}&destination=${m.lat},${m.lng}&travelmode=driving`;
      const popupHtml = `
        <div style="padding:12px 14px;min-width:200px;">
          <h4 style="margin:0 0 4px;font-weight:700;color:#172033;font-size:13px;line-height:1.3;">${m.name}</h4>
          <p style="margin:0 0 8px;color:#64748B;font-size:11px;">${m.address}</p>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
            <span style="font-size:11px;font-weight:700;color:#f59e0b;">&#9733; ${m.rating}</span>
          </div>
          <a href="${googleMapsUrl}" target="_blank" rel="noreferrer"
            style="display:flex;align-items:center;justify-content:center;gap:5px;width:100%;padding:6px 0;background:#2563EB;color:white;border-radius:8px;font-size:11px;font-weight:600;text-decoration:none;">
            Google Maps
          </a>
        </div>
      `;

      try {
        const marker = L.marker([m.lat, m.lng], { icon }).addTo(markerLayerRef.current);
        marker.bindPopup(popupHtml, { closeButton: false, minWidth: 210, maxWidth: 240 });
        marker.on('click', () => {
          if (onSelectMarker) onSelectMarker(m.id);
        });
      } catch (e) {
        console.error('[DashboardMap] Failed to add clinic marker:', e);
      }
    });
  }, [loaded, markers, activeMarkerId, hoveredMarkerId, onSelectMarker]);

  // ── 5. Draw route line + center on active marker ────────────────
  useEffect(() => {
    if (!loaded || !mapRef.current) return;
    const L = window.L;
    if (!L) return;

    // Remove old route line
    if (routeLineRef.current) {
      try { routeLineRef.current.remove(); } catch { /* ignore */ }
      routeLineRef.current = null;
    }

    if (activeMarkerId) {
      // Find marker coordinates from markers array (not from Leaflet instances)
      const activeM = markers.find((m) => m.id === activeMarkerId);
      if (
        activeM &&
        Number.isFinite(activeM.lat) &&
        Number.isFinite(activeM.lng)
      ) {
        const originCoords = getOriginCoords();
        const destCoords: [number, number] = [activeM.lat, activeM.lng];

        try {
          routeLineRef.current = L.polyline([originCoords, destCoords], {
            color: '#2563EB',
            weight: 4,
            opacity: 0.75,
            dashArray: '8, 8',
          }).addTo(mapRef.current);

          const bounds = L.latLngBounds([originCoords, destCoords]);
          mapRef.current.fitBounds(bounds, { padding: [50, 50], animate: true });
        } catch (e) {
          console.error('[DashboardMap] Failed to draw route:', e);
        }

        setActiveMarkerData({ name: activeM.name, lat: activeM.lat, lng: activeM.lng });
        return;
      }
    }

    // No active marker — reset view
    try {
      mapRef.current.setView(safeCenter(center), zoom, { animate: true });
    } catch { /* ignore */ }
    setActiveMarkerData(null);
  }, [loaded, activeMarkerId, markers, center, zoom]);

  // ── 6. Map detail click event listener ─────────────────────────
  useEffect(() => {
    const handleDetailClick = (e: Event) => {
      const id = (e as CustomEvent).detail;
      if (onSelectMarker) onSelectMarker(id);
    };
    window.addEventListener('map-detail-click', handleDetailClick);
    return () => window.removeEventListener('map-detail-click', handleDetailClick);
  }, [onSelectMarker]);

  const originCoords = getOriginCoords();

  return (
    <div className="w-full h-full relative" style={{ minHeight: '300px' }}>
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
      {activeMarkerData && Number.isFinite(activeMarkerData.lat) && Number.isFinite(activeMarkerData.lng) && (
        <a
          href={`https://www.google.com/maps/dir/?api=1&origin=${originCoords[0]},${originCoords[1]}&destination=${activeMarkerData.lat},${activeMarkerData.lng}&travelmode=driving`}
          target="_blank"
          rel="noreferrer"
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#2563EB] text-white text-xs font-bold shadow-xl shadow-blue-300/50 hover:bg-[#1D4ED8] transition-all active:scale-[0.97] whitespace-nowrap"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
          Маршрут: {activeMarkerData.name.length > 22 ? activeMarkerData.name.substring(0, 22) + '...' : activeMarkerData.name}
        </a>
      )}
    </div>
  );
}
