'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Phone, MapPin, Clock, ChevronRight, Building2,
  SlidersHorizontal, Search, Heart, X, Globe, Navigation2,
  CheckCircle2, Users, Zap, Shield
} from 'lucide-react';
import clinicsData from '@/data/clinics.json';
import dynamic from 'next/dynamic';
import { build2GISUrl, getDistanceFromHub, getLoadInfo, isOpenNow } from '@/lib/maps';

const DashboardMap = dynamic(() => import('./DashboardMap'), { ssr: false });

/* ─── Types ─────────────────────────────────────────────────── */
interface Doctor { name: string; specialty: string; initials: string; }
interface Review { author: string; rating: number; text: string; }
interface Clinic {
  id: string; name: string; address: string; rating: number; reviewCount: number;
  phone: string; description: string; specializations: string[];
  workingHours: string; type: string; lat: number; lng: number; website?: string;
  load?: 'low' | 'medium' | 'high';
  badges?: string[];
  doctors?: Doctor[];
  services?: string[];
  advantages?: string[];
  reviews?: Review[];
  distance?: number;
  open?: boolean;
}

/* ─── Helpers ────────────────────────────────────────────────── */
function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-1 text-yellow-600 font-bold text-xs">
      <Star size={11} className="fill-yellow-400 text-yellow-400" />
      {(rating ?? 0).toFixed(1)}
    </span>
  );
}

