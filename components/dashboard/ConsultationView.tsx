'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, MessageSquare, Activity, Stethoscope, Brain } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

const suggestions = [
  { icon: Activity, text: 'Боли в груди и одышка при нагрузке' },
  { icon: Brain, text: 'Частые головные боли и головокружения' },
  { icon: Stethoscope, text: 'Повышенное давление уже месяц' },
  { icon: MessageSquare, text: 'Нужна консультация невролога' },
];

export default function ConsultationView() {
  const { profile } = useProfile();
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!message.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h2 className="text-2xl font-bold text-[#172033] mb-1.5">AI Консультация</h2>
        <p className="text-sm text-[#64748B]">
          Опишите вашу ситуацию подробно — AI проанализирует и предложит маршрут лечения.
        </p>
      </motion.div>

      {/* Profile context */}
      {profile && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07 }}
          className="flex items-center gap-3 px-4 py-3 bg-card rounded-xl border border-[#DCE5EE] shadow-[0_1px_2px_0_rgb(0,0,0,0.04)] mb-5"
        >
          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-[#172033] truncate">{profile.name}</div>
            <div className="text-[11px] text-[#94A3B8]">
              {profile.age} лет · {profile.gender === 'male' ? 'М' : profile.gender === 'female' ? 'Ж' : '—'} · {profile.city}
              {profile.chronicDiseases ? ` · ${profile.chronicDiseases.split(',')[0].trim()}` : ''}
            </div>
          </div>
          <span className="badge-primary text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0">
            Профиль загружен
          </span>
        </motion.div>
      )}

      {/* Suggestions */}
      {!submitted && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="grid grid-cols-2 gap-2.5 mb-5"
        >
          {suggestions.map((s) => (
            <button
              key={s.text}
              onClick={() => setMessage(s.text)}
              className="flex items-start gap-2.5 p-3.5 rounded-xl bg-card border border-[#DCE5EE] hover:border-[#2563EB]/30 hover:shadow-[0_2px_8px_0_rgb(37_99_235_/_0.08)] text-left transition-all group"
            >
              <s.icon size={14} className="text-[#94A3B8] group-hover:text-[#2563EB] mt-0.5 shrink-0 transition-colors" />
              <span className="text-xs text-[#64748B] group-hover:text-[#172033] transition-colors leading-relaxed">
                {s.text}
              </span>
            </button>
          ))}
        </motion.div>
      )}

      {/* Input */}
      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.18 }}
            className="bg-card rounded-2xl border border-[#DCE5EE] shadow-[0_1px_3px_0_rgb(0,0,0,0.06)] p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-[#2563EB]" />
              <span className="text-xs font-semibold text-[#172033]">Опишите ситуацию</span>
            </div>
            <textarea
              id="consultation-message"
              placeholder="Например: У меня 3 дня болит правый бок, температура 37.5°C, тошнота. Боль усиливается после еды..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="w-full input-field rounded-xl px-4 py-3 text-sm resize-none mb-4 leading-relaxed"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#94A3B8]">{message.length}/2000</span>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={!message.trim()}
                id="consultation-submit"
                className={`btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold ${
                  !message.trim() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Отправить на анализ <ArrowRight size={15} />
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="response"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4"
          >
            {/* User message */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                {profile?.name?.charAt(0).toUpperCase() ?? 'П'}
              </div>
              <div className="flex-1 bg-card rounded-2xl border border-[#DCE5EE] px-4 py-3.5 shadow-[0_1px_3px_0_rgb(0,0,0,0.06)]">
                <p className="text-sm text-[#172033] leading-relaxed">{message}</p>
              </div>
            </div>

            {/* AI response stub */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#EEF3F8] border border-[#DCE5EE] flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={14} className="text-[#2563EB]" />
              </div>
              <div className="flex-1 bg-card rounded-2xl border border-[#2563EB]/15 px-4 py-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.06)]">
                <div className="text-xs font-semibold text-[#2563EB] mb-2.5">MediRoute AI</div>
                <p className="text-sm text-[#64748B] leading-relaxed mb-3">
                  Ваш запрос получен и обработан. Для полноценного анализа симптомов
                  и персонализированной маршрутизации требуется подключение AI-модуля.
                </p>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#EEF3F8] border border-[#DCE5EE]">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                  <span className="text-xs font-medium text-[#64748B]">
                    Анализ станет доступен после подключения AI · Q3 2025
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => { setSubmitted(false); setMessage(''); }}
              className="self-start text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium transition-colors px-1"
            >
              ← Новый запрос
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
