'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Phone, MapPin, Clock, ChevronRight, Dumbbell,
  SlidersHorizontal, Search, Heart, X, Globe, Navigation2,
  CheckCircle2, Copy, ExternalLink, MessageCircle, Banknote
} from 'lucide-react';
import rehabsData from '@/data/rehabilitation.json';
import dynamic from 'next/dynamic';
import { buildGoogleMapsUrl, getDistanceFromHub, getLoadInfo, isOpenNow } from '@/lib/maps';

const DashboardMap = dynamic(() => import('./DashboardMap'), { ssr: false });

/* ─── Types ─────────────────────────────────────────────────── */
interface Review { author: string; rating: number; text: string; }
interface PriceItem { service: string; price: number; currency: string; }
interface RehabCenter {
  id: string; name: string; short_name?: string; address: string; rating: number; reviewCount: number;
  phone: string; phones?: string[]; email?: string; description?: string;
  programs?: string[]; services?: string[]; departments?: string[];
  workingHours: string; capacity?: number;
  lat: number | null; lng: number | null; type?: string;
  load?: 'low' | 'medium' | 'high';
  categories?: string[];
  badges?: string[];
  image?: string;
  priceFrom?: number;
  price_list?: PriceItem[];
  advantages?: string[];
  reviews?: Review[];
  distance?: number;
  open?: boolean;
  website?: string;
}

const CATEGORY_FILTERS = [
  'Все',
  'После инсульта',
  'После операции / травмы',
  'Детская реабилитация',
  'Лечение зависимостей (алкоголизм и др.)',
  'Неврология и ортопедия',
] as const;

/* ─── Helpers ────────────────────────────────────────────────── */
function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-1 font-bold text-sm text-gray-800">
      <Star size={14} className="fill-yellow-400 text-yellow-400" />
      {(rating ?? 0).toFixed(1)}
    </span>
  );
}