function LoadBadge({ load }: { load?: 'low' | 'medium' | 'high' }) {
  if (!load) return null;
  const info = getLoadInfo(load);
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${info.bg} ${info.text} ${info.border}`}>
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: info.dot }} />
      {info.label}
    </span>
  );
}

/* ─── Drawer ─────────────────────────────────────────────────── */
function ClinicDrawer({ clinic, onClose }: { clinic: Clinic; onClose: () => void }) {
  const twoGisUrl = build2GISUrl(clinic.lat, clinic.lng);
  const loadInfo = clinic.load ? getLoadInfo(clinic.load) : null;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[#172033]/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        className="relative ml-auto w-full max-w-md bg-card h-full overflow-y-auto shadow-2xl flex flex-col"
      >
        {/* Gradient Header */}
        <div className={`relative p-6 pb-5 flex-shrink-0 ${
          clinic.type === 'private'
            ? 'bg-gradient-to-br from-[#2563EB] to-[#1D4ED8]'
            : 'bg-gradient-to-br from-[#059669] to-[#047857]'
        }`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <X size={15} />
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Building2 size={22} className="text-white" />
            </div>
            <div>
              <span className="text-white/70 text-[10px] font-bold uppercase tracking-wider">
                {clinic.type === 'private' ? 'Частная клиника' : 'Государственная клиника'}
              </span>
              <h2 className="text-white font-bold text-sm leading-tight mt-0.5">{clinic.name}</h2>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 bg-white/20 rounded-lg px-2.5 py-1">
              <Star size={11} className="fill-yellow-300 text-yellow-300" />
              <span className="text-white text-xs font-bold">{(clinic.rating ?? 0).toFixed(1)}</span>
              <span className="text-white/60 text-[10px]">({clinic.reviewCount ?? 0} отз.)</span>
            </div>
            <div className={`flex items-center gap-1.5 bg-white/20 rounded-lg px-2.5 py-1 text-xs font-semibold ${clinic.open ? 'text-green-300' : 'text-red-300'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${clinic.open ? 'bg-green-300' : 'bg-red-400'}`} />
              {clinic.open ? 'Открыто' : 'Закрыто'}
            </div>
            <div className="flex items-center gap-1 bg-white/20 rounded-lg px-2.5 py-1">
              <MapPin size={10} className="text-white/70" />
              <span className="text-white text-[10px]">{clinic.distance != null ? `${clinic.distance} км` : 'рядом'}</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col gap-5 p-5 overflow-y-auto">

          {/* Load indicator */}
          {loadInfo && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${loadInfo.bg} ${loadInfo.border}`}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: loadInfo.dot }} />
              <div>
                <div className={`text-xs font-bold ${loadInfo.text}`}>{loadInfo.label}</div>
                <div className="text-[10px] text-gray-500">
                  {clinic.load === 'low' && 'Сейчас почти нет очереди'}
                  {clinic.load === 'medium' && 'Умеренная загрузка, ожидание 15-20 мин'}
                  {clinic.load === 'high' && 'Высокая нагрузка, возможна очередь'}
                </div>
              </div>
            </div>
          )}

          {/* Contact info */}
          <div className="flex flex-col gap-2 bg-[#F8FAFC] border border-[#DCE5EE] rounded-xl p-4 text-xs text-[#64748B]">
            <div className="flex items-center gap-2">
              <MapPin size={13} className="text-[#94A3B8] shrink-0" />
              <span>{clinic.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={13} className="text-[#94A3B8] shrink-0" />
              <a href={`tel:${clinic.phone}`} className="text-[#2563EB] font-semibold">{clinic.phone || 'Нет телефона'}</a>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={13} className="text-[#94A3B8] shrink-0" />
              <span>{clinic.workingHours}</span>
            </div>
            {clinic.website && (
              <div className="flex items-center gap-2">
                <Globe size={13} className="text-[#94A3B8] shrink-0" />
                <a href={clinic.website} target="_blank" rel="noreferrer" className="text-[#2563EB] hover:underline truncate">{clinic.website}</a>
              </div>
            )}
          </div>

          {/* Services */}
          {clinic.services && clinic.services.length > 0 && (
            <div>
              <div className="text-xs font-bold text-[#172033] mb-2">Услуги</div>
              <div className="flex flex-wrap gap-1.5">
                {clinic.services.map((s) => (
                  <span key={s} className="text-[10px] px-2.5 py-1 rounded-lg bg-[#EEF3F8] border border-[#DCE5EE] text-[#64748B] font-medium">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Doctors */}
          {clinic.doctors && clinic.doctors.length > 0 && (
            <div>
              <div className="text-xs font-bold text-[#172033] mb-2">Специалисты</div>
              <div className="flex flex-col gap-2">
                {clinic.doctors.map((doc) => (
                  <div key={doc.name} className="flex items-center gap-3 bg-[#F8FAFC] border border-[#DCE5EE] rounded-xl px-3 py-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#EEF3F8] border border-[#DCE5EE] flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-[#2563EB]">{doc.initials}</span>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#172033]">{doc.name}</div>
                      <div className="text-[10px] text-[#64748B]">{doc.specialty}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Advantages */}
          {clinic.advantages && clinic.advantages.length > 0 && (
            <div>
              <div className="text-xs font-bold text-[#172033] mb-2">Преимущества</div>
              <div className="flex flex-col gap-1.5">
                {clinic.advantages.map((adv) => (
                  <div key={adv} className="flex items-start gap-2 text-xs text-[#64748B]">
                    <CheckCircle2 size={13} className="text-[#2563EB] shrink-0 mt-0.5" />
                    <span>{adv}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          {clinic.reviews && clinic.reviews.length > 0 && (
            <div>
              <div className="text-xs font-bold text-[#172033] mb-2">Отзывы</div>
              <div className="flex flex-col gap-2">
                {clinic.reviews.map((rev, i) => (
                  <div key={i} className="bg-[#F8FAFC] border border-[#DCE5EE] rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-[#172033]">{rev.author}</span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: rev.rating }).map((_, j) => (
                          <Star key={j} size={9} className="fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] text-[#64748B] leading-relaxed">{rev.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex-shrink-0 p-5 border-t border-[#DCE5EE] flex flex-col gap-2">
          <a
            href={twoGisUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-all shadow-lg shadow-blue-200"
          >
            <Navigation2 size={15} />
            Построить маршрут в 2GIS
          </a>
          <div className="flex gap-2">
            <a
              href={`tel:${clinic.phone}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-[#2563EB] bg-[#EEF3F8] border border-[#DCE5EE] hover:bg-[#E2EBF4] transition-all"
            >
              <Phone size={13} /> Позвонить
            </a>
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-[#64748B] bg-[#F8FAFC] border border-[#DCE5EE] hover:bg-[#EEF3F8] transition-all">
              Перейти к записи
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function ClinicsView() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'public' | 'private' | 'favorites'>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'distance'>('rating');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeClinicId, setActiveClinicId] = useState<string | null>(null);
  const [drawerClinic, setDrawerClinic] = useState<Clinic | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('mediroute_favorites');
      if (stored) setFavorites(JSON.parse(stored));
    } catch (_) {}
  }, []);

  // Auto-focus first result on search
  useEffect(() => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const first = (clinicsData as Clinic[]).find((c) =>
        c.name.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        (c.specializations ?? []).some((s) => s.toLowerCase().includes(q))
      );
      if (first) setActiveClinicId(first.id);
    } else {
      setActiveClinicId(null);
    }
  }, [search]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id];
    setFavorites(updated);
    window.localStorage.setItem('mediroute_favorites', JSON.stringify(updated));
  };

  const enriched: Clinic[] = (clinicsData as Clinic[]).map((c) => ({
    ...c,
    distance: getDistanceFromHub(c.lat, c.lng),
    open: isOpenNow(c.workingHours),
  }));

  const filtered = enriched
    .filter((c) => {
      const q = search.toLowerCase();
      const match =
        c.name.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        (c.specializations ?? []).some((s) => s.toLowerCase().includes(q));
      if (filter === 'favorites') return match && favorites.includes(c.id);
      if (filter === 'all') return match;
      return match && c.type === filter;
    })
    .sort((a, b) => {
      if (sortBy === 'distance') return (a.distance ?? 999) - (b.distance ?? 999);
      return (b.rating ?? 0) - (a.rating ?? 0);
    });

  const mapMarkers = filtered.map((c) => ({
    id: c.id, name: c.name, address: c.address, rating: c.rating ?? 0,
    lat: c.lat, lng: c.lng, type: c.type as 'public' | 'private',
  }));

  const mapCenter: [number, number] = activeClinicId
    ? (() => { const f = filtered.find((c) => c.id === activeClinicId); return f ? [f.lat, f.lng] : [42.3167, 69.5833]; })()
    : filtered.length > 0 ? [filtered[0].lat, filtered[0].lng] : [42.3167, 69.5833];

  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* Left: List */}
      <div className="flex-1 overflow-y-auto p-5 lg:p-6 lg:max-w-[56%] flex flex-col gap-4">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[#172033]">Клиники</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              <span className="font-semibold text-[#2563EB]">{filtered.length}</span> из {clinicsData.length} клиник • Шымкент
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Поиск клиник..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-2 text-xs rounded-xl border border-[#DCE5EE] bg-card w-44 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
            {/* Sort */}
            <div className="flex rounded-xl border border-[#DCE5EE] bg-[#EEF3F8] p-0.5 text-xs">
              {(['rating', 'distance'] as const).map((s) => (
                <button key={s} onClick={() => setSortBy(s)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${sortBy === s ? 'bg-card text-[#172033] shadow-sm' : 'text-[#64748B]'}`}>
                  {s === 'rating' ? 'Рейтинг' : 'Расстояние'}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={13} className="text-[#94A3B8]" />
          <div className="flex flex-wrap gap-1.5 text-xs">
            {([['all', 'Все'], ['public', 'Гос.'], ['private', 'Частные'], ['favorites', 'Избранные']] as const).map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all border flex items-center gap-1 ${
                  filter === val ? 'bg-[#2563EB] text-white border-transparent' : 'bg-card text-[#64748B] border-[#DCE5EE] hover:border-[#B8CADF]'
                }`}>
                {val === 'favorites' && <Heart size={10} className={filter === val ? 'fill-white text-white' : 'text-red-500 fill-red-500'} />}
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map((clinic, i) => (
            <motion.div
              key={clinic.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5, scale: 1.015, transition: { duration: 0.18 } }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              onClick={() => setActiveClinicId(clinic.id)}
              className={`bg-card rounded-2xl border p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.06)] cursor-pointer transition-all flex flex-col gap-3 ${
                activeClinicId === clinic.id
                  ? 'border-[#2563EB] shadow-[0_0_0_3px_rgba(37,99,235,0.12)]'
                  : 'border-[#DCE5EE] hover:shadow-md hover:border-[#B8CADF]'
              }`}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      clinic.type === 'private' ? 'badge-accent' : 'badge-success'
                    }`}>
                      {clinic.type === 'private' ? 'Частная' : 'Гос.'}
                    </span>
                    <span className={`text-[9px] font-semibold flex items-center gap-0.5 ${clinic.open ? 'text-green-600' : 'text-red-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full inline-block ${clinic.open ? 'bg-green-500' : 'bg-red-400'}`} />
                      {clinic.open ? 'Открыто' : 'Закрыто'}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#172033] leading-tight">{clinic.name}</h3>
                </div>
                <button
                  onClick={(e) => toggleFavorite(clinic.id, e)}
                  className="shrink-0 p-1.5 rounded-lg hover:bg-[#EEF3F8] transition-colors"
                >
                  <Heart size={13} className={favorites.includes(clinic.id) ? 'fill-red-500 text-red-500' : 'text-[#94A3B8]'} />
                </button>
              </div>

              {/* Rating + distance */}
              <div className="flex items-center gap-2 flex-wrap">
                <StarRating rating={clinic.rating} />
                <span className="text-[10px] text-[#94A3B8]">{clinic.reviewCount ?? 0} отзывов</span>
                {clinic.distance != null && (
                  <span className="flex items-center gap-0.5 text-[10px] text-[#64748B] font-medium">
                    <MapPin size={9} className="text-[#94A3B8]" />
                    {clinic.distance} км от IT Hub
                  </span>
                )}
              </div>

              {/* Load */}
              <LoadBadge load={clinic.load} />

              {/* Specialization chips */}
              <div className="flex flex-wrap gap-1">
                {(clinic.specializations ?? []).slice(0, 3).map((s) => (
                  <span key={s} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#EEF3F8] text-[#64748B] border border-[#DCE5EE]">{s}</span>
                ))}
                {(clinic.specializations ?? []).length > 3 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#EEF3F8] text-[#94A3B8]">+{(clinic.specializations ?? []).length - 3}</span>
                )}
              </div>

              {/* Badges */}
              {clinic.badges && clinic.badges.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {clinic.badges.map((b) => (
                    <span key={b} className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100">{b}</span>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 mt-auto pt-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setDrawerClinic(clinic); }}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[11px] font-semibold text-[#2563EB] bg-[#EEF3F8] hover:bg-[#E2EBF4] border border-[#DCE5EE] transition-all"
                >
                  Подробнее <ChevronRight size={11} />
                </button>
                <a
                  href={build2GISUrl(clinic.lat, clinic.lng)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[11px] font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-all"
                >
                  <Navigation2 size={11} /> Маршрут
                </a>
              </div>
            </motion.div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-2 text-center py-12 text-[#94A3B8] text-sm">
              Клиники не найдены
            </div>
          )}
        </div>
      </div>

      {/* Right: Map */}
      <div className="lg:flex-1 h-80 lg:h-full border-t lg:border-t-0 lg:border-l border-[#DCE5EE] relative bg-[#EEF3F8]">
        <div className="absolute top-3 left-3 z-10 glass px-3 py-1.5 rounded-xl text-xs font-medium text-[#172033] shadow-card-sm flex items-center gap-1.5">
          <MapPin size={11} className="text-[#2563EB]" /> Шымкент, Казахстан
        </div>
        {search && (
          <div className="absolute top-3 right-3 z-10 glass px-3 py-1.5 rounded-xl text-xs font-semibold text-[#2563EB] shadow-card-sm">
            Найдено: {filtered.length}
          </div>
        )}
        <DashboardMap
          center={mapCenter}
          markers={mapMarkers}
          activeMarkerId={activeClinicId}
          onSelectMarker={(id) => {
            setActiveClinicId(id);
            const found = enriched.find((c) => c.id === id);
            if (found) setDrawerClinic(found);
          }}
        />
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {drawerClinic && (
          <ClinicDrawer clinic={drawerClinic} onClose={() => setDrawerClinic(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
