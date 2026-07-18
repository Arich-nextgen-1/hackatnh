'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Phone, MapPin, Clock, ChevronRight, Building2, SlidersHorizontal, Search, Heart, X, Globe, Eye } from 'lucide-react';
import clinicsData from '@/data/clinics.json';
import dynamic from 'next/dynamic';

const DashboardMap = dynamic(() => import('./DashboardMap'), {
  ssr: false,
});

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-100 rounded-lg px-1.5 py-0.5 text-yellow-700">
      <Star size={10} className="fill-yellow-500 text-yellow-500" />
      <span className="text-[10px] font-bold">{rating}</span>
    </div>
  );
}

export default function ClinicsView() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'public' | 'private' | 'favorites'>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'distance'>('rating');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeClinicId, setActiveClinicId] = useState<string | null>(null);
  const [selectedClinic, setSelectedClinic] = useState<any | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Request geolocation on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // Permission denied or unavailable — distance won't be shown
          setUserCoords(null);
        },
        { timeout: 5000 }
      );
    }
  }, []);

  // Load favorites
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('mediroute_favorites');
      if (stored) setFavorites(JSON.parse(stored));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = favorites.includes(id)
      ? favorites.filter(fId => fId !== id)
      : [...favorites, id];
    setFavorites(updated);
    window.localStorage.setItem('mediroute_favorites', JSON.stringify(updated));
  };

  // Filter & Search logic
  const filtered = clinicsData
    .filter((c: any) => {
      const query = search.toLowerCase();
      const nameMatch = c.name.toLowerCase().includes(query);
      const addressMatch = c.address.toLowerCase().includes(query);
      const specMatch = c.specializations.some((s: string) => s.toLowerCase().includes(query));
      const searchMatch = nameMatch || addressMatch || specMatch;
      if (filter === 'all') return searchMatch;
      if (filter === 'favorites') return searchMatch && favorites.includes(c.id);
      return searchMatch && c.type === filter;
    })
    .map((c: any) => ({
      ...c,
      distance: userCoords ? getDistance(userCoords.lat, userCoords.lng, c.lat, c.lng) : null,
    }))
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'distance' && a.distance !== null && b.distance !== null) return a.distance - b.distance;
      return b.rating - a.rating;
    });

  // Prepare map markers
  const mapMarkers = filtered.map((c: any) => ({
    id: c.id,
    name: c.name,
    address: c.address,
    rating: c.rating,
    lat: c.lat,
    lng: c.lng,
    type: c.type as 'public' | 'private',
  }));

  const mapCenter: [number, number] = filtered.length > 0
    ? [filtered[0].lat, filtered[0].lng]
    : [42.3167, 69.5833];

  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* Left: list */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-7 lg:max-w-[55%] flex flex-col gap-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h2 className="text-xl font-bold text-[#172033]">Клиники</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              {filtered.length} из {clinicsData.length} клиник • Шымкент
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Поиск..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-xs rounded-xl border border-[#DCE5EE] bg-card w-40 sm:w-48 focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            {/* Sort Toggle */}
            <div className="flex rounded-xl border border-[#DCE5EE] bg-[#EEF3F8] p-0.5 text-xs">
              <button
                onClick={() => setSortBy('rating')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  sortBy === 'rating' ? 'bg-card text-[#172033] shadow-sm' : 'text-[#64748B]'
                }`}
              >
                По рейтингу
              </button>
              <button
                onClick={() => setSortBy('distance')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  sortBy === 'distance' ? 'bg-card text-[#172033] shadow-sm' : 'text-[#64748B]'
                }`}
              >
                По расст.
              </button>
            </div>
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-[#94A3B8]" />
          <div className="flex flex-wrap gap-1.5 text-xs">
            {([
              ['all', 'Все'],
              ['public', 'Гос.'],
              ['private', 'Частные'],
              ['favorites', 'Избранные'],
            ] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all border flex items-center gap-1 ${
                  filter === val
                    ? 'bg-[#2563EB] text-white border-transparent'
                    : 'bg-card text-[#64748B] border-[#DCE5EE] hover:border-[#B8CADF]'
                }`}
              >
                {val === 'favorites' && <Heart size={11} className={filter === val ? 'fill-white text-white' : 'text-red-500 fill-red-500'} />}
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((clinic: any, i) => (
            <motion.div
              key={clinic.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              onClick={() => setActiveClinicId(clinic.id)}
              className={`bg-card rounded-2xl border p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.06)] card-hover cursor-pointer transition-all ${
                activeClinicId === clinic.id ? 'border-[#2563EB] bg-[#2563EB]/5' : 'border-[#DCE5EE]'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EEF3F8] border border-[#DCE5EE] flex items-center justify-center shrink-0">
                    <Building2 size={17} className="text-[#2563EB]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#172033] leading-tight mb-1">
                      {clinic.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        clinic.type === 'private' ? 'badge-accent' : 'badge-success'
                      }`}>
                        {clinic.type === 'private' ? 'Частная' : 'Государственная'}
                      </span>
                      {clinic.distance !== null && (
                        <span className="text-[10px] font-medium text-[#64748B] flex items-center gap-0.5">
                          <MapPin size={10} className="text-[#94A3B8]" /> {clinic.distance} км
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <button
                    onClick={(e) => toggleFavorite(clinic.id, e)}
                    className="text-[#94A3B8] hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-[#EEF3F8] transition-all"
                  >
                    <Heart size={14} className={favorites.includes(clinic.id) ? 'fill-red-500 text-red-500' : ''} />
                  </button>
                  <StarRating rating={clinic.rating} />
                  <div className="text-[10px] text-[#94A3B8]">{clinic.reviewCount} отз.</div>
                </div>
              </div>

              <p className="text-xs text-[#64748B] leading-relaxed mb-4 line-clamp-2">
                {clinic.description}
              </p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {clinic.specializations.slice(0, 3).map((spec: string) => (
                  <span
                    key={spec}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#EEF3F8] text-[#64748B] border border-[#DCE5EE]"
                  >
                    {spec}
                  </span>
                ))}
                {clinic.specializations.length > 3 && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#EEF3F8] text-[#94A3B8]">
                    +{clinic.specializations.length - 3}
                  </span>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedClinic(clinic);
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-[#2563EB] bg-[#EEF3F8] hover:bg-[#E2EBF4] border border-[#DCE5EE] hover:border-[#B8CADF] transition-all"
              >
                Подробнее <ChevronRight size={13} />
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right: Map */}
      <div className="lg:flex-1 h-80 lg:h-full border-t lg:border-t-0 lg:border-l border-[#DCE5EE] relative bg-[#EEF3F8]">
        <div className="absolute top-3 left-3 z-10 glass px-3 py-2 rounded-xl text-xs font-medium text-[#172033] shadow-card-sm flex items-center gap-1.5">
          <MapPin size={12} className="text-[#2563EB]" /> Шымкент, Казахстан
        </div>
        <DashboardMap
          center={mapCenter}
          markers={mapMarkers}
          activeMarkerId={activeClinicId}
          onSelectMarker={(id) => {
            setActiveClinicId(id);
            const found = clinicsData.find((c: any) => c.id === id);
            if (found) setSelectedClinic(found);
          }}
        />
      </div>

      {/* Details Dialog */}
      <AnimatePresence>
        {selectedClinic && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#172033]/40 backdrop-blur-sm"
              onClick={() => setSelectedClinic(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-card rounded-3xl shadow-xl w-full max-w-md border border-[#DCE5EE] p-6 overflow-hidden flex flex-col gap-4 max-h-[85vh]"
            >
              <div className="flex items-center justify-between border-b border-[#DCE5EE] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#EEF3F8] flex items-center justify-center">
                    <Building2 size={16} className="text-[#2563EB]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#172033] text-sm leading-tight">{selectedClinic.name}</h3>
                    <span className="text-[10px] text-[#64748B]">
                      {selectedClinic.type === 'private' ? 'Частная' : 'Государственная'} клиника
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedClinic(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#64748B] hover:bg-[#EEF3F8]"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1">
                <p className="text-xs text-[#64748B] leading-relaxed">{selectedClinic.description}</p>

                <div className="flex flex-col gap-2.5 text-xs text-[#64748B] bg-[#EEF3F8]/50 p-4 rounded-2xl border border-[#DCE5EE]">
                  <div className="flex items-center gap-2">
                    <MapPin size={13} className="text-[#94A3B8]" />
                    <span>{selectedClinic.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-[#94A3B8]" />
                    <span>{selectedClinic.phone || 'Нет телефона'}</span>
                  </div>
                  {selectedClinic.website && (
                    <div className="flex items-center gap-2">
                      <Globe size={13} className="text-[#94A3B8]" />
                      <a href={selectedClinic.website} target="_blank" rel="noreferrer" className="text-[#2563EB] hover:underline">
                        {selectedClinic.website}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock size={13} className="text-[#94A3B8]" />
                    <span>{selectedClinic.workingHours}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-[#172033]">Специализации:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedClinic.specializations.map((spec: string) => (
                      <span key={spec} className="text-[10px] px-2.5 py-1 rounded-md bg-[#EEF3F8] border border-[#DCE5EE] text-[#64748B]">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