/* ─── Drawer ─────────────────────────────────────────────────── */
function RehabDrawer({ center, onClose, onShowOnMap }: { center: RehabCenter; onClose: () => void; onShowOnMap: () => void }) {
  const googleMapsUrl = center.lat && center.lng ? buildGoogleMapsUrl(center.lat, center.lng, center.address) : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(center.name + ' ' + center.address)}`;
  const loadInfo = center.load ? getLoadInfo(center.load) : null;
  const programs = center.programs ?? center.services ?? [];
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const copyPhone = () => {
    navigator.clipboard.writeText(center.phone).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end lg:flex-row lg:justify-end lg:items-stretch">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel: bottom sheet on mobile, right side panel on desktop */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 340, damping: 36 }}
        className="relative z-10 bg-white w-full max-h-[90vh] rounded-t-[28px] flex flex-col overflow-hidden
                   lg:translate-y-0 lg:rounded-none lg:rounded-l-3xl lg:max-h-full lg:h-full lg:w-[760px] lg:max-w-[760px]"
        style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0 lg:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Clinic Image Header Banner (Mobile Only) */}
        {center.image && (
          <div className="relative h-44 w-full shrink-0 overflow-hidden bg-gray-100 border-b border-gray-100 lg:hidden">
            <img src={center.image} alt={center.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
            <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/85 backdrop-blur-md hover:bg-white text-gray-800 shadow-md flex items-center justify-center transition-all z-20 active:scale-90">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Main Content Layout: Flex row on desktop if image exists */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden h-full">

          {/* Left Column: Details */}
          <div className={`flex-1 flex flex-col overflow-hidden h-full ${center.image ? 'lg:w-1/2' : 'w-full'}`}>

            {/* Header */}
            <div className="flex-shrink-0 px-5 pt-4 pb-4 border-b border-gray-100">
              <div className="flex items-start justify-between gap-3 mb-3">
                <span className="text-[11px] font-bold px-3 py-1 rounded-full border bg-cyan-50 text-cyan-700 border-cyan-100">
                  Реабилитационный центр
                </span>
                <button onClick={onClose}
                  className={`w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors shrink-0 ${
                    center.image ? 'lg:flex hidden' : 'flex'
                  }`}>
                  <X size={15} />
                </button>
              </div>
              <h2 className="text-xl font-black text-gray-900 leading-tight">{center.name || 'Центр реабилитации'}</h2>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <StarRating rating={center.rating} />
                <span className="text-xs text-gray-400">({center.reviewCount || 0} отзывов)</span>
                <span className={`flex items-center gap-1.5 text-xs font-semibold ${center.open ? 'text-green-600' : 'text-red-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${center.open ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                  {center.open ? 'Открыто' : 'Закрыто'}
                </span>
                {center.distance != null && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin size={11} className="text-gray-400" />
                    {center.distance} км
                  </span>
                )}
              </div>
            </div>

            {/* Load indicator */}
            {loadInfo && (
              <div className={`mx-5 mt-3 flex items-center gap-3 px-4 py-3 rounded-xl border ${loadInfo.bg} ${loadInfo.border}`}>
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: loadInfo.dot }} />
                <div>
                  <div className={`text-sm font-bold ${loadInfo.text}`}>{loadInfo.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {center.load === 'low' && 'Свободные места есть, ожидание минимальное'}
                    {center.load === 'medium' && 'Умеренная загрузка, запись на ближайшие дни'}
                    {center.load === 'high' && 'Высокий спрос, рекомендуем записаться заранее'}
                  </div>
                </div>
              </div>
            )}

            {/* Body */}
            <div className={`flex-1 flex flex-col px-5 py-4 gap-4 overflow-y-auto ${
              center.image ? 'w-full' : 'lg:grid lg:grid-cols-2 lg:gap-6'
            }`}>
              {center.image ? (
                <>
                  {/* Contact info rows */}
                  <div className="flex flex-col divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <MapPin size={15} className="text-cyan-600 shrink-0" />
                        <span className="text-xs text-gray-800 leading-snug">{center.address || 'Адрес не указан'}</span>
                      </div>
                      <ChevronRight size={13} className="text-gray-300 shrink-0" />
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Phone size={15} className="text-cyan-600 shrink-0" />
                        <a href={`tel:${center.phone}`} className="text-xs font-semibold text-cyan-600">
                          {center.phone && center.phone !== 'unknown' ? center.phone : 'Уточняйте по запросу'}
                        </a>
                      </div>
                      <button onClick={copyPhone} className="p-1 hover:text-cyan-600 text-gray-400 transition-colors">
                        {copied ? <CheckCircle2 size={13} className="text-green-500" /> : <Copy size={13} />}
                      </button>
                    </div>
                    {center.phone && (
                      <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <MessageCircle size={15} className="text-[#25D366] shrink-0" />
                          <a href={`https://wa.me/${center.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#25D366] hover:underline">
                            Написать в WhatsApp
                          </a>
                        </div>
                        <ExternalLink size={12} className="text-gray-300 shrink-0" />
                      </div>
                    )}
                    <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Clock size={15} className="text-cyan-600 shrink-0" />
                        <span className="text-xs text-gray-800">{center.workingHours || 'Уточняйте по телефону'}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium">Ежедневно</span>
                    </div>
                    {center.website && (
                      <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Globe size={15} className="text-cyan-600 shrink-0" />
                          <a href={center.website} target="_blank" rel="noreferrer" className="text-xs text-cyan-600 hover:underline truncate max-w-[200px]">
                            {center.website.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                        <ExternalLink size={12} className="text-gray-300 shrink-0" />
                      </div>
                    )}
                  </div>

                  {/* Price list */}
                  {center.price_list && center.price_list.length > 0 && (
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4">
                      <h3 className="text-sm font-bold text-emerald-900 mb-3 flex items-center gap-1.5">
                        <Banknote size={15} className="text-emerald-600" /> Цены на услуги
                      </h3>
                      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                        {center.price_list.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs border-b border-dashed border-gray-200 pb-1.5 last:border-0 last:pb-0">
                            <span className="text-gray-600 font-medium text-left pr-2">{item.service}</span>
                            <span className="font-bold text-emerald-700 whitespace-nowrap">
                              {item.price === 0 ? 'Бесплатно' : `${item.price.toLocaleString('ru-RU')} ${item.currency}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Programs */}
                  {programs.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-2">Программы реабилитации</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {programs.map((p) => (
                          <span key={p} className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Advantages */}
                  {center.advantages && center.advantages.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-2">Преимущества центра</h3>
                      <div className="flex flex-col gap-1.5">
                        {center.advantages.map((adv) => (
                          <div key={adv} className="flex items-start gap-2">
                            <CheckCircle2 size={14} className="text-green-500 shrink-0 mt-0.5" />
                            <span className="text-xs text-gray-700 leading-snug">{adv}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reviews */}
                  {center.reviews && center.reviews.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-2">Отзывы</h3>
                      <div className="flex flex-col gap-2">
                        {center.reviews.slice(0, 2).map((rev, i) => (
                          <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-gray-900">{rev.author || 'Пациент'}</span>
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: rev.rating || 0 }).map((_, j) => (
                                  <Star key={j} size={11} className="fill-yellow-400 text-yellow-400" />
                                ))}
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">{rev.text || ''}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Left Column: Contact details and Price List */}
                  <div className="flex flex-col gap-4">
                    {/* Contact info rows */}
                    <div className="flex flex-col divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <MapPin size={15} className="text-cyan-600 shrink-0" />
                          <span className="text-xs text-gray-800 leading-snug">{center.address || 'Адрес не указан'}</span>
                        </div>
                        <ChevronRight size={13} className="text-gray-300 shrink-0" />
                      </div>
                      <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Phone size={15} className="text-cyan-600 shrink-0" />
                          <a href={`tel:${center.phone}`} className="text-xs font-semibold text-cyan-600">
                            {center.phone && center.phone !== 'unknown' ? center.phone : 'Уточняйте по запросу'}
                          </a>
                        </div>
                        <button onClick={copyPhone} className="p-1 hover:text-cyan-600 text-gray-400 transition-colors">
                          {copied ? <CheckCircle2 size={13} className="text-green-500" /> : <Copy size={13} />}
                        </button>
                      </div>
                      {center.phone && (
                        <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <MessageCircle size={15} className="text-[#25D366] shrink-0" />
                            <a href={`https://wa.me/${center.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#25D366] hover:underline">
                              Написать в WhatsApp
                            </a>
                          </div>
                          <ExternalLink size={12} className="text-gray-300 shrink-0" />
                        </div>
                      )}
                      <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Clock size={15} className="text-cyan-600 shrink-0" />
                          <span className="text-xs text-gray-800">{center.workingHours || 'Уточняйте по телефону'}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium">Ежедневно</span>
                      </div>
                      {center.website && (
                        <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <Globe size={15} className="text-cyan-600 shrink-0" />
                            <a href={center.website} target="_blank" rel="noreferrer" className="text-xs text-cyan-600 hover:underline truncate max-w-[200px]">
                              {center.website.replace(/^https?:\/\//, '')}
                            </a>
                          </div>
                          <ExternalLink size={12} className="text-gray-300 shrink-0" />
                        </div>
                      )}
                    </div>

                    {/* Price list */}
                    {center.price_list && center.price_list.length > 0 && (
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4">
                        <h3 className="text-sm font-bold text-emerald-900 mb-3 flex items-center gap-1.5">
                          <Banknote size={15} className="text-emerald-600" /> Цены на услуги
                        </h3>
                        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                          {center.price_list.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs border-b border-dashed border-gray-200 pb-1.5 last:border-0 last:pb-0">
                              <span className="text-gray-600 font-medium text-left pr-2">{item.service}</span>
                              <span className="font-bold text-emerald-700 whitespace-nowrap">
                                {item.price === 0 ? 'Бесплатно' : `${item.price.toLocaleString('ru-RU')} ${item.currency}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Programs, Advantages, and Reviews */}
                  <div className="flex flex-col gap-4">
                    {/* Programs */}
                    {programs.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-2">Программы реабилитации</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {programs.map((p) => (
                            <span key={p} className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Advantages */}
                    {center.advantages && center.advantages.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-2">Преимущества центра</h3>
                        <div className="flex flex-col gap-1.5">
                          {center.advantages.map((adv) => (
                            <div key={adv} className="flex items-start gap-2">
                              <CheckCircle2 size={14} className="text-green-500 shrink-0 mt-0.5" />
                              <span className="text-xs text-gray-700 leading-snug">{adv}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reviews */}
                    {center.reviews && center.reviews.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-2">Отзывы</h3>
                        <div className="flex flex-col gap-2">
                          {center.reviews.slice(0, 2).map((rev, i) => (
                            <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-gray-900">{rev.author || 'Пациент'}</span>
                                <div className="flex items-center gap-0.5">
                                  {Array.from({ length: rev.rating || 0 }).map((_, j) => (
                                    <Star key={j} size={11} className="fill-yellow-400 text-yellow-400" />
                                  ))}
                                </div>
                              </div>
                              <p className="text-xs text-gray-600 leading-relaxed">{rev.text || ''}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Bottom Action Buttons */}
            <div className={`flex-shrink-0 px-5 pt-3 border-t border-gray-100 flex flex-col gap-2 ${
              center.image ? 'w-full' : 'lg:flex-row'
            }`}
              style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
              <button
                type="button"
                onClick={onShowOnMap}
                className="w-full flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-all shadow-md active:scale-[0.97]"
              >
                <MapPin size={15} /> Показать на карте
              </button>
              <div className={`flex gap-2 ${center.image ? 'w-full' : 'lg:flex-1'}`}>
                <a
                  href={`tel:${center.phone}`}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-all active:scale-[0.97]"
                >
                  <Phone size={13} className="text-cyan-600" /> Позвонить
                </a>
                {center.phone && (
                  <a
                    href={`https://wa.me/${center.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold text-white bg-[#25D366] hover:bg-[#1ebe5c] transition-all active:scale-[0.97]"
                  >
                    <MessageCircle size={13} /> WhatsApp
                  </a>
                )}
              </div>
            </div>

          </div>

          {/* Right Image Column on Desktop */}
          {center.image && (
            <div className="hidden lg:block lg:w-1/2 h-full relative overflow-hidden bg-gray-100 border-l border-gray-100 shrink-0">
              <img
                src={center.image}
                alt={center.name}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 backdrop-blur hover:bg-white text-gray-800 shadow-md flex items-center justify-center transition-all z-20 active:scale-90"
              >
                <X size={16} />
              </button>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}

/* ─── Rehab Card ────────────────────────────────────────────── */
function RehabCard({
  center, isActive, isFavorite,
  onOpen, onToggleFavorite, onHover, onLeave
}: {
  center: RehabCenter;
  isActive: boolean;
  isFavorite: boolean;
  onOpen: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onHover: () => void;
  onLeave: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      onClick={onOpen}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`bg-white rounded-2xl border cursor-pointer transition-all flex flex-col overflow-hidden shadow-sm ${
        isActive
          ? 'border-cyan-500 shadow-[0_0_0_3px_rgba(6,182,212,0.10)] shadow-md'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
      }`}
    >
      {/* Image or placeholder */}
      <div className="relative h-36 bg-gradient-to-br from-cyan-50 via-cyan-100 to-teal-50 flex items-center justify-center overflow-hidden">
        {center.image ? (
          <img src={center.image} alt={center.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-cyan-200/60 flex items-center justify-center">
            <Dumbbell size={28} className="text-cyan-600" />
          </div>
        )}
        {/* Status badge */}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-600 text-white">
            Реабилитация
          </span>
          {center.open !== undefined && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
              center.open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full inline-block ${center.open ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`} />
              {center.open ? 'Открыто' : 'Закрыто'}
            </span>
          )}
        </div>
        {/* Favorite button */}
        <button
          onClick={onToggleFavorite}
          className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
        >
          <Heart size={13} className={isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
        </button>
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-2 p-4">
        <h3 className="text-sm font-bold text-gray-900 leading-tight line-clamp-2">{center.name || 'Центр'}</h3>

        {/* Rating + distance */}
        <div className="flex items-center gap-3 flex-wrap">
          <StarRating rating={center.rating} />
          <span className="text-xs text-gray-400">{center.reviewCount || 0} отз.</span>
          {center.distance != null && (
            <span className="flex items-center gap-0.5 text-xs text-gray-500 font-medium ml-auto">
              <MapPin size={10} className="text-gray-400" />
              {center.distance} км
            </span>
          )}
        </div>

        {/* Programs chips */}
        <div className="flex flex-wrap gap-1.5">
          {(center.programs ?? center.services ?? []).slice(0, 3).map((p) => (
            <span key={p} className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-700 border border-cyan-100">
              {p}
            </span>
          ))}
          {(center.programs ?? center.services ?? []).length > 3 && (
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 border border-gray-200">
              +{(center.programs ?? center.services ?? []).length - 3}
            </span>
          )}
        </div>

        {/* Quick info + price */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
            <Clock size={10} className="text-gray-400" />
            {center.workingHours?.split(',')[0]}
          </span>
          {center.priceFrom !== undefined && (
            <span className="ml-auto flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-1.5 py-0.5">
              <Banknote size={10} />
              {center.priceFrom === 0 ? 'Бесплатно' : `от ${center.priceFrom.toLocaleString('ru-RU')} ₸`}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-1.5">
          <a href={`tel:${center.phone}`} onClick={(e) => e.stopPropagation()}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 transition-all active:scale-95">
            <Phone size={12} /> Звонок
          </a>
          {center.phone && (
            <a href={`https://wa.me/${center.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl text-xs font-bold text-white bg-[#25D366] hover:bg-[#1ebe5c] transition-all active:scale-95">
              <MessageCircle size={12} />
            </a>
          )}
          <button onClick={onOpen}
            className="flex items-center justify-center py-2 px-3 rounded-xl text-xs font-bold text-cyan-600 bg-cyan-50 hover:bg-cyan-100 border border-cyan-100 transition-all active:scale-95">
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </motion.div>
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
  const [showMapSheet, setShowMapSheet] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('mediroute_rehab_favorites');
      if (stored) setFavorites(JSON.parse(stored));
    } catch (_) {}
  }, []);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id];
    setFavorites(updated);
    window.localStorage.setItem('mediroute_rehab_favorites', JSON.stringify(updated));
  };

  const enriched: RehabCenter[] = (rehabsData as unknown as RehabCenter[]).map((c) => ({
    ...c,
    distance: (c.lat && c.lng) ? getDistanceFromHub(c.lat, c.lng) : undefined,
    open: isOpenNow(c.workingHours),
  }));

  const filtered = enriched
    .filter((c) => {
      const q = search.toLowerCase();
      const matchSearch =
        c.name.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        (c.programs ?? c.services ?? []).some((s: string) => s.toLowerCase().includes(q));

      const allTexts = [
        c.name,
        c.description ?? '',
        c.type ?? '',
        ...(c.services ?? []),
        ...(c.departments ?? []),
        ...(c.programs ?? [])
      ].map(t => t.toLowerCase());

      let matchCat = false;
      if (category === 'Все') {
        matchCat = true;
      } else if (category === 'После инсульта') {
        matchCat = allTexts.some(t => t.includes('инсульт'));
      } else if (category === 'После операции / травмы') {
        matchCat = allTexts.some(t => t.includes('травм') || t.includes('операци') || t.includes('эндопротезиров'));
      } else if (category === 'Детская реабилитация') {
        matchCat = c.type === 'children_rehabilitation_center' ||
                   allTexts.some(t => t.includes('детск') || t.includes('логопед') || t.includes('дефектолог') || t.includes('дцп') || t.includes('рас') || t.includes('аутизм'));
      } else if (category === 'Лечение зависимостей (алкоголизм и др.)') {
        matchCat = c.type === 'addiction_rehabilitation_center' ||
                   allTexts.some(t => t.includes('зависимост') || t.includes('алкогол') || t.includes('наркоман') || t.includes('запоя') || t.includes('кодировани'));
      } else if (category === 'Неврология и ортопедия') {
        matchCat = allTexts.some(t => t.includes('невролог') || t.includes('ортопед') || t.includes('сустав') || t.includes('позвоночник') || t.includes('грыж') || t.includes('остеохондроз') || t.includes('спин'));
      }

      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (sortBy === 'distance') return (a.distance ?? 999) - (b.distance ?? 999);
      return (b.rating ?? 0) - (a.rating ?? 0);
    });

  const mapMarkers = filtered
    .filter((c): c is RehabCenter & { lat: number; lng: number } => c.lat != null && c.lng != null)
    .map((c) => ({
      id: c.id, name: c.name, address: c.address,
      rating: c.rating ?? 0, lat: c.lat, lng: c.lng,
      type: 'rehab' as const,
    }));

  const mapCenter: [number, number] = activeRehabId
    ? (() => { const f = filtered.find((c) => c.id === activeRehabId); return (f?.lat && f?.lng) ? [f.lat, f.lng] : [42.3167, 69.5833]; })()
    : (filtered.length > 0 && filtered[0].lat && filtered[0].lng) ? [filtered[0].lat as number, filtered[0].lng as number] : [42.3167, 69.5833];

  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* Left: List */}
      <div className="flex-1 overflow-y-auto lg:max-w-[56%] flex flex-col">

        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Реабилитационные центры</h2>
              <p className="text-xs text-gray-500 mt-0.5">Поиск специализированных центров Шымкента</p>
            </div>
          </div>

          {/* Prominent search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Поиск реабилитационных программ, центров, услуг..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all placeholder-gray-400"
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-300 hover:bg-gray-400 flex items-center justify-center transition-colors">
                <X size={11} className="text-white" />
              </button>
            )}
          </div>

          {/* Category filters scroll */}
          <div className="flex items-center gap-2 flex-wrap">
            <SlidersHorizontal size={13} className="text-gray-400 shrink-0" />
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar shrink-0 max-w-[calc(100%-80px)]">
              {CATEGORY_FILTERS.map((cat) => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all border whitespace-nowrap ${
                    category === cat
                      ? 'bg-cyan-600 text-white border-transparent shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
            <div className="ml-auto flex rounded-xl border border-gray-200 bg-gray-50 p-0.5 text-xs">
              {(['rating', 'distance'] as const).map((s) => (
                <button key={s} onClick={() => setSortBy(s)}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${sortBy === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                  {s === 'rating' ? 'Рейтинг' : 'Расстояние'}
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          {search && (
            <p className="text-xs text-gray-500">
              Найдено: <span className="font-bold text-gray-800">{filtered.length}</span> центров
            </p>
          )}
        </div>

        {/* Cards grid */}
        <div className="p-5">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Search size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">Центры не найдены</p>
              <p className="text-xs mt-1">Попробуйте изменить запрос</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {filtered.map((rehab) => (
                <RehabCard
                  key={rehab.id}
                  center={rehab}
                  isActive={activeRehabId === rehab.id}
                  isFavorite={favorites.includes(rehab.id)}
                  onOpen={() => { setActiveRehabId(rehab.id); setDrawerRehab(rehab); }}
                  onToggleFavorite={(e) => toggleFavorite(rehab.id, e)}
                  onHover={() => setHoveredRehabId(rehab.id)}
                  onLeave={() => setHoveredRehabId(null)}
                />
              ))}
            </div>
          )}
          <div className="text-[10px] text-gray-400 mt-6 pt-4 border-t border-gray-100 text-center">
            Данные центров обновлены: Июль 2026
          </div>
        </div>
      </div>

      {/* Mobile "Открыть карту" button */}
      <div className="lg:hidden px-5 pb-4">
        <button
          type="button"
          onClick={() => setShowMapSheet(true)}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white border-2 border-[#DCE5EE] text-cyan-600 font-bold text-sm active:scale-[0.98] transition-all"
        >
          <MapPin size={16} />
          Открыть карту
        </button>
      </div>

      {/* Desktop map */}
      <div className="hidden lg:flex lg:flex-1 h-full border-l border-gray-200 relative bg-gray-50">
        <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl text-xs font-medium text-gray-700 shadow-sm flex items-center gap-1.5 border border-gray-200">
          <MapPin size={11} className="text-cyan-600" /> Шымкент, Казахстан
        </div>
        {search && (
          <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl text-xs font-semibold text-cyan-600 shadow-sm border border-gray-200">
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

      {/* Mobile map bottom sheet */}
      {showMapSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden" onClick={() => setShowMapSheet(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative z-10 bg-white rounded-t-3xl overflow-hidden"
            style={{ height: '88vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-50 flex items-center justify-center">
                  <MapPin size={15} className="text-cyan-600" />
                </div>
                <span className="font-bold text-[#172033] text-sm">Центры на карте</span>
              </div>
              <button
                onClick={() => setShowMapSheet(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-lg leading-none"
              >
                ×
              </button>
            </div>
            <div className="h-full">
              <DashboardMap
                center={mapCenter}
                markers={mapMarkers}
                activeMarkerId={activeRehabId}
                hoveredMarkerId={hoveredRehabId}
                onSelectMarker={(id) => {
                  setActiveRehabId(id);
                  const found = enriched.find((c) => c.id === id);
                  if (found) { setDrawerRehab(found); setShowMapSheet(false); }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Drawer */}
      <AnimatePresence>
        {drawerRehab && (
          <RehabDrawer center={drawerRehab} onClose={() => setDrawerRehab(null)} onShowOnMap={() => setShowMapSheet(true)} />
        )}
      </AnimatePresence>
    </div>
  );
}
