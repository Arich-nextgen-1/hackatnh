'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Sparkles, Calendar, User, ChevronDown, ChevronUp, MapPin, Heart } from 'lucide-react';
import clinicsData from '@/data/clinics.json';
import rehabsData from '@/data/rehabilitation.json';

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
  };
}

export default function HistoryView() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
                    <div className="px-5 pb-5 pt-3 border-t border-[#EEF3F8] flex flex-col gap-4">
                      {/* AI Response Text */}
                      <div className="bg-[#F8FAFC] border border-[#DCE5EE] rounded-xl p-4">
                        <div className="text-xs font-bold text-[#2563EB] mb-1.5 flex items-center gap-1.5">
                          <Sparkles size={12} /> Ответ AI
                        </div>
                        <p className="text-xs text-[#64748B] leading-relaxed whitespace-pre-line">
                          {item.response}
                        </p>
                      </div>

                      {/* Patient Route section */}
                      {item.route && (
                        <div className="flex flex-col gap-2.5">
                          <div className="text-xs font-bold text-[#172033]">Назначенный маршрут:</div>
                          
                          {/* Doctor */}
                          <div className="flex items-center gap-2.5 px-3 py-2 bg-[#EEF3F8] rounded-xl border border-[#DCE5EE]">
                            <span className="text-sm">🩺</span>
                            <span className="text-xs font-semibold text-[#172033]">
                              Рекомендованный врач: {item.route.specialist}
                            </span>
                          </div>

                          {/* Clinics list */}
                          {item.route.clinics && item.route.clinics.length > 0 && (
                            <div className="flex flex-col gap-1.5 pl-1">
                              <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Клиники:</span>
                              {item.route.clinics.map((cId) => (
                                <div key={cId} className="flex items-center gap-2 text-xs text-[#64748B]">
                                  <MapPin size={11} className="text-[#94A3B8]" />
                                  <span>{getClinicName(cId)}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Rehab list */}
                          {item.route.rehab_needed && item.route.rehab_centers && item.route.rehab_centers.length > 0 && (
                            <div className="flex flex-col gap-1.5 pl-1 border-t border-[#F1F5F9] pt-2 mt-1">
                              <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Реабилитационные центры:</span>
                              {item.route.rehab_centers.map((rId) => (
                                <div key={rId} className="flex items-center gap-2 text-xs text-[#64748B]">
                                  <MapPin size={11} className="text-[#94A3B8]" />
                                  <span>{getRehabName(rId)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
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
