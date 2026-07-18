'use client';

import { motion } from 'framer-motion';
import { Star, Phone, MapPin, Clock, ChevronRight, Users, Dumbbell } from 'lucide-react';
import { rehabCenters } from '@/lib/data/rehab';
import { RehabCenter } from '@/lib/types';

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

function RehabCard({ center, delay }: { center: RehabCenter; delay: number }) {
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
          <div className="w-10 h-10 rounded-xl bg-[#F0FAFB] border border-[rgb(6_182_212_/_0.2)] flex items-center justify-center shrink-0">
            <Dumbbell size={17} className="text-[#06B6D4]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#172033] leading-tight mb-1">
              {center.name}
            </h3>
            <div className="flex items-center gap-1.5">
              <Users size={10} className="text-[#94A3B8]" />
              <span className="text-[10px] text-[#64748B]">
                Вместимость: {center.capacity} чел.
              </span>
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-bold text-[#172033]">{center.rating}</div>
          <StarRating rating={center.rating} />
          <div className="text-[10px] text-[#94A3B8] mt-0.5">{center.reviewCount} отз.</div>
        </div>
      </div>

      <p className="text-xs text-[#64748B] leading-relaxed mb-4 line-clamp-2">
        {center.description}
      </p>

      <div className="flex flex-col gap-1.5 mb-4">
        <div className="flex items-center gap-2 text-xs text-[#64748B]">
          <MapPin size={11} className="text-[#94A3B8] shrink-0" />
          <span className="truncate">{center.address}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#64748B]">
          <Phone size={11} className="text-[#94A3B8] shrink-0" />
          <span>{center.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#64748B]">
          <Clock size={11} className="text-[#94A3B8] shrink-0" />
          <span>{center.workingHours}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {center.programs.slice(0, 3).map((prog) => (
          <span
            key={prog}
            className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[rgb(6_182_212_/_0.07)] text-[#0891B2] border border-[rgb(6_182_212_/_0.15)]"
          >
            {prog}
          </span>
        ))}
        {center.programs.length > 3 && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#EEF3F8] text-[#94A3B8]">
            +{center.programs.length - 3}
          </span>
        )}
      </div>

      <button
        id={`rehab-details-${center.id}`}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-[#0891B2] bg-[rgb(6_182_212_/_0.07)] hover:bg-[rgb(6_182_212_/_0.12)] border border-[rgb(6_182_212_/_0.2)] transition-all"
      >
        Подробнее <ChevronRight size={13} />
      </button>
    </motion.div>
  );
}

export default function RehabView() {
  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* Left: list */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-7 lg:max-w-[55%]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-5"
        >
          <div>
            <h2 className="text-xl font-bold text-[#172033]">Реабилитационные центры</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              {rehabCenters.length} центров • Шымкент
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[rgb(6_182_212_/_0.08)] border border-[rgb(6_182_212_/_0.2)]">
            <Dumbbell size={12} className="text-[#06B6D4]" />
            <span className="text-xs font-medium text-[#0891B2]">Реабилитация</span>
          </div>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-4">
          {rehabCenters.map((center, i) => (
            <RehabCard key={center.id} center={center} delay={i * 0.06} />
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
          title="Карта реабилитационных центров Шымкента"
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
