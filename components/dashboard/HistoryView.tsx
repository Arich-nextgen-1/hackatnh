'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History, Sparkles, Calendar, MapPin, Stethoscope,
  ArrowRight, Trash2, FileDown, MoreHorizontal, Star,
  Download, Filter, Clock, CheckCircle2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import clinicsData from '@/data/clinics.json';
import rehabsData from '@/data/rehabilitation.json';
import { generateAndPrintPDF } from '@/lib/pdfGenerator';

interface SavedRoute {
  route: any;
  date: string;
  query?: string;
  id?: string;
  specialist?: string;
  urgency?: string;
}

type FilterTab = 'all' | 'planned' | 'today' | 'completed';

function StatusPill({ urgency }: { urgency?: string }) {
  if (urgency === 'high' || urgency === 'Срочно')
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-100">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        Срочно
      </span>
    );
  if (urgency === 'medium' || urgency === 'Желательно сегодня')
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        Желательно сегодня
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      Планово
    </span>
  );
}

function formatDate(raw: string) {
  if (!raw) return '—';
  let d = new Date(raw);
  if (isNaN(d.getTime())) {
    const matchTime = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})(?:\s*г\.)?[,\s]+(\d{2}):(\d{2})/i);
    if (matchTime) {
      d = new Date(parseInt(matchTime[3]), parseInt(matchTime[2]) - 1, parseInt(matchTime[1]), parseInt(matchTime[4]), parseInt(matchTime[5]));
    } else {
      const matchDate = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
      if (matchDate) {
        d = new Date(parseInt(matchDate[3]), parseInt(matchDate[2]) - 1, parseInt(matchDate[1]));
      }
    }
  }
  if (isNaN(d.getTime())) return 'Недавно';
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return `Сегодня, ${d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
  if (diffDays === 1) return `Вчера, ${d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getSpecialistIcon(specialist: string) {
  const s = specialist.toLowerCase();
  if (s.includes('ортопед') || s.includes('хирург') || s.includes('травматолог')) return '🦴';
  if (s.includes('кардио')) return '❤️';
  if (s.includes('невролог') || s.includes('нейро')) return '🧠';
  if (s.includes('окулист') || s.includes('офтальмолог')) return '👁️';
  if (s.includes('дерматолог')) return '🩺';
  if (s.includes('педиатр')) return '👶';
  if (s.includes('гинеколог')) return '🌸';
  if (s.includes('стоматолог')) return '🦷';
  return '🩺';
}

function ContextMenu({ onDelete, onDownload, onView }: { onDelete: () => void; onDownload: () => void; onView: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-[#64748B] hover:bg-[#F1F5F9] transition-all"
        style={{ minHeight: 'unset', minWidth: 'unset' }}
      >
        <MoreHorizontal size={16} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-10 z-20 w-44 bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#E8EDF7] overflow-hidden"
            >
              <button
                onClick={(e) => { e.stopPropagation(); onView(); setOpen(false); }}
                className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[12.5px] font-medium text-[#172033] hover:bg-[#F7FAFF] transition-colors"
                style={{ minHeight: 'unset', minWidth: 'unset' }}
              >
                <ArrowRight size={13} className="text-[#2563EB]" />
                Открыть маршрут
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDownload(); setOpen(false); }}
                className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[12.5px] font-medium text-[#172033] hover:bg-[#F7FAFF] transition-colors"
                style={{ minHeight: 'unset', minWidth: 'unset' }}
              >
                <FileDown size={13} className="text-[#64748B]" />
                Скачать PDF
              </button>
              <div className="h-px bg-[#E8EDF7] mx-2" />
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); setOpen(false); }}
                className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[12.5px] font-medium text-red-500 hover:bg-red-50 transition-colors"
                style={{ minHeight: 'unset', minWidth: 'unset' }}
              >
                <Trash2 size={13} />
                Удалить
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HistoryView() {
  const [history, setHistory] = useState<SavedRoute[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
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
  };

  const filterTabs: { key: FilterTab; label: string; icon: any }[] = [
    { key: 'all', label: 'Все записи', icon: Filter },
    { key: 'planned', label: 'Плановые', icon: CheckCircle2 },
    { key: 'today', label: 'Желательно сегодня', icon: Clock },
    { key: 'completed', label: 'Завершённые', icon: History },
  ];

  const filteredHistory = history.filter((item) => {
    const route = item.route ?? item;
    const urgency = route.urgency ?? item.urgency;
    if (activeFilter === 'all') return true;
    if (activeFilter === 'planned') return !urgency || urgency === 'low';
    if (activeFilter === 'today') return urgency === 'medium' || urgency === 'Желательно сегодня';
    if (activeFilter === 'completed') return urgency === 'high' || urgency === 'Срочно';
    return true;
  });

  /* ─── Empty State ─────────────────────── */
  if (history.length === 0) {
    return (
      <div className="flex-1 min-h-screen" style={{ background: '#F7FAFF' }}>
        <div className="p-8 lg:p-10 max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight leading-tight">История маршрутов</h1>
            <p className="text-[#64748B] text-sm mt-1.5">Все консультации и сохранённые маршруты</p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-[24px] border border-[#E8EDF7] shadow-[0_2px_20px_rgba(15,23,42,0.06)] p-16 flex flex-col items-center text-center"
          >
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-[18px] bg-gradient-to-br from-[#EEF3F8] to-[#E0EEFF] border border-[#E8EDF7] flex items-center justify-center shadow-sm">
                <History size={26} className="text-[#2563EB]" />
              </div>
              <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center shadow-sm">
                <Sparkles size={10} className="text-white" />
              </div>
            </div>
            <h2 className="text-[18px] font-bold text-[#0F172A] mb-2">История пуста</h2>
            <p className="text-[13.5px] text-[#64748B] leading-relaxed mb-8 max-w-sm">
              После завершения консультации нажмите <strong className="text-[#0F172A]">«Сохранить маршрут»</strong> — и он появится здесь.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[14px] text-sm font-semibold text-white bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] hover:shadow-[0_4px_16px_rgba(37,99,235,0.35)] transition-all duration-200 active:scale-[0.97]"
              style={{ minHeight: 'unset', minWidth: 'unset' }}
            >
              <Stethoscope size={14} />
              Начать консультацию
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  /* ─── Main History List ─────────────────── */
  return (
    <div className="flex-1 min-h-screen" style={{ background: '#F7FAFF' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .history-card {
          transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
        }
        .history-card:hover {
          box-shadow: 0 8px 32px rgba(15,23,42,0.10);
          border-color: #DBEAFE;
          transform: translateY(-1px);
        }
        .filter-chip {
          transition: all 0.15s ease;
          white-space: nowrap;
        }
        .open-btn {
          background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
          transition: all 0.2s ease;
        }
        .open-btn:hover {
          box-shadow: 0 4px 16px rgba(37,99,235,0.35);
          transform: translateY(-1px);
        }
        .open-btn:active {
          transform: scale(0.97);
        }
        .export-btn {
          transition: all 0.15s ease;
        }
        .export-btn:hover {
          background: #F1F5F9;
          border-color: #CBD5E1;
        }
      `}} />

      <div className="p-8 lg:p-10 max-w-4xl mx-auto">

        {/* ── Page Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-start justify-between mb-8 gap-4 flex-wrap"
        >
          <div>
            <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight leading-tight">
              История маршрутов
            </h1>
            <p className="text-[#64748B] text-sm mt-1.5">
              Все консультации и сохранённые маршруты
            </p>
          </div>
          <button
            onClick={() => {
              const exportData = history.map((item, i) => {
                const route = item.route ?? item;
                return `${i + 1}. ${route.specialist ?? 'Специалист'} — ${item.query ?? 'Консультация'} (${formatDate(item.date)})`;
              }).join('\n');
              const blob = new Blob([exportData], { type: 'text/plain;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'mediroute_history.txt';
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="export-btn inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] text-[13px] font-semibold text-[#475569] bg-white border border-[#E8EDF7] shadow-sm"
            style={{ minHeight: 'unset', minWidth: 'unset' }}
          >
            <Download size={14} />
            Экспорт истории
          </button>
        </motion.div>

        {/* ── Filter Chips ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="flex gap-2 mb-7 overflow-x-auto pb-1 scrollbar-none"
          style={{ scrollbarWidth: 'none' }}
        >
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`filter-chip inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12.5px] font-semibold border ${
                  isActive
                    ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-[0_2px_8px_rgba(37,99,235,0.25)]'
                    : 'bg-white text-[#64748B] border-[#E8EDF7] hover:border-[#DBEAFE] hover:text-[#2563EB]'
                }`}
                style={{ minHeight: 'unset', minWidth: 'unset' }}
              >
                <tab.icon size={12} />
                {tab.label}
                {tab.key === 'all' && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-[#EEF3F8] text-[#64748B]'}`}>
                    {history.length}
                  </span>
                )}
              </button>
            );
          })}
        </motion.div>

        {/* ── Card List ── */}
        <div className="flex flex-col gap-3.5">
          <AnimatePresence mode="popLayout">
            {filteredHistory.length === 0 ? (
              <motion.div
                key="empty-filter"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-[22px] border border-[#E8EDF7] p-10 text-center"
              >
                <p className="text-[#94A3B8] text-sm">Нет записей в этой категории</p>
              </motion.div>
            ) : (
              filteredHistory.map((item, displayIdx) => {
                const originalIdx = history.indexOf(item);
                const route = item.route ?? item;
                const specialist = route.specialist ?? item.specialist ?? 'Специалист';
                const urgency = route.urgency ?? item.urgency;
                const query = item.query ?? route.query ?? 'Консультация';
                const topClinicId = route.clinics?.[0] ?? null;
                const topClinic = topClinicId
                  ? (clinicsData as any[]).find((c) => c.id === topClinicId) ?? null
                  : route.recommended_clinics?.[0] ?? null;
                const clinicName = topClinic?.name ?? null;
                const clinicCity = topClinic?.city ?? topClinic?.address?.split(',')[0] ?? null;
                const clinicRating = topClinic?.rating ?? null;

                const handleDownloadPDF = () => {
                  generateAndPrintPDF({
                    date: item.date,
                    query: item.query || route.query || 'Консультация',
                    specialist: route.specialist || 'Специалист',
                    confidenceScore: route.confidence_score,
                    urgency: route.urgency,
                    reasons: route.reasons,
                    clinic: topClinic ? {
                      name: topClinic.name,
                      address: topClinic.address,
                      phone: topClinic.phone,
                      rating: topClinic.rating,
                    } : undefined,
                  });
                };

                return (
                  <motion.div
                    key={item.id ?? displayIdx}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.28, delay: displayIdx * 0.04 }}
                    className="history-card bg-white rounded-[22px] border border-[#E8EDF7] shadow-[0_2px_12px_rgba(15,23,42,0.05)] overflow-hidden"
                  >
                    <div className="flex items-center gap-4 p-6">

                      {/* Left: Icon + Timeline line */}
                      <div className="flex flex-col items-center shrink-0 self-stretch">
                        <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#EEF3F8] to-[#DBEAFE] border border-[#E8EDF7] flex items-center justify-center text-xl shadow-sm shrink-0">
                          {getSpecialistIcon(specialist)}
                        </div>
                        {displayIdx < filteredHistory.length - 1 && (
                          <div className="w-px flex-1 mt-3 bg-gradient-to-b from-[#DBEAFE] to-transparent min-h-[16px]" />
                        )}
                      </div>

                      {/* Center: Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="text-[15px] font-bold text-[#0F172A] tracking-tight">{specialist}</span>
                          <StatusPill urgency={urgency} />
                        </div>

                        <p className="text-[13px] text-[#475569] leading-relaxed line-clamp-1 mb-2.5 pr-4">
                          {query}
                        </p>

                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-1.5 text-[11.5px] text-[#94A3B8]">
                            <Calendar size={11} />
                            <span>{formatDate(item.date)}</span>
                          </div>
                          {clinicCity && (
                            <div className="flex items-center gap-1.5 text-[11.5px] text-[#94A3B8]">
                              <MapPin size={11} />
                              <span>{clinicCity}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-col items-end gap-3 shrink-0">
                        {/* Rating badge */}
                        {clinicRating && (
                          <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5">
                            <Star size={10} className="text-amber-400 fill-amber-400" />
                            <span className="text-[11px] font-bold text-amber-600">{clinicRating}</span>
                          </div>
                        )}

                        {/* Open route button */}
                        <button
                          onClick={() => router.push('/dashboard')}
                          className="open-btn inline-flex items-center gap-1.5 px-4 py-2 rounded-[12px] text-[12.5px] font-semibold text-white"
                          style={{ minHeight: 'unset', minWidth: 'unset' }}
                        >
                          Открыть маршрут
                          <ArrowRight size={13} />
                        </button>

                        {/* Three-dot context menu */}
                        <ContextMenu
                          onView={() => router.push('/dashboard')}
                          onDownload={handleDownloadPDF}
                          onDelete={() => deleteItem(originalIdx)}
                        />
                      </div>
                    </div>

                    {/* Clinic strip (if available) */}
                    {clinicName && (
                      <div className="mx-6 mb-5 flex items-center gap-2.5 bg-[#F7FAFF] border border-[#E8EDF7] rounded-[12px] px-3.5 py-2.5">
                        <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                          <MapPin size={11} className="text-[#2563EB]" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider leading-none mb-0.5">Рекомендованная клиника</div>
                          <div className="text-[12.5px] font-semibold text-[#0F172A] truncate">{clinicName}</div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Footer note */}
        <div className="text-center text-[11px] text-[#C1CDD8] mt-8 pb-4">
          Данные клиник обновлены: Июль 2026 · MediRoute AI
        </div>
      </div>
    </div>
  );
}
