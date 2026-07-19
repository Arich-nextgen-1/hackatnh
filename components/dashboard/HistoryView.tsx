'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Sparkles, Calendar, User, ChevronDown, ChevronUp, MapPin, Heart, Stethoscope, ArrowRight, HeartPulse } from 'lucide-react';
import clinicsData from '@/data/clinics.json';
import rehabsData from '@/data/rehabilitation.json';
import { useRouter } from 'next/navigation';

interface HistoryItem {
  id: string;
  date: string;
  query: string;
  response: string;
  route: {
    specialist: string;
    rehab_needed: boolean;
    clinics: string[];
    rehab_centers?: string[];
    reasons?: string[];
    urgency?: string;
  };
}

export default function HistoryView() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const router = useRouter();

  // Load history from LocalStorage
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('mediroute_history');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading history:', e);
    }
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getClinicName = (id: string) => {
    const found = clinicsData.find((c) => c.id === id);
    return found ? found.name : id;
  };

  const getRehabName = (id: string) => {
    const found = rehabsData.find((r) => r.id === id);
    return found ? found.name : id;
  };

  if (history.length === 0) {
    return (
      <div className="p-6 lg:p-8 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full bg-card rounded-2xl border border-[#DCE5EE] shadow-[0_1px_3px_0_rgb(0,0,0,0.06)] p-10 text-center"
        >
          {/* Icon */}
          <div className="relative inline-flex mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[#EEF3F8] border border-[#DCE5EE] flex items-center justify-center">
              <History size={28} className="text-[#94A3B8]" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full gradient-primary flex items-center justify-center">
              <Sparkles size={11} className="text-white" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-[#172033] mb-2.5">
            История пуста
          </h2>
          <p className="text-sm text-[#64748B] leading-relaxed mb-6 max-w-sm mx-auto">
            Ваши консультации с AI и результаты маршрутизации будут отображаться
            здесь после первой AI-консультации на Главной странице.
          </p>

          {/* Decorative placeholder items */}
          <div className="flex flex-col gap-2.5 mb-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#EEF3F8] border border-[#DCE5EE]"
                style={{ opacity: 1 - i * 0.2 }}
              >
                <div className="w-8 h-8 rounded-lg bg-[#DCE5EE] animate-pulse" />
                <div className="flex-1 text-left">
                  <div className="h-2.5 w-3/4 rounded bg-[#DCE5EE] mb-1.5 animate-pulse" />
                  <div className="h-2 w-1/2 rounded bg-[#E8EFF5] animate-pulse" />
                </div>
                <div className="h-2 w-12 rounded bg-[#DCE5EE] animate-pulse" />
              </div>
            ))}
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#EEF3F8] border border-[#DCE5EE]">
            <div className="w-2 h-2 rounded-full bg-[#2563EB]" />
            <span className="text-xs font-medium text-[#64748B]">
              История активируется при получении рекомендаций
            </span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold text-[#172033] mb-1.5">История консультаций</h2>
        <p className="text-sm text-[#64748B]">
          Здесь хранятся все ваши завершённые маршруты пациента и рекомендации.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {history.map((item, i) => {
          const isExpanded = expandedId === item.id;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="bg-card border border-[#DCE5EE] rounded-2xl shadow-sm overflow-hidden"
            >
              {/* Header block click to toggle expand */}
              <div
                onClick={() => toggleExpand(item.id)}
                className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-[#EEF3F8]/30 transition-all select-none"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 text-[10px] text-[#94A3B8] font-semibold mb-1">
                    <Calendar size={11} /> {item.date}
                    <span className="badge-primary px-2 py-0.5 rounded-full text-[9px]">
                      {item.route?.specialist || 'Консультация'}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#172033] truncate">
                    {item.query}
                  </h3>
                </div>
                <div className="text-[#94A3B8]">
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {/* Expander content */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                  >
                    <div className="px-5 pb-5 pt-3 border-t border-[#EEF3F8] flex flex-col gap-5">
                      {/* AI Response Text */}
                      <div className="bg-[#F8FAFC] border border-[#DCE5EE] rounded-xl p-4">
                        <div className="text-xs font-bold text-[#2563EB] mb-1.5 flex items-center gap-1.5">
                          <Sparkles size={12} /> Ответ AI
                        </div>
                        <p className="text-xs text-[#64748B] leading-relaxed whitespace-pre-line">
                          {item.response}
                        </p>
                      </div>

                      {/* Patient Route section structured as Boarding Pass */}
                      {item.route && (
                        <div className="flex flex-col gap-4">
                          <div className="bg-white border-2 border-dashed border-[#DCE5EE] rounded-2xl p-4 flex flex-col gap-3">
                            <div className="flex items-center justify-between border-b border-[#EEF3F8] pb-2">
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Маршрутный Лист</span>
                              <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest bg-[#EEF3F8] px-2 py-0.5 rounded">MEDROUTE AI</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-[11px]">
                              <div>
                                <div className="text-[8.5px] text-gray-400 font-bold uppercase">Специалист</div>
                                <div className="font-bold text-blue-600 mt-0.5">{item.route.specialist}</div>
                              </div>
                              <div>
                                <div className="text-[8.5px] text-gray-400 font-bold uppercase">Необходимость реабилитации</div>
                                <div className="font-semibold text-gray-700 mt-0.5">{item.route.rehab_needed ? 'Да' : 'Нет'}</div>
                              </div>
                            </div>

                            {/* Decision Reasons */}
                            {item.route.reasons && item.route.reasons.length > 0 && (
                              <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#DCE5EE] text-[11px] text-gray-600 flex flex-col gap-1">
                                {item.route.reasons.map((reason: string, ri: number) => (
                                  <div key={ri} className="flex items-start gap-1">
                                    <span className="text-blue-500 font-bold shrink-0">✓</span>
                                    <span>{reason}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Recommended clinics */}
                            {item.route.clinics && item.route.clinics.length > 0 && (
                              <div className="flex flex-col gap-1 border-t border-[#EEF3F8] pt-2">
                                <span className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wider">Рекомендуемые учреждения:</span>
                                {item.route.clinics.map((cId) => (
                                  <div key={cId} className="flex items-center gap-1.5 text-xs text-gray-700 font-semibold">
                                    <MapPin size={11} className="text-[#2563EB]" />
                                    <span>{getClinicName(cId)}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Recommended rehab centers */}
                            {item.route.rehab_needed && item.route.rehab_centers && item.route.rehab_centers.length > 0 && (
                              <div className="flex flex-col gap-1 border-t border-[#EEF3F8] pt-2">
                                <span className="text-[8.5px] font-bold text-cyan-600 uppercase tracking-wider">Реабилитационные центры:</span>
                                {item.route.rehab_centers.map((rId) => (
                                  <div key={rId} className="flex items-center gap-1.5 text-xs text-gray-700 font-semibold">
                                    <MapPin size={11} className="text-[#0891B2]" />
                                    <span>{getRehabName(rId)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Restore Consultation Button */}
                      <button
                        onClick={() => {
                          window.localStorage.setItem('mediroute_active_restore', JSON.stringify(item));
                          router.push('/dashboard');
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-[#2563EB] bg-[#EEF3F8] hover:bg-[#E2EBF4] border border-[#DCE5EE] hover:border-[#B8CADF] transition-all"
                      >
                        Восстановить консультацию в чате <ArrowRight size={13} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
