'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History, Sparkles, Calendar, MapPin, Stethoscope,
  ArrowRight, ChevronDown, ChevronUp, Trash2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import clinicsData from '@/data/clinics.json';
import rehabsData from '@/data/rehabilitation.json';

interface SavedRoute {
  route: any;
  date: string;
  query?: string;
  // legacy fields
  id?: string;
  specialist?: string;
  urgency?: string;
}

function UrgencyBadge({ urgency }: { urgency?: string }) {
  if (urgency === 'high' || urgency === 'Срочно')
    return <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">🔴 Срочно</span>;
  if (urgency === 'medium' || urgency === 'Желательно сегодня')
    return <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">🟡 Желательно сегодня</span>;
  return <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">🟢 Планово</span>;
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export default function HistoryView() {
  const [history, setHistory] = useState<SavedRoute[]>([]);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('mediroute_history');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setHistory(parsed);
      }
    } catch (e) {
      console.error('Error loading history:', e);
    }
  }, []);

  const deleteItem = (idx: number) => {
    const updated = history.filter((_, i) => i !== idx);
    setHistory(updated);
    localStorage.setItem('mediroute_history', JSON.stringify(updated));
    if (expandedIdx === idx) setExpandedIdx(null);
  };

  /* ─── Empty State ─────────────────────── */
  if (history.length === 0) {
    return (
      <div className="p-6 lg:p-8 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full bg-card rounded-2xl border border-[#DCE5EE] shadow-[0_1px_3px_0_rgb(0,0,0,0.06)] p-10 text-center"
        >
          <div className="relative inline-flex mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[#EEF3F8] border border-[#DCE5EE] flex items-center justify-center">
              <History size={28} className="text-[#94A3B8]" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full gradient-primary flex items-center justify-center">
              <Sparkles size={11} className="text-white" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-[#172033] mb-2.5">История пуста</h2>
          <p className="text-sm text-[#64748B] leading-relaxed mb-8 max-w-sm mx-auto">
            После завершения консультации нажмите <strong>«Сохранить маршрут»</strong> — и он появится здесь.
          </p>

          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-all shadow-md shadow-blue-200"
          >
            <Stethoscope size={15} /> Начать консультацию
          </button>
        </motion.div>
      </div>
    );
  }

  /* ─── List ─────────────────────────────── */
  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#172033]">История маршрутов</h2>
          <p className="text-sm text-[#64748B] mt-0.5">{history.length} сохранённых консультаций</p>
        </div>
        <div className="text-[10px] text-[#94A3B8]">Данные клиник обновлены: Июль 2026</div>
      </div>

      <div className="flex flex-col gap-3">
        {history.map((item, i) => {
          const route = item.route ?? item; // handle both formats
          const specialist = route.specialist ?? item.specialist ?? 'Специалист';
          const urgency = route.urgency ?? item.urgency;
          const query = item.query ?? route.query ?? 'Консультация';
          const topClinicId = route.clinics?.[0] ?? null;
          const topClinic = topClinicId
            ? (clinicsData as any[]).find((c) => c.id === topClinicId)?.name ?? null
            : route.recommended_clinics?.[0]?.name ?? null;
          const isExpanded = expandedIdx === i;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className="bg-card border border-[#DCE5EE] rounded-2xl shadow-sm overflow-hidden"
            >
              {/* Card header */}
              <div
                onClick={() => setExpandedIdx(isExpanded ? null : i)}
                className="flex items-start gap-4 p-5 cursor-pointer hover:bg-[#EEF3F8]/30 transition-all select-none"
              >
                {/* Icon */}
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#EEF3F8] to-[#E2EBF4] border border-[#DCE5EE] flex items-center justify-center shrink-0">
                  <Stethoscope size={18} className="text-[#2563EB]" />
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="text-base font-bold text-[#172033]">{specialist}</span>
                    <UrgencyBadge urgency={urgency} />
                  </div>
                  <p className="text-sm text-[#64748B] truncate">{query}</p>
                  <div className="flex items-center gap-1 text-[11px] text-[#94A3B8] mt-1.5">
                    <Calendar size={11} />
                    {formatDate(item.date)}
                  </div>
                </div>

                {/* Expand toggle */}
                <div className="text-[#94A3B8] shrink-0">
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {/* Expanded details */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                  >
                    <div className="px-5 pb-5 pt-1 border-t border-[#EEF3F8] flex flex-col gap-4">

                      {/* Reasons */}
                      {route.reasons && route.reasons.length > 0 && (
                        <div className="bg-[#F8FAFC] border border-[#DCE5EE] rounded-xl p-4">
                          <div className="text-xs font-bold text-[#2563EB] mb-2">Обоснование</div>
                          <div className="flex flex-col gap-1.5">
                            {route.reasons.map((r: string, ri: number) => (
                              <div key={ri} className="flex items-start gap-2 text-sm text-[#64748B]">
                                <span className="text-emerald-500 font-bold shrink-0">✓</span>
                                <span>{r}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Top clinic */}
                      {topClinic && (
                        <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                          <MapPin size={15} className="text-[#2563EB] shrink-0" />
                          <div>
                            <div className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Рекомендованная клиника</div>
                            <div className="text-sm font-bold text-[#172033] mt-0.5">{topClinic}</div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push('/dashboard')}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-all"
                        >
                          Посмотреть маршрут <ArrowRight size={14} />
                        </button>
                        <button
                          onClick={() => deleteItem(i)}
                          className="w-11 h-11 rounded-xl flex items-center justify-center border border-[#DCE5EE] bg-white hover:bg-red-50 hover:border-red-200 text-[#94A3B8] hover:text-red-500 transition-all"
                          title="Удалить"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      <div className="text-center text-xs text-[#94A3B8] pt-2">
        Данные клиник обновлены: Июль 2026
      </div>
    </div>
  );
}
