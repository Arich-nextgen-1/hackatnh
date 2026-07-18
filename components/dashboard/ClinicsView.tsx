'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Phone, MapPin, Clock, ChevronRight, Building2, SlidersHorizontal } from 'lucide-react';
import { clinics } from '@/lib/data/clinics';
import { Clinic } from '@/lib/types';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={11}
          className={s <= Math.round(rating) ? 'star-filled fill-current' : 'text-[#DCE5EE] fill-current'}
        />
      ))}
    </div>
  );
}

function ClinicCard({ clinic, delay }: { clinic: Clinic; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      whileHover={{ y: -2, boxShadow: '0 12px 24px -6px rgb(23 32 51 / 0.1)' }}
      className="bg-card rounded-2xl border border-[#DCE5EE] p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.06)] card-hover"
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
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                clinic.type === 'private' ? 'badge-accent' : 'badge-success'
              }`}
            >
              {clinic.type === 'private' ? 'Частная' : 'Государственная'}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-bold text-[#172033]">{clinic.rating}</div>
          <StarRating rating={clinic.rating} />
          <div className="text-[10px] text-[#94A3B8] mt-0.5">{clinic.reviewCount} отз.</div>
        </div>
      </div>

      <p className="text-xs text-[#64748B] leading-relaxed mb-4 line-clamp-2">
        {clinic.description}
      </p>

      <div className="flex flex-col gap-1.5 mb-4">
        <div className="flex items-center gap-2 text-xs text-[#64748B]">
          <MapPin size={11} className="text-[#94A3B8] shrink-0" />
          <span className="truncate">{clinic.address}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#64748B]">
          <Phone size={11} className="text-[#94A3B8] shrink-0" />
          <span>{clinic.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#64748B]">
          <Clock size={11} className="text-[#94A3B8] shrink-0" />
          <span>{clinic.workingHours}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {clinic.specializations.slice(0, 3).map((spec) => (
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
        id={`clinic-details-${clinic.id}`}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-[#2563EB] bg-[#EEF3F8] hover:bg-[#E2EBF4] border border-[#DCE5EE] hover:border-[#B8CADF] transition-all"
      >
        Подробнее <ChevronRight size={13} />
      </button>
    </motion.div>
  );
}

export default function ClinicsView() {
  const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all');

  const filtered = clinics.filter((c) => filter === 'all' || c.type === filter);

  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* Left: list */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-7 lg:max-w-[55%]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-5"
        >
          <div>
            <h2 className="text-xl font-bold text-[#172033]">Клиники</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              {filtered.length} из {clinics.length} клиник • Шымкент
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-[#94A3B8]" />
            <div className="flex rounded-xl border border-[#DCE5EE] bg-[#EEF3F8] p-0.5 text-xs">
              {([['all', 'Все'], ['public', 'Гос.'], ['private', 'Частные']] as const).map(
                ([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setFilter(val)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                      filter === val
                        ? 'bg-card text-[#172033] shadow-[0_1px_2px_0_rgb(0,0,0,0.08)]'
                        : 'text-[#64748B] hover:text-[#172033]'
                    }`}
                  >
                    {label}
                  </button>
                )
              )}
            </div>
          </div>
        </motion.div>

        {/* Cards grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((clinic, i) => (
            <ClinicCard key={clinic.id} clinic={clinic} delay={i * 0.06} />
          ))}
        </div>
      </div>

      {/* Right: Map */}
      <div className="lg:flex-1 h-64 lg:h-full border-t lg:border-t-0 lg:border-l border-[#DCE5EE] relative bg-[#EEF3F8]">
        <div className="absolute top-3 left-3 z-10 glass px-3 py-2 rounded-xl text-xs font-medium text-[#172033] shadow-card-sm">
          📍 Шымкент, Казахстан
        </div>
        <iframe
          src="https://www.openstreetmap.org/export/embed.html?bbox=69.45%2C42.25%2C69.72%2C42.40&layer=mapnik"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          title="Карта Шымкента"
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
