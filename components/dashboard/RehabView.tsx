'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Phone, MapPin, Clock, ChevronRight, Dumbbell, SlidersHorizontal, Search, Heart, X, Users, Dumbbell as DumbbellIcon } from 'lucide-react';
import rehabsData from '@/data/rehabilitation.json';
import dynamic from 'next/dynamic';

const DashboardMap = dynamic(() => import('./DashboardMap'), {
  ssr: false,
});

const SHYMKENT_CENTER_LAT = 42.324;
const SHYMKENT_CENTER_LNG = 69.598;

function getDistance(lat1: number, lng1: number) {
  const R = 6371; // Radius of earth in km
  const dLat = (SHYMKENT_CENTER_LAT - lat1) * Math.PI / 180;
  const dLng = (SHYMKENT_CENTER_LNG - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(SHYMKENT_CENTER_LAT * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={11}
          className={s <= Math.round(rating) ? 'star-filled fill-current text-yellow-500' : 'text-[#DCE5EE] fill-current'}
        />
      ))}
    </div>
  );
}

export default function RehabView() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'distance'>('rating');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeRehabId, setActiveRehabId] = useState<string | null>(null);
  const [selectedRehab, setSelectedRehab] = useState<any | null>(null);

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
  const filtered = rehabsData
    .filter((c: any) => {
      // Search matches
      const query = search.toLowerCase();
      const nameMatch = c.name.toLowerCase().includes(query);
      const addressMatch = c.address.toLowerCase().includes(query);
      const specMatch = (c.programs || []).some((s: string) => s.toLowerCase().includes(query)) || 
                        (c.services || []).some((s: string) => s.toLowerCase().includes(query));
      const searchMatch = nameMatch || addressMatch || specMatch;

      // Filter matches
      if (filter === 'all') return searchMatch;
      return searchMatch && favorites.includes(c.id);
    })
    .map((c: any) => ({
      ...c,
      distance: getDistance(c.lat, c.lng),
    }))
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      return a.distance - b.distance;
    });

  // Prepare map markers
  const mapMarkers = filtered.map((c: any) => ({
    id: c.id,
    name: c.name,
    address: c.address,
    rating: c.rating,
    lat: c.lat,
    lng: c.lng,
    type: 'rehab' as const,
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
            <h2 className="text-xl font-bold text-[#172033]">Реабилитационные центры</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              {filtered.length} из {rehabsData.length} центров • Шымкент
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
              ['all', 'Все центры'],
              ['favorites', 'Избранные ❤️'],
            ] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all border ${
                  filter === val
                    ? 'bg-[#06B6D4] text-white border-transparent'
                    : 'bg-card text-[#64748B] border-[#DCE5EE] hover:border-[#B8CADF]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((rehab: any, i) => (
            <motion.div
              key={rehab.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              onClick={() => setActiveRehabId(rehab.id)}
              className={`bg-card rounded-2xl border p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.06)] card-hover cursor-pointer transition-all ${
                activeRehabId === rehab.id ? 'border-[#06B6D4] bg-[#06B6D4]/5' : 'border-[#DCE5EE]'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F0FAFB] border border-[rgb(6_182_212_/_0.2)] flex items-center justify-center shrink-0">
                    <DumbbellIcon size={17} className="text-[#06B6D4]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#172033] leading-tight mb-1">
                      {rehab.name}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-[#64748B] flex items-center gap-1">
                        <Users size={10} /> {rehab.capacity} чел.
                      </span>
                      <span className="text-[10px] font-medium text-[#64748B]">📍 {rehab.distance} км</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <button
                    onClick={(e) => toggleFavorite(rehab.id, e)}
                    className="text-[#94A3B8] hover:text-red-500 transition-colors p-1"
                  >
                    <Heart size={14} className={favorites.includes(rehab.id) ? 'fill-red-500 text-red-500' : ''} />
                  </button>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-[#172033]">{rehab.rating}</div>
                    <StarRating rating={rehab.rating} />
                    <div className="text-[10px] text-[#94A3B8] mt-0.5">{rehab.reviewCount} отз.</div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-[#64748B] leading-relaxed mb-4 line-clamp-2">
                {rehab.description}
              </p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {(rehab.programs || rehab.services).slice(0, 3).map((prog: string) => (
                  <span
                    key={prog}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[rgb(6_182_212_/_0.07)] text-[#0891B2] border border-[rgb(6_182_212_/_0.15)]"
                  >
                    {prog}
                  </span>
                ))}
                {(rehab.programs || rehab.services).length > 3 && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#EEF3F8] text-[#94A3B8]">
                    +{(rehab.programs || rehab.services).length - 3}
                  </span>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedRehab(rehab);
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-[#0891B2] bg-[rgb(6_182_212_/_0.07)] hover:bg-[rgb(6_182_212_/_0.12)] border border-[rgb(6_182_212_/_0.2)] transition-all"
              >
                Подробнее <ChevronRight size={13} />
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right: Map */}
      <div className="lg:flex-1 h-80 lg:h-full border-t lg:border-t-0 lg:border-l border-[#DCE5EE] relative bg-[#EEF3F8]">
        <div className="absolute top-3 left-3 z-10 glass px-3 py-2 rounded-xl text-xs font-medium text-[#172033] shadow-card-sm">
          📍 Шымкент, Казахстан
        </div>
        <DashboardMap
          center={mapCenter}
          markers={mapMarkers}
          activeMarkerId={activeRehabId}
          onSelectMarker={(id) => {
            setActiveRehabId(id);
            const found = rehabsData.find((r: any) => r.id === id);
            if (found) setSelectedRehab(found);
          }}
        />
      </div>

      {/* Details Dialog */}
      <AnimatePresence>
        {selectedRehab && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#172033]/40 backdrop-blur-sm"
              onClick={() => setSelectedRehab(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-card rounded-3xl shadow-xl w-full max-w-md border border-[#DCE5EE] p-6 overflow-hidden flex flex-col gap-4 max-h-[85vh]"
            >
              <div className="flex items-center justify-between border-b border-[#DCE5EE] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[rgb(6_182_212_/_0.08)] flex items-center justify-center">
                    <DumbbellIcon size={16} className="text-[#06B6D4]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#172033] text-sm leading-tight">{selectedRehab.name}</h3>
                    <span className="text-[10px] text-[#64748B]">
                      Вместимость: {selectedRehab.capacity} человек
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRehab(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#64748B] hover:bg-[#EEF3F8]"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1">
                <p className="text-xs text-[#64748B] leading-relaxed">{selectedRehab.description}</p>

                <div className="flex flex-col gap-2.5 text-xs text-[#64748B] bg-[#EEF3F8]/50 p-4 rounded-2xl border border-[#DCE5EE]">
                  <div className="flex items-center gap-2">
                    <MapPin size={13} className="text-[#94A3B8]" />
                    <span>{selectedRehab.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-[#94A3B8]" />
                    <span>{selectedRehab.phone || 'Нет телефона'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={13} className="text-[#94A3B8]" />
                    <span>{selectedRehab.workingHours}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-[#172033]">Программы и услуги:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedRehab.programs || selectedRehab.services).map((prog: string) => (
                      <span key={prog} className="text-[10px] px-2.5 py-1 rounded-md bg-[rgb(6_182_212_/_0.07)] border border-[rgb(6_182_212_/_0.15)] text-[#0891B2]">
                        {prog}
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
