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
      const activeStyle = isActive 
        ? `width: 18px; height: 18px; border: 3px solid white; box-shadow: 0 0 12px ${shadowColor}, 0 0 0 6px ${shadowColor}; animation: marker-bounce 0.8s infinite ease-in-out; z-index: 1000;` 
        : `width: 12px; height: 12px; border: 2px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.3);`;
      return L.divIcon({
        html: `<div style="background-color: ${color}; border-radius: 50%; ${activeStyle} transition: all 0.2s ease;"></div>`,
        className: `custom-leaflet-marker ${isActive ? 'active-marker' : ''}`,
        iconSize: isActive ? [18, 18] : [12, 12],
        iconAnchor: isActive ? [9, 9] : [6, 6],
      });
    };

    markers.forEach((m) => {
      const isActive = m.id === activeMarkerId;
      const icon = createCustomIcon(m.type === 'rehab' ? '#06B6D4' : m.type === 'private' ? '#10B981' : '#2563EB', isActive);
      const marker = L.marker([m.lat, m.lng], { icon }).addTo(mapRef.current);

      // Popup HTML content with modern styling matching MedRoute UI
      const popupHtml = `
        <div style="font-family: inherit; padding: 2px;">
          <h4 style="margin: 0 0 4px; font-weight: 700; color: #172033; font-size: 13px;">${m.name}</h4>
          <p style="margin: 0 0 8px; color: #64748B; font-size: 11px; line-height: 1.4;">${m.address}</p>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 8px;">
            <span style="font-size: 11px; font-weight: 600; color: #EAB308; display: inline-flex; align-items: center; gap: 3px;">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#EAB308" stroke="#EAB308" stroke-width="2" style="display: inline-block; vertical-align: middle;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              ${m.rating}
            </span>
            <button 
              id="map-btn-${m.id}" 
              style="background-color: #EEF3F8; border: 1px solid #DCE5EE; color: #2563EB; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: 600; cursor: pointer;"
              onclick="window.dispatchEvent(new CustomEvent('map-detail-click', {detail: '${m.id}'}))"
            >
              Подробнее
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        closeButton: false,
        minWidth: 180,
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
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
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
