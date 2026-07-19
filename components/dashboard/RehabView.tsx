'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Phone, MapPin, Clock, ChevronRight, Dumbbell,
  SlidersHorizontal, Search, Heart, X, Navigation2, CheckCircle2, Globe
} from 'lucide-react';
import rehabsData from '@/data/rehabilitation.json';
import dynamic from 'next/dynamic';
import { buildGoogleMapsUrl, getDistanceFromHub, getLoadInfo, isOpenNow } from '@/lib/maps';

const DashboardMap = dynamic(() => import('./DashboardMap'), { ssr: false });

/* ─── Types ─────────────────────────────────────────────────── */
interface Doctor { name: string; specialty: string; initials: string; }
interface Review { author: string; rating: number; text: string; }
interface RehabCenter {
  id: string; name: string; address: string; rating: number; reviewCount: number;
  phone: string; description: string; programs?: string[]; services?: string[];
  workingHours: string; capacity?: number; lat: number; lng: number; type?: string;
  load?: 'low' | 'medium' | 'high';
  categories?: string[];
  badges?: string[];
  advantages?: string[];
  reviews?: Review[];
  distance?: number;
  open?: boolean;
}

const CATEGORY_FILTERS = [
  'Все',
  'После инсульта',
  'После операции',
  'После травмы',
  'Неврология',
  'Ортопедия',
  'Детская реабилитация',
] as const;

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
function RehabDrawer({ center, onClose }: { center: RehabCenter; onClose: () => void }) {
  const googleMapsUrl = buildGoogleMapsUrl(center.lat, center.lng);
  const loadInfo = center.load ? getLoadInfo(center.load) : null;
  const programs = center.programs ?? center.services ?? [];
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(timer);
  }, [center.id]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#172033]/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          className="relative ml-auto w-full max-w-md bg-card h-full p-6 shadow-2xl flex flex-col gap-6"
        >
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
          <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          <div className="mt-auto h-12 bg-gray-100 rounded-2xl animate-pulse" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[#172033]/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        className="relative ml-auto w-full max-w-md bg-card h-full overflow-y-auto shadow-2xl flex flex-col"
      >
        {/* Gradient Header — cyan for rehab */}
        <div className="relative p-6 pb-5 flex-shrink-0 bg-gradient-to-br from-[#0891B2] to-[#0E7490]">
          <button onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors">
            <X size={15} />
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Dumbbell size={22} className="text-white" />
            </div>
            <div>
              <span className="text-white/70 text-[10px] font-bold uppercase tracking-wider">Реабилитационный центр</span>
              <h2 className="text-white font-bold text-sm leading-tight mt-0.5">{center.name}</h2>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 bg-white/20 rounded-lg px-2.5 py-1">
              <Star size={11} className="fill-yellow-300 text-yellow-300" />
              <span className="text-white text-xs font-bold">{(center.rating ?? 0).toFixed(1)}</span>
              <span className="text-white/60 text-[10px]">({center.reviewCount ?? 0} отз.)</span>
            </div>
            <div className={`flex items-center gap-1.5 bg-white/20 rounded-lg px-2.5 py-1 text-xs font-semibold ${center.open ? 'text-green-300' : 'text-red-300'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${center.open ? 'bg-green-300' : 'bg-red-400'}`} />
              {center.open ? 'Открыто' : 'Закрыто'}
            </div>
            {center.capacity && (
              <div className="flex items-center gap-1 bg-white/20 rounded-lg px-2.5 py-1">
                <span className="text-white text-[10px]">{center.capacity} мест</span>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col gap-5 p-5 overflow-y-auto">
          {loadInfo && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${loadInfo.bg} ${loadInfo.border}`}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: loadInfo.dot }} />
              <div>
                <div className={`text-xs font-bold ${loadInfo.text}`}>{loadInfo.label}</div>
                <div className="text-[10px] text-gray-500">
                  {center.load === 'low' && 'Свободные места есть, ожидание минимальное'}
                  {center.load === 'medium' && 'Умеренная загрузка, запись на ближайшие дни'}
                  {center.load === 'high' && 'Высокий спрос, рекомендуем записаться заранее'}
                </div>
              </div>
            </div>
          )}

          {/* Contact */}
          <div className="flex flex-col gap-2 bg-[#F8FAFC] border border-[#DCE5EE] rounded-xl p-4 text-xs text-[#64748B]">
            <div className="flex items-center gap-2"><MapPin size={13} className="text-[#94A3B8] shrink-0" /><span>{center.address}</span></div>
            <div className="flex items-center gap-2"><Phone size={13} className="text-[#94A3B8] shrink-0" />
              <a href={`tel:${center.phone}`} className="text-[#0891B2] font-semibold">{center.phone && center.phone !== 'unknown' ? center.phone : 'Уточняйте по запросу'}</a>
            </div>
            <div className="flex items-center gap-2"><Clock size={13} className="text-[#94A3B8] shrink-0" /><span>{center.workingHours}</span></div>
          </div>

          {/* Programs */}
          {programs.length > 0 && (
            <div>
              <div className="text-xs font-bold text-[#172033] mb-2">Программы и услуги</div>
              <div className="flex flex-wrap gap-1.5">
                {programs.map((p) => (
                  <span key={p} className="text-[10px] px-2.5 py-1 rounded-lg bg-[rgb(6_182_212_/_0.08)] border border-[rgb(6_182_212_/_0.2)] text-[#0891B2] font-medium">{p}</span>
                ))}
              </div>
            </div>
          )}

          {/* Advantages */}
          {center.advantages && center.advantages.length > 0 && (
            <div>
              <div className="text-xs font-bold text-[#172033] mb-2">Преимущества</div>
              <div className="flex flex-col gap-1.5">
                {center.advantages.map((a) => (
                  <div key={a} className="flex items-start gap-2 text-xs text-[#64748B]">
                    <CheckCircle2 size={13} className="text-[#0891B2] shrink-0 mt-0.5" />
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          {center.reviews && center.reviews.length > 0 && (
            <div>
              <div className="text-xs font-bold text-[#172033] mb-2">Отзывы</div>
              <div className="flex flex-col gap-2">
                {center.reviews.map((rev, i) => (
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

        {/* Actions */}
        <div className="flex-shrink-0 p-5 border-t border-[#DCE5EE] flex flex-col gap-2">
          <a href={googleMapsUrl} target="_blank" rel="noreferrer"
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-all shadow-lg shadow-blue-200">
            <Navigation2 size={15} /> Открыть в Google Maps
          </a>
          <a href={`tel:${center.phone}`}
            className="w-full flex items-center justify-center gap-1.5 py-3.5 rounded-2xl text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-all">
            <Phone size={14} className="text-blue-600" /> Позвонить
          </a>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function RehabView() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('Все');
  const [sortBy, setSortBy] = useState<'rating' | 'distance'>('rating');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeRehabId, setActiveRehabId] = useState<string | null>(null);
  const [drawerRehab, setDrawerRehab] = useState<RehabCenter | null>(null);
  const [hoveredRehabId, setHoveredRehabId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('mediroute_rehab_favorites');
      if (stored) setFavorites(JSON.parse(stored));
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const first = enriched.find((c) =>
        c.name.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        (c.programs ?? c.services ?? []).some((s: string) => s.toLowerCase().includes(q))
      );
      if (first) setActiveRehabId(first.id);
    }
  }, [search]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id];
    setFavorites(updated);
    window.localStorage.setItem('mediroute_rehab_favorites', JSON.stringify(updated));
  };

  const enriched: RehabCenter[] = (rehabsData as RehabCenter[]).map((c) => ({
    ...c,
    distance: getDistanceFromHub(c.lat, c.lng),
    open: isOpenNow(c.workingHours),
  }));

  const filtered = enriched
    .filter((c) => {
      const q = search.toLowerCase();
      const matchSearch =
        c.name.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        (c.programs ?? c.services ?? []).some((s: string) => s.toLowerCase().includes(q));
      const matchCat = category === 'Все' || (c.categories ?? []).includes(category);
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (sortBy === 'distance') return (a.distance ?? 999) - (b.distance ?? 999);
      return (b.rating ?? 0) - (a.rating ?? 0);
    });

  const mapMarkers = filtered.map((c) => ({
    id: c.id, name: c.name, address: c.address,
    rating: c.rating ?? 0, lat: c.lat, lng: c.lng,
    type: 'rehab' as const,
  }));

  const mapCenter: [number, number] = activeRehabId
    ? (() => { const f = filtered.find((c) => c.id === activeRehabId); return f ? [f.lat, f.lng] : [42.3167, 69.5833]; })()
    : filtered.length > 0 ? [filtered[0].lat, filtered[0].lng] : [42.3167, 69.5833];

  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* Left */}
      <div className="flex-1 overflow-y-auto p-5 lg:p-6 lg:max-w-[56%] flex flex-col gap-4">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[#172033]">Реабилитационные центры</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Реабилитационные центры Шымкента
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#94A3B8]" />
              <input type="text" placeholder="Поиск..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-2 text-xs rounded-xl border border-[#DCE5EE] bg-card w-40 focus:outline-none focus:border-[#0891B2] transition-all" />
            </div>
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

        {/* Category scroll filters */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={13} className="text-[#94A3B8] shrink-0" />
          <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {CATEGORY_FILTERS.map((cat) => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`shrink-0 px-3 py-1.5 rounded-xl font-medium transition-all border whitespace-nowrap ${
                  category === cat
                    ? 'bg-[#0891B2] text-white border-transparent'
                    : 'bg-card text-[#64748B] border-[#DCE5EE] hover:border-[#B8CADF]'
                }`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map((rehab, i) => (
            <motion.div
              key={rehab.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5, scale: 1.015, transition: { duration: 0.18 } }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              onClick={() => setActiveRehabId(rehab.id)}
              onMouseEnter={() => setHoveredRehabId(rehab.id)}
              onMouseLeave={() => setHoveredRehabId(null)}
              className={`bg-card rounded-2xl border p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.06)] cursor-pointer transition-all flex flex-col gap-3 ${
                activeRehabId === rehab.id
                  ? 'border-[#0891B2] shadow-[0_0_0_3px_rgba(6,182,212,0.12)]'
                  : 'border-[#DCE5EE] hover:shadow-md hover:border-[#B8CADF]'
              }`}
            >
              {/* Top */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className={`text-[9px] font-semibold flex items-center gap-0.5 ${rehab.open ? 'text-green-600' : 'text-red-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full inline-block ${rehab.open ? 'bg-green-500' : 'bg-red-400'}`} />
                      {rehab.open ? 'Открыто' : 'Закрыто'}
                    </span>
                    {rehab.capacity && (
                      <span className="text-[9px] text-[#94A3B8]">{rehab.capacity} мест</span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-[#172033] leading-tight">{rehab.name}</h3>
                </div>
                <button onClick={(e) => toggleFavorite(rehab.id, e)}
                  className="shrink-0 p-1.5 rounded-lg hover:bg-[#EEF3F8] transition-colors">
                  <Heart size={13} className={favorites.includes(rehab.id) ? 'fill-red-500 text-red-500' : 'text-[#94A3B8]'} />
                </button>
              </div>

              {/* Rating + distance */}
              <div className="flex items-center gap-2 flex-wrap">
                <StarRating rating={rehab.rating} />
                <span className="text-[10px] text-[#94A3B8]">{rehab.reviewCount ?? 0} отзывов</span>
                {rehab.distance != null && (
                  <span className="flex items-center gap-0.5 text-[10px] text-[#64748B] font-medium">
                    <MapPin size={9} className="text-[#94A3B8]" />{rehab.distance} км
                  </span>
                )}
              </div>

              <LoadBadge load={rehab.load} />

              {/* Programs */}
              <div className="flex flex-wrap gap-1">
                {(rehab.programs ?? rehab.services ?? []).slice(0, 3).map((p: string) => (
                  <span key={p} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[rgb(6_182_212_/_0.07)] text-[#0891B2] border border-[rgb(6_182_212_/_0.15)]">{p}</span>
                ))}
                {(rehab.programs ?? rehab.services ?? []).length > 3 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#EEF3F8] text-[#94A3B8]">+{(rehab.programs ?? rehab.services ?? []).length - 3}</span>
                )}
              </div>

              {/* Badges */}
              {rehab.badges && rehab.badges.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {rehab.badges.map((b) => (
                    <span key={b} className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-700 border border-cyan-100">{b}</span>
                  ))}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-2 mt-auto pt-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setDrawerRehab(rehab); }}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[11px] font-semibold text-[#0891B2] bg-[rgb(6_182_212_/_0.07)] hover:bg-[rgb(6_182_212_/_0.12)] border border-[rgb(6_182_212_/_0.2)] transition-all">
                  Подробнее <ChevronRight size={11} />
                </button>
                <a href={buildGoogleMapsUrl(rehab.lat, rehab.lng)} target="_blank" rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[11px] font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-all">
                  <Navigation2 size={11} /> Маршрут
                </a>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2 text-center py-12 text-[#94A3B8] text-sm">Центры не найдены</div>
          )}
        </div>

        {/* Database last updated footer */}
        <div className="text-[10px] text-gray-400 mt-6 pt-4 border-t border-[#EEF3F8] text-center">
          Данные клиник обновлены: Июль 2026
        </div>
      </div>

      {/* Right: Map */}
      <div className="lg:flex-1 h-80 lg:h-full border-t lg:border-t-0 lg:border-l border-[#DCE5EE] relative bg-[#EEF3F8]">
        <div className="absolute top-3 left-3 z-10 glass px-3 py-1.5 rounded-xl text-xs font-medium text-[#172033] shadow-card-sm flex items-center gap-1.5">
          <MapPin size={11} className="text-[#0891B2]" /> Шымкент, Казахстан
        </div>
        {search && (
          <div className="absolute top-3 right-3 z-10 glass px-3 py-1.5 rounded-xl text-xs font-semibold text-[#0891B2] shadow-card-sm">
            Найдено: {filtered.length}
          </div>
        )}
        <DashboardMap
          center={mapCenter}
          markers={mapMarkers}
          activeMarkerId={activeRehabId}
          hoveredMarkerId={hoveredRehabId}
          onSelectMarker={(id) => {
            setActiveRehabId(id);
            const found = enriched.find((c) => c.id === id);
            if (found) setDrawerRehab(found);
          }}
        />
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {drawerRehab && <RehabDrawer center={drawerRehab} onClose={() => setDrawerRehab(null)} />}
      </AnimatePresence>
    </div>
  );
}
