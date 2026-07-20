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
  const markerInstancesRef = useRef<{ [id: string]: any }>({});
  const [loaded, setLoaded] = useState(false);
  const [activeMarkerData, setActiveMarkerData] = useState<{ name: string; lat: number; lng: number } | null>(null);

  // Load origin from localStorage or fallback to Shymkent, мкр Север 66/2
  const getOriginCoords = (): [number, number] => {
    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem('user_coords');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
            return [parsed.lat, parsed.lng];
          }
        }
      } catch (e) {
        console.error('[DashboardMap] Error parsing user_coords:', e);
      }
    }
    return [42.3417, 69.5901];
  };

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

    const originCoords = getOriginCoords();

    // Add user location marker
    const originIcon = L.divIcon({
      html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;">
               <div style="position:absolute;top:50%;left:50%;width:24px;height:24px;border-radius:50%;background:#2563EB;opacity:0.35;animation:pulse-ring 1.4s ease-out infinite;"></div>
               <div style="background-color:#2563EB;border-radius:50%;width:12px;height:12px;border:2.5px solid white;box-shadow:0 0 8px rgba(37,99,235,0.8);position:relative;z-index:2;"></div>
             </div>`,
      className: 'user-location-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
    
    L.marker(originCoords, { icon: originIcon }).addTo(mapRef.current)
      .bindPopup('<div style="padding:6px 10px;font-weight:bold;font-size:11px;color:#172033;text-align:center;">Мое местоположение<br/><span style="font-weight:normal;font-size:9px;color:#64748B;">мкр. Север 66/2 (ориентир)</span></div>', { closeButton: false });

    // Custom Icon Definitions for Clinics/Rehabs
    const createCustomIcon = (color: string, isActive: boolean, isHovered: boolean) => {
      const isHighlighted = isActive || isHovered;
      const shadowColor = color === '#10B981' ? 'rgba(16, 185, 129, 0.6)' : color === '#06B6D4' ? 'rgba(6, 182, 212, 0.6)' : 'rgba(37, 99, 235, 0.6)';
      const pulseRing = isHighlighted
        ? `<div style="position:absolute;top:50%;left:50%;width:28px;height:28px;border-radius:50%;background:${color};opacity:0.35;animation:pulse-ring 1.4s ease-out infinite;"></div>
           <div style="position:absolute;top:50%;left:50%;width:28px;height:28px;border-radius:50%;background:${color};opacity:0.2;animation:pulse-ring 1.4s ease-out 0.5s infinite;"></div>`
        : '';
      const dotStyle = isHighlighted
        ? `width:18px;height:18px;border:3px solid white;box-shadow:0 0 12px ${shadowColor};animation:marker-bounce 0.9s infinite ease-in-out;z-index:1000;`
        : `width:12px;height:12px;border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);`;
      return L.divIcon({
        html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;">
                 ${pulseRing}
                 <div style="background-color:${color};border-radius:50%;${dotStyle}position:relative;z-index:2;"></div>
               </div>`,
        className: `custom-leaflet-marker ${isHighlighted ? 'active-marker' : ''}`,
        iconSize: isHighlighted ? [32, 32] : [16, 16],
        iconAnchor: isHighlighted ? [16, 16] : [8, 8],
      });
    };

    markers.forEach((m) => {
      const isActive = m.id === activeMarkerId;
      const isHovered = m.id === hoveredMarkerId;
      const icon = createCustomIcon(m.type === 'rehab' ? '#06B6D4' : m.type === 'private' ? '#10B981' : '#2563EB', isActive, isHovered);
      const marker = L.marker([m.lat, m.lng], { icon }).addTo(mapRef.current);

      // Popup HTML using dynamic origin coords
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${originCoords[0]},${originCoords[1]}&destination=${m.lat},${m.lng}&travelmode=driving`;
      const popupHtml = `
        <div style="padding:12px 14px;min-width:200px;">
          <h4 style="margin:0 0 4px;font-weight:700;color:#172033;font-size:13px;line-height:1.3;">${m.name}</h4>
          <p style="margin:0 0 8px;color:#64748B;font-size:11px;">${m.address}</p>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
            <span style="font-size:11px;font-weight:700;color:#f59e0b;">&#9733; ${m.rating}</span>
            <span style="font-size:10px;color:#22c55e;font-weight:600;"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#22c55e;margin-right:3px;vertical-align:middle;"></span>Открыто</span>
          </div>
          <a href="${googleMapsUrl}" target="_blank" rel="noreferrer"
            style="display:flex;align-items:center;justify-content:center;gap:5px;width:100%;padding:6px 0;background:#2563EB;color:white;border-radius:8px;font-size:11px;font-weight:600;text-decoration:none;">
            Google Maps
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
  }, [loaded, markers, activeMarkerId, hoveredMarkerId]);

  // Center on active marker, draw route line, and fit bounds
  useEffect(() => {
    if (!loaded || !mapRef.current) return;
    const L = window.L;
    if (!L) return;

    // Clear previous route polyline if exists
    if (mapRef.current.routeLineInstance) {
      mapRef.current.routeLineInstance.remove();
      mapRef.current.routeLineInstance = null;
    }

    if (activeMarkerId && markerInstancesRef.current[activeMarkerId]) {
      const marker = markerInstancesRef.current[activeMarkerId];
      const latLng = marker.getLatLng();

      const originCoords = getOriginCoords();
      const destCoords = [latLng.lat, latLng.lng];

      // Draw dashed blue route line
      const polyline = L.polyline([originCoords, destCoords], {
        color: '#2563EB',
        weight: 4.5,
        opacity: 0.8,
        dashArray: '8, 8',
      }).addTo(mapRef.current);

      mapRef.current.routeLineInstance = polyline;

      // Fit map view to show the entire route with padding
      const bounds = L.latLngBounds([originCoords, destCoords]);
      mapRef.current.fitBounds(bounds, { padding: [50, 50], animate: true });

      marker.openPopup();

      // Store active marker data for floating button
      const activeM = markers.find((m) => m.id === activeMarkerId);
      if (activeM) setActiveMarkerData({ name: activeM.name, lat: activeM.lat, lng: activeM.lng });
    } else {
      mapRef.current.setView(center, zoom, { animate: true });
      setActiveMarkerData(null);
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
      {/* Floating route button — appears when a marker is active */}
      {activeMarkerData && (
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
